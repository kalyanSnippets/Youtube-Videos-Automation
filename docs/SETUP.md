# Setup guide: AI with Kalyan site + comment bot

This guide gets you a live website with:

- **A public resources site.** `https://YOUR-SITE.netlify.app` lists your free prompts, and each prompt has
  its own page at `/r/<name>` with a Copy button and an optional newsletter signup.
- **A private admin area.** Only you can open it, using Sign in with Google. It holds the dashboard,
  projects, **Resources** (where you add and edit prompts), **Comment Bot** and **Subscribers**.
- **The comment bot.** When someone comments a keyword on YouTube or Instagram, it gets the prompt plus
  a link to the prompt's page. Other comments get a short AI answer.

Total time is about 1 to 1.5 hours, done once. Never paste keys or passwords into chats or comments.
They only go into Netlify's environment variables.

---

## Part 1: Database (Supabase), about 10 minutes

1. Go to **supabase.com** and click **Start your project**. Sign up with GitHub.
2. Click **New project**:
   - Name: `ai-with-kalyan`
   - Database password: click **Generate a password**. **Save it in your password manager.**
   - Region: the one closest to your viewers. For India and Australia, pick **Mumbai** or **Sydney**.
   - Click **Create new project** and wait about 2 minutes.
3. In the left menu, open **SQL Editor** and click **New query**.
4. Open [`docs/supabase-setup.sql`](supabase-setup.sql) in this repository on GitHub. Click **Raw**, then
   select all and copy it. Paste it into the query box and click **Run**. You should see "Success. No rows returned".
5. Click the **Connect** button at the top of the page. Under **Connection string**, choose **Transaction pooler**
   and copy the URI. It looks like:
   `postgresql://postgres.abcd:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
   Replace `[YOUR-PASSWORD]` with the password from step 2. **This is `DATABASE_URL`.** Keep it private.

## Part 2: Secrets you make yourself, about 5 minutes

| Name | How to get it |
|---|---|
| `APP_SECRET` | Go to **1password.com/password-generator** (or any password generator), set the length to 40 with no symbols, and copy the result. |
| `ADMIN_EMAILS` | Your Google email, the one you'll sign in with. For more than one, separate them with commas. |
| `GEMINI_API_KEY` | Go to **aistudio.google.com**, click **Get API key**, then **Create API key**. It's free. |

## Part 3: Put the site online (Netlify), about 10 minutes

1. Go to **netlify.com**, click **Sign up**, then **Sign up with GitHub**.
2. Click **Add new site**, then **Import an existing project**, then **GitHub**. Allow access and pick the
   `Youtube-Videos-Automation` repository.
3. On the settings screen:
   - **Branch to deploy:** `main`. The new code must be merged into `main` first. If it isn't merged yet, pick the branch that has it.
   - Leave the base directory, build command and publish directory as they are. `netlify.toml` already sets them.
4. Click **Add environment variables** and add `DATABASE_URL`, `APP_SECRET`, `ADMIN_EMAILS` and `GEMINI_API_KEY`
   from Parts 1 and 2.
5. Click **Deploy**. It takes about 3–5 minutes. When it's done you'll get an address like `https://random-name-123.netlify.app`.
6. To change the name, go to **Site configuration → Change site name** and type `aiwithkalyan`.
   Your address is now `https://aiwithkalyan.netlify.app`. Below, **YOUR-SITE** means this address.
7. Open YOUR-SITE. You should see the "Free prompts from AI with Kalyan" page, with no prompts yet.

## Part 4: Sign in with Google + YouTube (Google Cloud), about 15 minutes

One Google setup covers both your admin login and the YouTube bot.

1. Go to **console.cloud.google.com**. In the project picker at the top, click **New project**, name it `AI with Kalyan`
   and click **Create**. Then select it.
