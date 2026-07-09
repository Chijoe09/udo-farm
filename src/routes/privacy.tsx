import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — UDO Farm" }, { name: "description", content: "How UDO Farm handles your personal data." }] }),
  component: Privacy,
});

function Privacy() {
  return (
    <AppShell>
      <article className="prose prose-neutral mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="mt-8 space-y-6 text-foreground/80">
          <section>
            <h2 className="font-display text-xl font-semibold">1. What we collect</h2>
            <p>Your Pi Network username and UID (via Pi Authentication), and optional profile data you choose to add: phone, contact email, location, and bio.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">2. How we use it</h2>
            <p>To operate the marketplace: match buyers with farmers, process Pi payments, notify you of order updates, and provide customer service.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">3. Pi Payments</h2>
            <p>Payment amounts and transaction IDs are stored to reconcile orders. UDO Farm never has access to your Pi wallet keys — all payments happen inside the Pi Browser via the Pi Payment SDK.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">4. Sharing</h2>
            <p>We share the minimum data required for a transaction: farmers see the buyer's Pi username, delivery address (if delivery is chosen), and order details.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">5. Your rights</h2>
            <p>You can update or delete your profile any time from your account settings. Contact us at hello@udofarm.app for full data export or deletion.</p>
          </section>
        </div>
      </article>
    </AppShell>
  );
}
