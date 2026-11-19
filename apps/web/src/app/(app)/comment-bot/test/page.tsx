import { BotHeader } from "../bot-header";
import { TestReplyForm } from "../test-form";

export const dynamic = "force-dynamic";

export default function CommentBotTestPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <BotHeader subtitle="Type a comment and see exactly what the bot would reply. Nothing is posted." />
      <section className="panel p-5">
        <TestReplyForm />
      </section>
    </div>
  );
}
