import { QwikAuth$ } from "@auth/qwik";
import Google from "@auth/qwik/providers/google";
import Credentials from "@auth/qwik/providers/credentials";
import type { RequestEventCommon } from "@builder.io/qwik-city";

// Extend Auth.js types
declare module "@auth/core/types" {
  interface User {
    role?: string;
  }
  
  interface Session {
    user: User & {
      role?: string;
      provider?: string;
    };
  }
  
  interface JWT {
    role?: string;
    provider?: string;
  }
}

export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$(
  (requestEvent: RequestEventCommon) => {
    const googleClientId = requestEvent.env.get("GOOGLE_CLIENT_ID");
    const googleClientSecret = requestEvent.env.get("GOOGLE_CLIENT_SECRET");
    const authSecret = requestEvent.env.get("AUTH_SECRET");
    const vercelUrl = requestEvent.env.get("VERCEL_URL");
    const adminUsername = requestEvent.env.get("ADMIN_USERNAME");
    const adminPassword = requestEvent.env.get("ADMIN_PASSWORD");

    console.log("🔍 Auth Setup:");
    console.log("- GOOGLE_CLIENT_ID exists:", !!googleClientId);
    console.log("- GOOGLE_CLIENT_SECRET exists:", !!googleClientSecret);
    console.log("- AUTH_SECRET exists:", !!authSecret);
    console.log("- ADMIN_USERNAME exists:", !!adminUsername);
    console.log("- ADMIN_PASSWORD exists:", !!adminPassword);
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
        Credentials({
          name: "credentials",
          credentials: {
            username: { label: "Username", type: "text" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials) {
            console.log("🔍 Credentials sign-in attempt:", { 
              username: credentials?.username 
            });
            
            if (!credentials?.username || !credentials?.password) {
              console.warn("❌ Missing username or password");
              return null;
            }

            if (
              credentials.username === adminUsername && 
              credentials.password === adminPassword
            ) {
              console.log("✅ Admin credentials verified");
              return {
                id: "admin",
                name: "Administrator",
                email: "admin@local",
                role: "admin"
              };
            }

            console.warn("❌ Invalid admin credentials");
            return null;
          }
        })
      ],
      callbacks: {
        async signIn({ user, account }) {
          console.log("🔍 Sign-in attempt:", { user, provider: account?.provider });
          
          // Handle Google OAuth sign-in
          if (account?.provider === "google") {
            const allowedEmail = "jamesandrewpike@gmail.com";
            if (!user?.email) {
              console.warn("❌ No email provided in user object");
              return false;
            }
            if (user.email !== allowedEmail) {
              console.warn("❌ Unauthorized Google sign-in attempt:", user.email);
              return false;
            }
            console.log("✅ Allowed Google sign-in:", user.email);
            return true;
          }
          
          // Handle credentials sign-in (already authorized in the provider)
          if (account?.provider === "credentials") {
            console.log("✅ Credentials sign-in successful");
            return true;
          }

          return false;
        },
        async jwt({ token, account, user }) {
          if (account) {
            token.accessToken = account.access_token;
            token.provider = account.provider;
          }
          if (user?.role) {
            token.role = user.role;
          }
          return token;
        },
        async session({ session, token }) {
          if (token?.role) {
            session.user.role = token.role as string;
          }
          if (token?.provider) {
            session.user.provider = token.provider as string;
          }
          return session;
        }
      },
    };
  }
);