2. Search the top bar for **YouTube Data API v3**, open it and click **Enable**.
3. Search for **Google Auth Platform** (or **OAuth consent screen**) and click **Get started**:
   - App name `AI with Kalyan`. Support email: yours. Audience: **External**. Contact email: yours. Agree and click **Create**.
   - **Data access → Add or remove scopes**: tick `openid`, `.../auth/userinfo.email`, and
     `.../auth/youtube.force-ssl` (search "youtube.force-ssl"). Click **Update**, then **Save**.
   - **Audience → Publish app → Confirm**, so the status shows **In production**.
     ⚠️ Don't skip this. In "Testing" mode Google signs you out of YouTube every 7 days.
4. Open **Clients → Create client**:
   - Application type: **Web application**. Name: `Website`.
   - **Authorized redirect URIs**: add **both** of these:
     - `https://YOUR-SITE/api/auth/callback`
     - `https://YOUR-SITE/api/comment-bot/youtube/callback`
   - Click **Create** and copy the **Client ID** and **Client secret**.
5. In Netlify, open **Site configuration → Environment variables** and add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
6. Go to **Deploys → Trigger deploy → Deploy site**. Environment variables only apply after a deploy.
7. Open `https://YOUR-SITE/login` and click **Sign in with Google**. Google shows an "unverified app" warning because
   this is your own app: click **Advanced**, then **Go to AI with Kalyan**. You land on your dashboard.

## Part 5: Add your content, about 10 minutes

1. In the admin sidebar, open **Resources**. In **Site settings** at the bottom:
   - Add your YouTube and Instagram links.
   - Fill in **About me**. The bot's AI uses this to answer questions in your voice: your gear, the tools you use,
     your upload schedule, and answers to common questions.
   - Click **Save settings**.
2. Click **New resource** and add your first prompt. For example:
   - Title `Fable 5.2 starter prompts`, keyword `FABLE`, a one-line description, the prompt text, and the video link.
   - Tick **Published** and click **Save resource**.
3. Click **View site** to check that the prompt shows up and that the Copy button works.

## Part 6: Connect YouTube, about 2 minutes

1. In the sidebar, open **Comment Bot**, then click **Connect YouTube** in the YouTube card.
2. Choose the Google account that owns your channel. If you see the warning, click **Advanced → Go to AI with Kalyan**, then **Continue**.
3. You should see "YouTube connected ✅".

The bot now checks YouTube comments once a minute. Netlify's scheduled job only runs on the live (production) deploy.

## Part 7: Instagram (Meta), about 20 minutes

**In the Instagram app on your phone:**
1. **Settings → Account type and tools → Switch to professional account → Creator**. You don't need a Facebook Page.
2. **Settings → Messages and story replies → Message controls → Connected tools →** turn on **Allow access to messages**.

**On developers.facebook.com** (log in with Facebook):

Meta apps created since late 2026 use **"API setup with Unified login"**. The older "Instagram login" isn't offered for new apps.

1. **My Apps → Create app**, name `AI with Kalyan Bot`, use case **Manage messaging & content on Instagram**.
   - **Business portfolio:** connect one you're an admin of. Meta requires one for Unified login, and you can rename an existing portfolio rather than create a new one.
2. **Use cases → Customize → API setup with Unified login → 1. Configure your app**:
   - Click **Create new configuration**. Keep the access token as **System-user access token**, expiration **Never**, and choose your Instagram account as the asset. Tick the permissions `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages` and **`business_management`**.
     - If `business_management` isn't offered there: add the **Facebook Login for Business** product, open **Configurations**, edit this configuration and add it. Without it, Meta logs you in but shares no Instagram account.
   - **Redirect URL:** add `https://YOUR-SITE/api/comment-bot/instagram/callback` and click **Save**.
   - Copy the **Configuration ID**. This is `META_LOGIN_CONFIG_ID`.
3. **App settings → Basic**:
   - Copy the **App ID** (`INSTAGRAM_APP_ID`) and the **App secret** (`INSTAGRAM_APP_SECRET`).
   - Privacy policy URL: `https://YOUR-SITE/privacy`. User data deletion: `https://YOUR-SITE/privacy#data-deletion`. Category: Education. Click **Save changes**.
