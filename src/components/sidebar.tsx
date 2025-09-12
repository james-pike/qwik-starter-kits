// ~/components/sidebar/sidebar.tsx
import { component$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";

interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

export const Sidebar = component$(() => {
  const location = useLocation();

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/classes", icon: "🏠" },
    { label: "Profile", href: "/classes", icon: "👤" },
    { label: "Settings", href: "/reviews", icon: "⚙️" },
    { label: "Analytics", href: "/faqs", icon: "📊" },
    { label: "Users", href: "/users", icon: "👥" },
    { label: "Reports", href: "/reports", icon: "📄" },
  ];

  return (
    <nav class="p-4">
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Navigation</h2>
      </div>
      
      <ul class="space-y-2">
        {navItems.map((item) => {
          const isActive = location.url.pathname === item.href;
          
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                class={[
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                ]}
              >
                {item.icon && (
                  <span class="mr-3 text-lg">{item.icon}</span>
                )}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      
      {/* Optional: Add a divider and secondary navigation */}
      <div class="mt-8 pt-4 border-t border-gray-200">
        <h3 class="text-sm font-medium text-gray-500 mb-3">Other</h3>
        <ul class="space-y-2">
          <li>
            <Link
              href="/help"
              class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
            >
              <span class="mr-3 text-lg">❓</span>
              Help
            </Link>
          </li>
          <li>
            <Link
              href="/logout"
              class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <span class="mr-3 text-lg">🚪</span>
              Logout
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
});