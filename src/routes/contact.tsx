import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(1).max(4000),
});

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact UDO Farm — customer service 24/7" },
      { name: "description", content: "Get in touch with UDO Farm. Customer service, seller onboarding and partnerships." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject ?? null,
      message: parsed.data.message,
    });
    setLoading(false);
    if (error) { toast.error("Message failed to send"); return; }
    (e.target as HTMLFormElement).reset();
    toast.success("Message sent! We'll reply within 24 hours.");
  }

  return (
    <AppShell>
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h1 className="font-display text-4xl font-bold">Contact us</h1>
          <p className="mt-2 text-muted-foreground">
            Customer service 24/7. We reply to every message.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> hello@udofarm.app</li>
            <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> +234 800 UDO FARM</li>
            <li className="flex items-center gap-3"><MessageCircle className="h-4 w-4 text-primary" /> WhatsApp: tap the button bottom-right</li>
          </ul>
        </div>
        <Card className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" />
            </div>
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea id="message" name="message" rows={5} required />
            </div>
            <Button type="submit" disabled={loading} size="lg" className="h-12 w-full gradient-brand text-primary-foreground">
              {loading ? "Sending..." : "Send message"}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
