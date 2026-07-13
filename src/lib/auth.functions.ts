import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Sign in with Pi. In production, the client passes the Pi access token
 * obtained from Pi.authenticate(); the server verifies it against the Pi
 * Platform API (/v2/me) using PI_API_KEY. In dev / outside Pi Browser,
 * we accept a username and mint a synthetic user.
 *
 * Returns a hashed OTP token the client uses to establish a Supabase session:
 *   supabase.auth.verifyOtp({ email, token_hash, type: 'magiclink' })
 */
export const signInWithPi = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        piAccessToken: z.string().optional(),
        mockUsername: z
          .string()
          .trim()
          .min(2)
          .max(40)
          .regex(/^[a-zA-Z0-9_.-]+$/)
          .optional(),
        role: z.enum(["farmer", "buyer"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let piUserId: string;
    let piUsername: string;

    if (data.piAccessToken) {
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
      piUserId = body.uid;
      piUsername = body.username;
    } else if (data.mockUsername) {
      // Dev / non-Pi-Browser mode.
      piUsername = data.mockUsername;
      piUserId = `mock_${data.mockUsername.toLowerCase()}`;
    } else {
      throw new Error("Provide a Pi access token or a mock username.");
    }

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
