import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — UDO Farm" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { userId, piUsername } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ phone: "", email: "", location: "", bio: "" });

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("phone,email,location,bio")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setForm({
          phone: data.phone ?? "",
          email: data.email ?? "",
          location: data.location ?? "",
          bio: data.bio ?? "",
        });
        setLoading(false);
      });
  }, [userId]);

  async function save() {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", userId);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Profile</h1>
        <p className="mt-1 text-muted-foreground">Signed in as @{piUsername}</p>

        <Card className="mt-6 space-y-4 p-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="email">Contact email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="loc">Location</Label>
                <Input id="loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ibadan, Nigeria" />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <Button onClick={save} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save profile"}
              </Button>
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
