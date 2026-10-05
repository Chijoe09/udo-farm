import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Sign in with Pi. The client passes the Pi access token obtained from
 * Pi.authenticate(); the server verifies it against the Pi Platform API
 * (/v2/me). Only a verified Pi identity can create a session — there is no
 * username-only or mock sign-in path.
 *
 * Returns a hashed OTP token the client uses to establish a Supabase session:
 *   supabase.auth.verifyOtp({ email, token_hash, type: 'magiclink' })
 */
export const signInWithPi = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        piAccessToken: z.string().min(1),
        role: z.enum(["farmer", "buyer"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Validate the Pi access token by calling /v2/me. Per Pi docs, this
    // endpoint accepts the user's access token as a Bearer token — no
    // server-side Pi API key required for identity verification.
    const res = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${data.piAccessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Pi token verification failed (${res.status})`);
    }
    const body = (await res.json()) as { uid: string; username: string };
    const piUserId = body.uid;
    const piUsername = body.username;

    const email = `pi_${piUserId}@udofarm.pi`;

    // Find or create user by email
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    let userId = existing?.users.find((u) => u.email === email)?.id;

    if (!userId) {
      const { data: created, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { pi_user_id: piUserId, pi_username: piUsername },
        });
      if (createErr || !created.user) {
        throw new Error(createErr?.message ?? "Failed to create Pi user");
      }
      userId = created.user.id;
    }

    // Ensure profile row exists with latest pi info
    await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          pi_user_id: piUserId,
          pi_username: piUsername,
        },
        { onConflict: "id" },
      );

    // Ensure role
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: data.role }, { onConflict: "user_id,role" });

    // Generate a magic-link OTP the client can verify.
    const { data: linkData, error: linkErr } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
    if (linkErr || !linkData?.properties?.hashed_token) {
      throw new Error(linkErr?.message ?? "Failed to mint session");
    }

    return {
      email,
      hashed_token: linkData.properties.hashed_token,
      piUsername,
    };
  });
