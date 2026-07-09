import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Sprout, Target, Users } from "lucide-react";
import farmer1 from "@/assets/farmer-1.jpg";
import farmer2 from "@/assets/farmer-2.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About UDO Farm — Empowering African agriculture with Pi" },
      { name: "description", content: "UDO Farm connects farmers and bulk buyers across Africa using Pi Network. Our mission, vision and team." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <AppShell>
      <section className="border-b border-border/60 bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h1 className="font-display text-5xl font-bold">Cultivating progress.</h1>
          <p className="mt-3 text-xl text-muted-foreground">
            UDO Farm is Africa's Pi-powered bulk produce marketplace, built to put more value back in the hands of farmers.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: Target, title: "Our mission", body: "Give farmers direct access to bulk buyers, priced fairly in Pi, without middlemen taking most of the margin." },
            { icon: Sprout, title: "Our vision", body: "A future where every African farm can trade at scale with global reach on the Pi Network." },
            { icon: Users, title: "Our team", body: "A small crew of technologists, agronomists and community pioneers based across Nigeria, Ghana and Kenya." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="grid h-11 w-11 place-items-center rounded-xl gradient-brand text-primary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {[
            { img: farmer1, name: "Ada Nwosu", role: "Head of Farmer Relations" },
            { img: farmer2, name: "Kwame Boateng", role: "Community & Operations" },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
              <img src={m.img} alt={m.name} loading="lazy" className="h-20 w-20 rounded-2xl object-cover" />
              <div>
                <p className="font-display text-lg font-semibold">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
