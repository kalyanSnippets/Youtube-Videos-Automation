DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'videos' AND column_name = 'bot_enabled') THEN
    ALTER TABLE "videos" ADD COLUMN "bot_enabled" boolean DEFAULT false NOT NULL;
    -- Once, when the switch is added: videos that already had a keyword keep replying.
    UPDATE "videos" SET "bot_enabled" = true WHERE "keyword" IS NOT NULL AND btrim("keyword") <> '';
  END IF;
END $$;
