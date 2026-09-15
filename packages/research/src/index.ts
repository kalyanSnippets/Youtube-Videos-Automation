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
