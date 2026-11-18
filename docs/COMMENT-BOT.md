# Comment Bot: instant replies on YouTube and Instagram

The bot answers comments on your YouTube videos and Instagram posts and Reels within about a minute,
with no one watching.

| Someone comments… | YouTube | Instagram |
|---|---|---|
| A keyword from your Google Doc, e.g. `FABLE` | Public reply with the prompt | **DM** with the prompt + public reply "Sent! Check your DMs 📩" |
| A keyword **and** a question, e.g. `FABLE does it work on Windows?` | AI answer + the prompt, in one reply | AI answer + "check your DMs" publicly, prompt by DM |
| A question or compliment, e.g. `what mic do you use?` | Short AI reply | Short AI reply |
| Asks for a resource without the keyword ("can I get the prompt?") | The AI spots it and sends that prompt | Same, by DM |
| Spam, self-promo, hate, gibberish, or a bare "thanks" in a thread | Skipped | Skipped |
| Your own comments, or threads you already replied to by hand | Skipped | Skipped |

Every comment and every reply is logged on the **Comment Bot** page of the web app (`/comment-bot`).

## How it works

```
Instagram ──webhook (instant)──▶ /api/comment-bot/instagram/webhook ─┐
                                                                     ├─▶ packages/comment-bot
YouTube ◀──poll every minute── netlify/functions/comment-bot-tick ──▶ /api/comment-bot/run ─┘     │
                                                                                                  ├─ Google Doc (keywords + prompts)
                                                                                                  ├─ AI (Gemini / Claude / OpenAI)
                                                                                                  └─ Postgres: comment_replies, social_connections
```

- **Instagram** pushes every new comment to the webhook straight away.
- **YouTube** has no comment webhooks, so a Netlify scheduled function checks once a minute.
- Each comment is recorded first and handled exactly once, even if Meta resends the webhook or two polls overlap.
  If a send fails, it is retried up to 3 times, and a DM that already went out is never sent again.
- On Instagram the DM is sent first. If it fails, the bot does not post "check your DMs".

---

## Setup (about 45 minutes, once)

You'll need the site deployed on Netlify first (see [`DEPLOYMENT.md`](DEPLOYMENT.md)).
Below, `https://YOUR-SITE` means your Netlify URL, e.g. `https://ai-with-kalyan.netlify.app`.

### Step 1: Create the database tables

Run this once from your computer:

```bash
DATABASE_URL=<your database connection string> pnpm db:migrate
```

### Step 2: Make the Google Doc

1. Create a Google Doc, for example "Comment Bot Prompts".
2. Click **Share → General access → Anyone with the link → Viewer**. The bot can't read a private doc.
3. Copy the doc's link. That is `COMMENT_BOT_DOC_URL`.
4. Write it in this format:

```
I'm Kalyan. I make practical AI tutorials in English for beginners.
I use a MacBook Pro and record with a Shure MV7.
New videos every Tuesday and Friday.
Most prompts work in ChatGPT, Claude and Gemini.

KEYWORD: FABLE
TITLE: Fable 5.2 starter prompts
LINK: https://your-link-if-you-have-one.com
MESSAGE:
Prompt 1: You are an expert teacher. Explain [topic] to a 10-year-old...
Prompt 2: ...

KEYWORD: SIM, SIMCARD
TITLE: Claude Code SIM-card prompt
MESSAGE:
Paste this into Claude Code: ...
```

Rules:
- Everything **above the first `KEYWORD:`** is your "about me" notes. The AI uses it to answer
  questions in your voice. Put FAQs here: your gear, upload schedule, tools you use.
- `KEYWORD:` starts a new prompt. Separate extra trigger words with commas (`SIM, SIMCARD`).
  Matching ignores capitals, `#` and emoji, so "#fable 🙏" matches. "fables" doesn't.
- `TITLE:` (optional) is the friendly name used in replies.
- `LINK:` (optional) is added at the end of the DM or reply.
- `MESSAGE:` starts the text to send. Everything until the next `KEYWORD:` is included, so keep `MESSAGE:` last in each block.
- An Instagram DM holds at most 1,000 characters. If a prompt is longer, the DM sends the start and then
  links to `LINK:`, or to the doc itself when there's no `LINK:`.