4. Pick any word as your webhook password, e.g. `kalyan-webhook-2026`. This is `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`.
5. In Netlify, add `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `META_LOGIN_CONFIG_ID` and `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`, then **Trigger deploy** and wait for **Published**.
6. Back in Meta, open the **webhooks** step on the same Unified login page:
   - Callback URL `https://YOUR-SITE/api/comment-bot/instagram/webhook`, and the verify token from step 4.
   - Click **Verify and save**, then subscribe to the **comments** field.
7. In your admin area, go to **Comment Bot → Connect Instagram**. Log in, choose your Instagram account and allow access. You should see "Instagram connected ✅". This connection doesn't expire.
8. **Publish:** switch the app to **Live** (left menu **Publish**). In development mode, Meta only sends comments from people who have a role on the app.

## Part 8: Test everything, about 5 minutes

1. On the Comment Bot page, open **Test a reply**. Type `FABLE`, then `what mic do you use?`, and click
   **Preview reply** each time. This shows exactly what would be posted, and posts nothing.
2. From a **different** account (a friend's, or a second account), comment `FABLE` on one of your Reels and on one
   of your YouTube videos.
   - Instagram should DM within seconds and post "Sent! Check your DMs 📩".
   - YouTube should reply within about 1–2 minutes.
3. Check the log table on the Comment Bot page. If something failed, it shows the reason in red.

**If strangers' Instagram comments get no reply but your test accounts do:** Meta wants **Advanced Access**.
Go to **App Review → Permissions and features** and request Advanced Access for `instagram_business_manage_comments`
and `instagram_business_manage_messages`. Attach a short screen recording of the bot replying. Approval usually takes a few days.

---

## Everyday use

- **New video:** add a resource with a new keyword, then say "comment KEYWORD and I'll send it to you" in the video.
- **Link in bio:** put `https://YOUR-SITE` in your Instagram bio and YouTube channel links.
- **Pause the bot:** set `COMMENT_BOT_PAUSED=true` in Netlify and redeploy.
- **Newsletter:** open **Subscribers**, then **Download CSV**, and import it into any email tool.

## All environment variables

| Variable | Required | From |
|---|---|---|
| `DATABASE_URL` | yes | Part 1 |
| `APP_SECRET` | yes | Part 2 |
| `ADMIN_EMAILS` | yes | Part 2 |
| `GEMINI_API_KEY` | for AI answers | Part 2 (or `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | yes | Part 4 |
| `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `META_LOGIN_CONFIG_ID`, `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | for Instagram | Part 7 |
| `SITE_URL` | only with a custom domain | e.g. `https://aiwithkalyan.com` |
| `COMMENT_BOT_PAUSED`, `COMMENT_BOT_DRY_RUN`, `YOUTUBE_BACKFILL_HOURS` | optional | see [`COMMENT-BOT.md`](COMMENT-BOT.md) |

---

## Videos and prompts (added later)

Every YouTube video and Instagram post becomes a card automatically: in the admin **Videos** page and on the public site.

1. **Once:** in Supabase → **SQL Editor → New query**, paste the contents of [`docs/supabase-videos-migration.sql`](supabase-videos-migration.sql) and click **Run**. This adds the `videos` table.
2. Open **Videos** in the admin area and click **Sync now**. After that, a scheduled job (`netlify/functions/videos-sync.mts`) refreshes the list every hour. Large channels fill in over a few hours.
3. On each card:
   - Type the **keyword** (e.g. `EDIT`).
   - Add the prompt in one of these ways: upload a **.docx, .pdf, .txt or .md** file, paste a **Google Doc link** (shared as "Anyone with the link can view"), or paste the text.
   - If the first line of the file is `KEYWORD: EDIT`, the keyword is filled in for you and that line is left out of the prompt.
4. Cards without a prompt show "Prompt coming soon" publicly. Once a prompt is added, the card's page (`/v/<name>`) shows it with a Copy button and a link back to YouTube or Instagram, and the comment bot answers that keyword with it.
5. Tick **Hide** on a card to keep it off the site and away from the bot.
