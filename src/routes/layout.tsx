import { component$, Slot } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";
import { Header } from "~/components/header/header";


// Middleware to inject environment variables into global scope
export const onRequest: RequestHandler = async (requestEvent) => {
  // Make environment variables available globally for auth module
  const env = requestEvent.env;
  
  // Set them on globalThis for auth module access
  (globalThis as any).__QWIK_ENV__ = {
    VERCEL_ADMIN_USERNAME: env.get('VERCEL_ADMIN_USERNAME'),
    VERCEL_ADMIN_PASSWORD: env.get('VERCEL_ADMIN_PASSWORD'),
    AUTH_SECRET: env.get('AUTH_SECRET'),
  };
  
  console.log("Environment variables injected:", {
    username: !!(globalThis as any).__QWIK_ENV__.VERCEL_ADMIN_USERNAME,
    password: !!(globalThis as any).__QWIK_ENV__.VERCEL_ADMIN_PASSWORD,
    secret: !!(globalThis as any).__QWIK_ENV__.AUTH_SECRET,
  });
};

export const onGet: RequestHandler = async ({ cacheControl }) => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.dev/docs/caching/
  cacheControl({
    // Always serve a cached response by default, up to a week stale
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    // Max once every 5 seconds, revalidate on the server to get a fresh version of this page
    maxAge: 5,
  });
};

export default component$(() => {
  return (
    <div>
      <Header />
      <Slot />
      {/* <Footer/> */}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Auth.js with Qwik",
  meta: [
    {
      name: "description",
      content: "An example project for Auth.js with Qwik",
    },
  ],
};