- Edits show up within 2 minutes. You don't need to redeploy.

**Tip:** in the Reel's caption or the video description, say "Comment FABLE and I'll send you the prompt".

### Step 3: Get a free AI key

1. Go to [aistudio.google.com](https://aistudio.google.com) → **Get API key** → **Create API key**.
2. Copy it. That is `GEMINI_API_KEY`. The free tier is far more than you need at your current comment volume.

If you'd rather use Claude or OpenAI, set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` instead.
Without any AI key, the bot still answers keywords but skips other comments.

### Step 4: Choose a bot secret

Make up a long random password, at least 16 characters. That is `COMMENT_BOT_SECRET`.
It protects the "connect account" links and the scheduled job. Don't share it.

You can generate one with:

```bash
openssl rand -hex 24
```

### Step 5: Set up YouTube (Google Cloud)

1. Open [console.cloud.google.com](https://console.cloud.google.com) and create a project, e.g. "Comment Bot".
2. Go to **APIs & Services → Library**, search **YouTube Data API v3**, and click **Enable**.
3. Go to **APIs & Services → OAuth consent screen** (also called "Google Auth Platform"):
   - User type: **External**. App name: anything. Support and developer email: yours.
   - Under **Data access / Scopes**, add `https://www.googleapis.com/auth/youtube.force-ssl`.
   - Under **Audience**, click **Publish app** so the status reads **In production**.
     ⚠️ This step matters. In "Testing" mode Google expires the login after 7 days and the bot stops.
     Google doesn't need to verify an app that only you use. You'll just see an "unverified app" warning when you connect.
4. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URI: `https://YOUR-SITE/api/comment-bot/youtube/callback`
   - Copy the **Client ID** (`GOOGLE_CLIENT_ID`) and **Client secret** (`GOOGLE_CLIENT_SECRET`).

### Step 6: Set up Instagram (Meta)

**On your phone (Instagram app):**
1. **Settings → Account type and tools → Switch to professional account**, and pick **Creator**.
   You don't need a Facebook Page.
2. **Settings → Messages and story replies → Message controls → Connected tools →** turn on
   **Allow access to messages**. Without this, Meta blocks the DMs.

**On [developers.facebook.com](https://developers.facebook.com):**
1. **My Apps → Create app**. Choose the use case **Manage messaging & content on Instagram**
   (the app type is "Business" if Meta asks).
2. In the app, open **Instagram → API setup with Instagram login**.
3. Copy the **Instagram app ID** (`INSTAGRAM_APP_ID`) and **Instagram app secret** (`INSTAGRAM_APP_SECRET`).
   Use the Instagram ones, not the Facebook App ID at the top.
4. **Set up Instagram business login → Business login settings → OAuth redirect URIs**: add
   `https://YOUR-SITE/api/comment-bot/instagram/callback` and save.
5. **Configure webhooks**:
   - Callback URL: `https://YOUR-SITE/api/comment-bot/instagram/webhook`
   - Verify token: make up any word, e.g. `kalyan-bot-2026`. That is `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`.
   - Do steps 7 and 8 first, then come back and click **Verify and save**. The site must already have the token.
   - Then subscribe to the **comments** field.
6. **App settings → Basic**:
   - Privacy policy URL: `https://YOUR-SITE/privacy`
   - User data deletion: `https://YOUR-SITE/privacy#data-deletion`
   - Save, then switch **App mode** to **Live** at the top of the page.

### Step 7: Add the settings to Netlify

Go to **Netlify → your site → Site configuration → Environment variables** and add:

| Variable | Value |
|---|---|
| `COMMENT_BOT_SECRET` | From step 4 |
| `COMMENT_BOT_DOC_URL` | Google Doc link from step 2 |
| `GEMINI_API_KEY` | From step 3 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From step 5 |
| `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` | From step 6 |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | Your made-up word from step 6 |

Optional:

| Variable | Default | What it does |
|---|---|---|
| `COMMENT_BOT_PAUSED` | `false` | `true` stops all replies right away. This is the emergency off switch. |
| `COMMENT_BOT_DRY_RUN` | `false` | `true` logs what it *would* post on the Comment Bot page, without posting |
| `YOUTUBE_BACKFILL_HOURS` | `48` | When YouTube is first connected, how far back to reply to older comments |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model to use |
| `COMMENT_BOT_BASE_URL` | Netlify's `URL` | Only needed if you use a custom domain different from Netlify's main URL |

Then **Deploys → Trigger deploy → Deploy site**. Environment variables only apply after a deploy.

### Step 8: Connect the accounts

1. Open `https://YOUR-SITE/comment-bot`.
2. In the YouTube card, type your bot secret and click **Connect YouTube**. Pick your channel's Google
   account. On the "Google hasn't verified this app" screen, click **Advanced → Go to … (unsafe)**. It's your own app.
3. Do the same in the Instagram card and log in to Instagram.
4. Back in Meta's webhook settings, click **Verify and save** (step 6.5) if you haven't yet.

### Step 9: Test it

1. On the Comment Bot page, use **Test a reply**. Type `FABLE`, or a question, and click **Preview reply**.
   This shows exactly what would be posted, and posts nothing.
2. From a **different** account (a friend's, or your second account), comment the keyword on a Reel
   and on a YouTube video.
   - Instagram should reply within seconds.
   - YouTube should reply within about 1–2 minutes.
3. Watch the table on the Comment Bot page. Failed replies show the error message.

If you want to be careful, set `COMMENT_BOT_DRY_RUN=true` for the first day, check the log, then set it back to `false`.

---

## Limits to know about

- **YouTube API quota:** 10,000 free units a day. Polling every minute uses about 1,450 and each reply uses 50,
  so you can send about **170 replies a day**. Request more quota in Google Cloud when you grow.
- **YouTube spam filter:** YouTube sometimes holds replies that contain links. If replies go missing, check
  YouTube Studio → Comments → **Held for review**, or remove the `LINK:` lines for YouTube.
- **Instagram:** you can send one DM per comment, within 7 days of the comment. The person also needs to allow
  message requests. The Instagram login renews itself automatically every ~50 days.
- **Meta access level:** the bot asks for `instagram_business_basic`, `instagram_business_manage_comments` and
  `instagram_business_manage_messages`. If test comments from people who have a role on your app work but
  strangers' comments don't trigger anything, Meta wants **Advanced Access**. Go to **App Review → Permissions and
  features**, request Advanced Access for the two `manage_*` permissions, and attach a short screen recording of
  the bot replying. This usually takes a few days.
- **AI replies** are kept to 1–3 short sentences. Links are stripped, and the AI is told to treat comments as untrusted
  and not invent facts. It's still worth reading through the log now and then.

## Troubleshooting

| Problem | Fix |
|---|---|
| "No keywords found" on the page | The doc isn't shared as "Anyone with the link", or there's no `MESSAGE:` line. The page lists the problem in yellow. |
| YouTube stopped after a week | The Google consent screen is still in "Testing". Publish it (step 5.3), then click Reconnect YouTube. |
| "Almost: no refresh token" | Remove the app at myaccount.google.com/permissions and connect again. |
| Meta webhook "Verify and save" fails | `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` doesn't match, or you didn't redeploy after adding it. |
| Instagram DM error mentioning permissions | Turn on "Allow access to messages" on your phone (step 6, phone part, item 2). |
| Nothing happens at all | Scheduled functions only run on the **production** deploy. Open `https://YOUR-SITE/api/comment-bot/run?key=YOUR_SECRET` to run it by hand and see the result. |

## Code map

- `packages/comment-bot/src/prompt-library.ts`: reads and parses the Google Doc
- `packages/comment-bot/src/matcher.ts`: keyword matching
- `packages/comment-bot/src/responder.ts`: decides what to reply (keyword / AI / skip) and the AI prompt
- `packages/comment-bot/src/processor.ts`: exactly-once handling and retries
- `packages/comment-bot/src/youtube.ts`, `instagram.ts`: platform API clients
- `packages/comment-bot/src/runner.ts`: wiring for the poll, webhook, retries and token refresh
- `apps/web/src/app/api/comment-bot/*`: OAuth connect/callback, Instagram webhook, scheduled run
- `apps/web/src/app/(app)/comment-bot`: status page and reply tester
- `netlify/functions/comment-bot-tick.mts`: the once-a-minute schedule
- `packages/database/src/schema/comment-bot.ts`: `social_connections` and `comment_replies` tables
