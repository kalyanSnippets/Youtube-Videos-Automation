# Comment Bot: instant replies on YouTube and Instagram

The bot answers comments on your YouTube videos and Instagram posts and Reels within about a minute,
with no one watching.

| Someone comments… | YouTube | Instagram |
|---|---|---|
| A keyword from your Resources, e.g. `FABLE` | Public reply with the prompt + link to its page | **DM** with the prompt + page link, and a public reply "Sent! Check your DMs 📩" |
| A keyword **and** a question, e.g. `FABLE does it work on Windows?` | AI answer + the prompt, in one reply | AI answer + "check your DMs" publicly, prompt by DM |
| A question or compliment, e.g. `what mic do you use?` | Short AI reply | Short AI reply |
| Asks for a resource without the keyword ("can I get the prompt?") | The AI spots it and sends that prompt | Same, by DM |
| Spam, self-promo, hate, gibberish, or a bare "thanks" in a thread | Skipped | Skipped |
| Your own comments, or threads you already replied to by hand | Skipped | Skipped |

Every comment and every reply is logged on the **Comment Bot** page of the admin area (`/comment-bot`, sign-in required).

## How it works

```
Instagram ──webhook (instant)──▶ /api/comment-bot/instagram/webhook ─┐
                                                                     ├─▶ packages/comment-bot
YouTube ◀──poll every minute── netlify/functions/comment-bot-tick ──▶ /api/comment-bot/run ─┘     │
                                                                                                  ├─ Resources table (keywords + prompts)
                                                                                                  ├─ AI (Gemini / Claude / OpenAI)
                                                                                                  └─ Postgres: comment_replies, social_connections
```

- **Instagram** pushes every new comment to the webhook straight away.
- **YouTube** has no comment webhooks, so a Netlify scheduled function checks once a minute.
- Each comment is recorded first and handled exactly once, even if Meta resends the webhook or two polls overlap.
  If a send fails, it is retried up to 3 times, and a DM that already went out is never sent again.
- On Instagram the DM is sent first. If it fails, the bot does not post "check your DMs".

---

## Setup

Follow [`SETUP.md`](SETUP.md): it sets up the whole app (public resources site, Google sign-in,
Supabase, Netlify) and the comment bot in one pass.

Keywords and prompts come from **Resources** in the admin area. Each resource has a public page
(`/r/<slug>`), and the bot sends the prompt plus a link to that page. Your "About me" notes (Resources →
Site settings) are what the AI uses to answer questions in your voice.

### Optional settings

| Variable | Default | What it does |
|---|---|---|
| `COMMENT_BOT_PAUSED` | `false` | `true` stops all replies right away. This is the emergency off switch. |
| `COMMENT_BOT_DRY_RUN` | `false` | `true` logs what it *would* post on the Comment Bot page, without posting |
| `YOUTUBE_BACKFILL_HOURS` | `48` | When YouTube is first connected, how far back to reply to older comments |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model to use |

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
| "No keywords found" on the page | Add a resource with at least one keyword and tick Published. |
| YouTube stopped after a week | The Google consent screen is still in "Testing". Publish it (step 5.3), then click Reconnect YouTube. |
| "Almost: no refresh token" | Remove the app at myaccount.google.com/permissions and connect again. |
| Meta webhook "Verify and save" fails | `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` doesn't match, or you didn't redeploy after adding it. |
| Instagram DM error mentioning permissions | Turn on "Allow access to messages" in the Instagram app (see SETUP.md). |
| Nothing happens at all | Scheduled functions only run on the **production** deploy. While signed in, open `https://YOUR-SITE/api/comment-bot/run` to run it by hand and see the result. |

## Code map

- `packages/comment-bot/src/library.ts`: turns published Resources into the bot's keyword list
- `packages/comment-bot/src/matcher.ts`: keyword matching
- `packages/comment-bot/src/responder.ts`: decides what to reply (keyword / AI / skip) and the AI prompt
- `packages/comment-bot/src/processor.ts`: exactly-once handling and retries
- `packages/comment-bot/src/youtube.ts`, `instagram.ts`: platform API clients
- `packages/comment-bot/src/runner.ts`: wiring for the poll, webhook, retries and token refresh
- `apps/web/src/app/api/comment-bot/*`: OAuth connect/callback, Instagram webhook, scheduled run
- `apps/web/src/app/(app)/comment-bot`: status page and reply tester
- `netlify/functions/comment-bot-tick.mts`: the once-a-minute schedule
- `packages/database/src/schema/comment-bot.ts`: `social_connections` and `comment_replies` tables
