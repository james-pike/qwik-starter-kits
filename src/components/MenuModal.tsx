import { $, component$, useSignal } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

export const MenuModal = component$(() => {
  const isOpen = useSignal(false);

  const toggleMenu = $(() => {
    isOpen.value = !isOpen.value;
  });

  const closeMenu = $(() => {
    isOpen.value = false;
  });

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick$={toggleMenu}
        class="p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
      >
        <svg
          class="w-6 h-6 text-slate-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen.value ? (
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen.value && (
        <>
          {/* Backdrop */}
          <div
            class="fixed inset-0 bg-black/20 z-40"
            onClick$={closeMenu}
          ></div>

          {/* Menu Panel */}
          <div class="fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform">
            <div class="p-4">
              {/* Close Button */}
              <div class="flex justify-end mb-6">
                <button
                  onClick$={closeMenu}
                  class="p-2 rounded-md hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <svg
                    class="w-6 h-6 text-slate-800"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <nav class="space-y-4">
                <Link
                  href="/classes"
                  class="block text-lg font-medium text-slate-800 hover:text-slate-600 transition-colors py-2"
                  onClick$={closeMenu}
                >
                  Classes
                </Link>
                <Link
                  href="/banners"
                  class="block text-lg font-medium text-slate-800 hover:text-slate-600 transition-colors py-2"
                  onClick$={closeMenu}
                >
                  Banners
                </Link>
                <Link
                  href="/gallery"
                  class="block text-lg font-medium text-slate-800 hover:text-slate-600 transition-colors py-2"
                  onClick$={closeMenu}
                >
                  Gallery
                </Link>
                <Link
                  href="/reviews"
                  class="block text-lg font-medium text-slate-800 hover:text-slate-600 transition-colors py-2"
                  onClick$={closeMenu}
                >
                  Reviews
                </Link>
                <Link
                  href="/faqs"
                  class="block text-lg font-medium text-slate-800 hover:text-slate-600 transition-colors py-2"
                  onClick$={closeMenu}
                >
                  FAQs
                </Link>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
});