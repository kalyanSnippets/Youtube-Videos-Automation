export const metadata = { title: "Privacy Policy" };

/** Public privacy policy and data-deletion instructions. Meta requires both URLs before the Instagram app can go Live. */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 space-y-4 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p>
        This site runs an automated assistant that replies to comments on the creator&apos;s own YouTube channel and Instagram account.
      </p>
      <h2 className="text-lg font-semibold pt-2">What we collect</h2>
      <p>
        When you comment on one of the creator&apos;s videos or posts, we store the comment text, your public username or channel name,
        your platform user id, the id of the video or post, and the reply we sent. Nothing else is collected, and we never see your password.
      </p>
      <h2 className="text-lg font-semibold pt-2">How it is used</h2>
      <p>
        Only to reply to your comment (publicly, and on Instagram with one private message containing the resource you asked for), to avoid
        sending you the same message twice, and to let the creator review what the assistant sent. Comment text may be processed by an AI
        provider to write the reply. We do not sell or share your data for advertising.
      </p>
      <h2 className="text-lg font-semibold pt-2">Retention</h2>
      <p>Comment records are kept for up to 12 months and then deleted.</p>
      <h2 className="text-lg font-semibold pt-2" id="data-deletion">Deleting your data</h2>
      <p>
        To have your data deleted, send a direct message to the creator&apos;s Instagram account or reply &quot;delete my data&quot; to any of
        the creator&apos;s comments, with your username. Your records are removed within 30 days.
      </p>
    </main>
  );
}
