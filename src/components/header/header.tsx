// Header component with responsive navigation and avatar dropdown
import { component$, useStore, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { useSession, useSignIn, useSignOut } from "~/routes/plugin@auth";
import { Avatar } from "../avatar/avatar";
import { MenuModal } from "../MenuModal";

export const Header = component$(() => {
  const session = useSession();
  const signInSig = useSignIn();
  const signOutSig = useSignOut();
  const dropdownOpen = useSignal(false);
  const redeployDisabled = useSignal(false);
  const cooldownEndTime = useSignal<number | null>(null);
  const redeployCount = useSignal(0);

  const store = useStore({
    isMobile: false,
    isInitialized: false,
  });

  // Check cooldown status and redeploy count on component mount
  useVisibleTask$(() => {
    try {
      // Check if we need to reset the daily counter
      const lastResetDate = localStorage.getItem('redeployLastResetDate');
      const today = new Date().toDateString();

      if (lastResetDate !== today) {
        // New day, reset counter
        localStorage.setItem('redeployCount', '0');
        localStorage.setItem('redeployLastResetDate', today);
        redeployCount.value = 0;
      } else {
        // Load existing count
        const savedCount = localStorage.getItem('redeployCount');
        redeployCount.value = savedCount ? parseInt(savedCount) : 0;
      }

      // Check cooldown status
      const savedCooldownEnd = localStorage.getItem('redeployCooldownEnd');
      if (savedCooldownEnd) {
        const endTime = parseInt(savedCooldownEnd);
        if (Date.now() < endTime) {
          cooldownEndTime.value = endTime;
          redeployDisabled.value = true;

          // Set timeout to re-enable when cooldown expires
          const timeRemaining = endTime - Date.now();
          setTimeout(() => {
            redeployDisabled.value = false;
            cooldownEndTime.value = null;
            localStorage.removeItem('redeployCooldownEnd');
          }, timeRemaining);
        } else {
          // Cooldown expired, clean up
          localStorage.removeItem('redeployCooldownEnd');
        }
      }
    } catch (error) {
      // Fallback if localStorage is not available
      console.log('localStorage not available, using session-only cooldown');
    }
  });

  // Detect mobile vs. desktop on client-side
  useVisibleTask$(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)"); // Tailwind's md breakpoint
    store.isMobile = mediaQuery.matches;
    store.isInitialized = true;
    
    const handler = (e: MediaQueryListEvent) => {
      store.isMobile = e.matches;
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  });

  // Close dropdown when clicking outside
  useVisibleTask$(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.avatar-dropdown')) {
        dropdownOpen.value = false;
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  const toggleDropdown = $(() => {
    dropdownOpen.value = !dropdownOpen.value;
  });

  const handleLogout = $(() => {
    dropdownOpen.value = false;
    signOutSig.submit({ redirectTo: "/" });
  });

  const handleRedeploy = $(async () => {
    if (redeployDisabled.value) return;

    dropdownOpen.value = false;

    // Determine cooldown duration based on redeploy count
    // First redeploy: 5 minutes, subsequent: 10 minutes
    const cooldownDuration = redeployCount.value === 0 ? 5 * 60 * 1000 : 10 * 60 * 1000;
    const endTime = Date.now() + cooldownDuration;

    redeployDisabled.value = true;
    cooldownEndTime.value = endTime;

    // Increment and save redeploy count
    const newCount = redeployCount.value + 1;
    redeployCount.value = newCount;

    try {
      // Save cooldown and count to localStorage if available
      localStorage.setItem('redeployCooldownEnd', endTime.toString());
      localStorage.setItem('redeployCount', newCount.toString());
    } catch (error) {
      // localStorage not available, cooldown will only last this session
      console.log('localStorage not available, using session-only cooldown');
    }

    // Set timeout to re-enable after cooldown
    setTimeout(() => {
      redeployDisabled.value = false;
      cooldownEndTime.value = null;
      try {
        localStorage.removeItem('redeployCooldownEnd');
      } catch (error) {
        // Ignore localStorage errors
      }
    }, cooldownDuration);

    try {
      // Replace 'YOUR_WEBHOOK_URL' with your actual Vercel webhook URL
      const response = await fetch('https://api.vercel.com/v1/integrations/deploy/prj_8uYSIj5wWDZfkCe63QhJbRMfAYbG/NmjHM9d6Zy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add any required payload or authentication headers
        body: JSON.stringify({
          // Add any required data for your webhook
        })
      });
      
      if (response.ok) {
        // You might want to show a success message or notification
        console.log('Redeploy triggered successfully');
      } else {
        console.error('Failed to trigger redeploy');
      }
    } catch (error) {
      console.error('Error triggering redeploy:', error);
    }
  });

  // Helper function to render avatar
  const renderAvatar = () => {
    const user = session.value?.user;
    const isAdminUser = user?.role === 'admin' || user?.email === 'admin';
    
    if (isAdminUser || !user?.image) {
      // Show letter avatar for admin users or users without images
      return (
        <div class="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
          A
        </div>
      );
    }
    
    // Show regular avatar for users with images
    return (
      <Avatar
        src={user.image}
        alt={user.name ?? ""}
      />
    );
  };

  return (
    <header class="flex h-20 max-w-7xl mx-auto items-center gap-3 border-b px-4 py-3">
      <img src="/images/logo.svg" alt="Logo" class="h-12 w-12 mr-3" />
      {/* <span class="text-xl font-bold text-slate-800">earthen vessels</span> */}

      {session.value?.user ? (
        <div class="ml-auto flex items-center justify-center gap-8">
          {/* Desktop Navigation - Hidden on mobile */}
          <nav class="hidden md:flex items-center gap-8">
            <Link href="/classes" class="text-lg font-medium text-slate-800 hover:text-slate-600 transition-colors">
              Classes
            </Link>
            <Link href="/banners" class="text-lg font-medium text-slate-800 hover:text-slate-600 transition-colors">
              Banners
            </Link>
            <Link href="/gallery" class="text-lg font-medium text-slate-800 hover:text-slate-600 transition-colors">
              Gallery
            </Link>
            <Link href="/reviews" class="text-lg font-medium text-slate-800 hover:text-slate-600 transition-colors">
              Reviews
            </Link>
            <Link href="/faqs" class="text-lg font-medium text-slate-800 hover:text-slate-600 transition-colors">
              FAQs
            </Link>
          </nav>

          {/* Mobile Menu Button - Shown only on mobile */}
          <div class="md:hidden">
            <MenuModal />
          </div>

          {/* Avatar Dropdown - Always visible */}
          <div class="relative avatar-dropdown">
            <button
              onClick$={toggleDropdown}
              class="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label="User menu"
            >
              {renderAvatar()}
              {/* Chevron down icon */}
              <svg
                class={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
                  dropdownOpen.value ? 'rotate-180' : 'rotate-0'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen.value && (
              <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div class="py-1">
                  {/* User Info */}
                  <div class="px-4 py-2 border-b border-gray-100">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {session.value.user.name}
                    </p>
                    <p class="text-xs text-gray-500 truncate">
                      {session.value.user.email}
                    </p>
                  </div>
                  
                  {/* Redeploy Button */}
                  <button
                    onClick$={handleRedeploy}
                    disabled={redeployDisabled.value}
                    class={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      redeployDisabled.value 
                        ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer'
                    }`}
                  >
                    <div class="flex items-center gap-2">
                      <svg 
                        class={`w-4 h-4 ${redeployDisabled.value ? 'text-gray-400' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>
                        {redeployDisabled.value ? 'Redeploy (Pending)' : 'Redeploy'}
                      </span>
                    </div>
                  </button>

                  {/* Divider */}
                  <div class="border-t border-gray-100 my-1"></div>

                  {/* Logout Button */}
                  <button
                    onClick$={handleLogout}
                    class="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900 transition-colors"
                  >
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div class="ml-auto flex items-center justify-center">
          <Link
            class="cursor-pointer text-xl font-bold text-slate-800 hover:text-slate-600 transition-colors"
            onClick$={() => signInSig.submit({ redirectTo: "/" })}
          >
            Login
          </Link>
        </div>
      )}
    </header>
  );
});