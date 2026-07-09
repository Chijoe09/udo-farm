import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — UDO Farm" }, { name: "description", content: "The rules for buying and selling on UDO Farm." }] }),
  component: Terms,
});

function Terms() {
  return (
    <AppShell>
      <article className="prose prose-neutral mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="mt-8 space-y-6 text-foreground/80">
          <section>
            <h2 className="font-display text-xl font-semibold">1. The service</h2>
            <p>UDO Farm is a marketplace connecting bulk produce farmers with buyers. UDO Farm is not a party to any sale; farmers and buyers transact directly, with Pi Payments held/verified on the Pi Network.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">2. Farmers</h2>
            <p>You must list accurate quantities, prices and harvest dates. Fraud, misrepresentation or unsafe produce will result in permanent removal.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">3. Buyers</h2>
            <p>Once payment is confirmed on Pi, orders are binding. Cancellations before shipment are subject to farmer discretion.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">4. Payments</h2>
            <p>All in-app payments settle in Pi. Refunds, if any, must be initiated by the farmer and are processed on-chain.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">5. Liability</h2>
            <p>UDO Farm provides the platform "as-is" and is not liable for produce quality, shipping delays outside our logistics network, or third-party payment issues.</p>
          </section>
        </div>
      </article>
    </AppShell>
  );
}
