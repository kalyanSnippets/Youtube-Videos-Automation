export interface SourceRef {
  title: string;
  publisher?: string;
  url?: string;
  publishedDate?: string;
  retrievedDate: string;
  sourceType: "OFFICIAL" | "INDEPENDENT" | "COMMUNITY" | "OUR_TEST";
  relevance?: string;
}

export interface WebSearchResult {
  query: string;
  sources: SourceRef[];
}

export interface YouTubeCompetitorVideo {
  url: string;
  title: string;
  channelName: string;
  viewCount?: number;
  publishedDate?: string;
}

/**
 * ResearchProvider is the single seam for anything that needs live external
 * information: web search, source retrieval, community sentiment, YouTube
 * competitor research. Agents call this interface, never a scraper or SDK
 * directly, so we can swap or disable integrations without touching agent
 * logic - and so we can guarantee we never fabricate a source when no real
 * research backend is connected.
 */
export interface ResearchProvider {
  readonly id: string;
  isAvailable(): boolean;
  webSearch(query: string): Promise<WebSearchResult>;
  youtubeCompetitorSearch(topic: string): Promise<YouTubeCompetitorVideo[]>;
  communityResearch(topic: string): Promise<SourceRef[]>;
}

/**
 * NotConnectedResearchProvider is the honest default: every method throws a
 * descriptive error rather than returning invented sources. The UI/agent
 * runner catches this and surfaces "Not connected yet" instead of pretending
 * research happened.
 */
export class NotConnectedResearchProvider implements ResearchProvider {
  readonly id = "NOT_CONNECTED";

  isAvailable(): boolean {
    return false;
  }

  async webSearch(): Promise<WebSearchResult> {
    throw new Error("Web research is not connected. Configure a research backend in Settings > Integrations.");
  }

  async youtubeCompetitorSearch(): Promise<YouTubeCompetitorVideo[]> {
    throw new Error("YouTube Data API is not connected. Configure it in Settings > Integrations.");
  }

  async communityResearch(): Promise<SourceRef[]> {
    throw new Error("Community research is not connected. Configure a research backend in Settings > Integrations.");
  }
}

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
}

interface TavilySearchResponse {
  results: TavilySearchResult[];
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: { title: string; channelTitle: string; publishedAt: string };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
}

interface YouTubeVideosResponse {
  items: { id: string; statistics: { viewCount?: string } }[];
}

/**
 * Real research provider: Tavily for web/community search, YouTube Data API v3 for
 * competitor video search. Each capability checks its own key independently and throws
 * the same descriptive "not connected" error as NotConnectedResearchProvider when that
 * specific key is missing, so a project can have one connected without the other.
 */
export class RealResearchProvider implements ResearchProvider {
  readonly id = "TAVILY_YOUTUBE";

  private get tavilyKey(): string | undefined {
    return process.env.TAVILY_API_KEY;
  }

  private get youtubeKey(): string | undefined {
    return process.env.YOUTUBE_API_KEY;
  }

  isAvailable(): boolean {
    return Boolean(this.tavilyKey) || Boolean(this.youtubeKey);
  }

  async webSearch(query: string): Promise<WebSearchResult> {
    if (!this.tavilyKey) {
      throw new Error("Web research is not connected. Configure TAVILY_API_KEY in Settings > Integrations.");
    }
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: this.tavilyKey,
        query,
        max_results: 8,
        search_depth: "advanced",
      }),
    });
    if (!response.ok) {
      throw new Error(`Tavily search failed (${response.status}): ${await response.text()}`);
    }
    const json = (await response.json()) as TavilySearchResponse;
    return {
      query,
      sources: json.results.map((r) => ({
        title: r.title,
        url: r.url,
        publishedDate: r.published_date,
        retrievedDate: new Date().toISOString(),
        sourceType: "INDEPENDENT",
        relevance: r.content?.slice(0, 500),
      })),
    };
  }

  async communityResearch(topic: string): Promise<SourceRef[]> {
    if (!this.tavilyKey) {
      throw new Error("Community research is not connected. Configure TAVILY_API_KEY in Settings > Integrations.");
    }
    const result = await this.webSearch(`${topic} reddit forum community opinion discussion review`);
    return result.sources.map((s) => ({ ...s, sourceType: "COMMUNITY" as const }));
  }

  async youtubeCompetitorSearch(topic: string): Promise<YouTubeCompetitorVideo[]> {
    if (!this.youtubeKey) {
      throw new Error("YouTube Data API is not connected. Configure YOUTUBE_API_KEY in Settings > Integrations.");
    }
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", topic);
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", "10");
    searchUrl.searchParams.set("order", "relevance");
    searchUrl.searchParams.set("key", this.youtubeKey);
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`YouTube search failed (${searchResponse.status}): ${await searchResponse.text()}`);
    }
    const searchJson = (await searchResponse.json()) as YouTubeSearchResponse;

    const videoIds = searchJson.items.map((i) => i.id.videoId).filter(Boolean);
    const viewCounts: Record<string, number> = {};
    if (videoIds.length > 0) {
      const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      statsUrl.searchParams.set("part", "statistics");
      statsUrl.searchParams.set("id", videoIds.join(","));
      statsUrl.searchParams.set("key", this.youtubeKey);
      const statsResponse = await fetch(statsUrl);
      if (statsResponse.ok) {
        const statsJson = (await statsResponse.json()) as YouTubeVideosResponse;
        for (const item of statsJson.items) {
          viewCounts[item.id] = Number(item.statistics.viewCount ?? 0);
        }
      }
    }

    return searchJson.items.map((i) => ({
      url: `https://www.youtube.com/watch?v=${i.id.videoId}`,
      title: i.snippet.title,
      channelName: i.snippet.channelTitle,
      viewCount: viewCounts[i.id.videoId],
      publishedDate: i.snippet.publishedAt,
    }));
  }
}

/** Resolve the research backend: RealResearchProvider if either TAVILY_API_KEY or YOUTUBE_API_KEY is set, otherwise the honest not-connected stub. */
export function resolveResearchProvider(): ResearchProvider {
  const provider = new RealResearchProvider();
  return provider.isAvailable() ? provider : new NotConnectedResearchProvider();
}
