import { QwikAuth$ } from "@auth/qwik";
import Google from "@auth/qwik/providers/google";
import type { RequestEventCommon } from "@builder.io/qwik-city"; // Use RequestEventCommon

export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$(
  (requestEvent: RequestEventCommon) => {
    const googleClientId = requestEvent.env.get("GOOGLE_CLIENT_ID");
    const googleClientSecret = requestEvent.env.get("GOOGLE_CLIENT_SECRET");
    const authSecret = requestEvent.env.get("AUTH_SECRET");
    const vercelUrl = requestEvent.env.get("VERCEL_URL");

    console.log("🔍 Google Auth Setup:");
    console.log("- GOOGLE_CLIENT_ID exists:", !!googleClientId);
    console.log("- GOOGLE_CLIENT_SECRET exists:", !!googleClientSecret);
    console.log("- AUTH_SECRET exists:", !!authSecret);
    console.log("- VERCEL_URL:", vercelUrl);

    return {
      secret: authSecret || "fallback-secret",
      trustHost: true,
      providers: [
        Google({
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
          authorization: {
            params: {
              prompt: "consent",
              access_type: "offline",
              response_type: "code",
            },
          },
        }),
      ],
      callbacks: {
        async signIn({ user }) { // Simplified to only use user
          const allowedEmail = "jamesandrewpike@gmail.com";
          console.log("🔍 Sign-in attempt:", { user });
          if (!user?.email) {
            console.warn("❌ No email provided in user object");
            return false;
          }
          if (user.email !== allowedEmail) {
            console.warn("❌ Unauthorized sign-in attempt:", user.email);
            return false;
          }
          console.log("✅ Allowed sign-in:", user.email);
          return true;
        },
        async jwt({ token, account }) {
          if (account) {
            token.accessToken = account.access_token;
          }
          return token;
        },
      },
    };
  }
);