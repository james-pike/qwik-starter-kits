import { component$ } from "@builder.io/qwik";
import {
  QwikCityProvider,
  RouterOutlet,
  ServiceWorkerRegister,
} from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";

export default component$(() => {
  /**
   * The root of a QwikCity site always start with the <QwikCityProvider> component,
   * immediately followed by the document's <head> and <body>.
   *
   * Don't remove the `<head>` and `<body>` elesments.
   */

  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <RouterHead />
      </head>
<body lang="en" class="min-h-screen">
  <div class="relative md:border-x mx-auto max-w-7xl overflow-x-hidden min-h-screen">
    {/* Background layers */}
    <div
      class="absolute inset-0 bg-watercolor-texture opacity-50 bg-secondary-100/50 z-0"
      aria-hidden="true"
    ></div>
    <div
      class="absolute inset-0 bg-gradient-to-br from-primary-100/95 via-primary-200/80 to-tertiary-200/85 z-0"
      aria-hidden="true"
    ></div>
    <div
      class="absolute inset-0 bg-gradient-to-t from-tertiary-300/40 via-primary-200/50 to-primary-100/60 z-0"
      aria-hidden="true"
    ></div>
    <div
      class="absolute top-0 left-5 w-[700px] h-[800px] bg-tertiary-100/30 rounded-full blur-xl animate-float z-0"
      aria-hidden="true"
    ></div>
    <div
      class="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-100/30 rounded-full blur-xl animate-float z-0"
      aria-hidden="true"
    ></div>
    <div
      class="absolute top-5 md:left-[650px] w-[490px] h-[80px] bg-primary-200/30 rounded-full blur-xl animate-float z-0"
      aria-hidden="true"
    ></div>

    {/* App layout */}
    <div class="relative z-10 min-h-screen flex flex-col">
      {/* Main page content */}
      <main class="flex-1">
        <RouterOutlet />
      </main>

      {/* Footer */}
      <footer class="mt-auto py-6 text-center text-sm text-slate-600">
        © {new Date().getFullYear()}       </footer>
    </div>
  </div>
  <ServiceWorkerRegister />
</body>


    </QwikCityProvider>
  );
});
