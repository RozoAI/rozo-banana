"use client";

import { usePathname, useRouter } from "next/navigation";

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className = "" }: BottomNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      href: "/",
      icon: "🏠",
      label: "Home",
      isActive: pathname === "/",
    },
    {
      href: "/generate",
      icon: "🎨",
      label: "Generate",
      isActive: pathname === "/generate",
    },
    {
      href: "/recharge",
      icon: "💎",
      label: "Top Up",
      isActive: pathname === "/recharge",
      hasHotBadge: true,
    },
    {
      href: "/gallery",
      icon: "🖼️",
      label: "Gallery",
      isActive: pathname === "/gallery",
    },
  ];

  const handleNavigation = (href: string) => {
    // Force navigation by using router.push with replace for home page
    if (href === "/") {
      router.replace("/");
    } else {
      router.push(href);
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 ${className}`}
    >
      <div className="max-w-lg mx-auto">
        <div className="grid grid-cols-4">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`py-3 text-center transition-colors relative w-full ${
                item.isActive
                  ? "text-yellow-600"
                  : "text-gray-400 hover:text-yellow-600"
              }`}
            >
              {item.hasHotBadge && (
                <div className="absolute -top-1 right-1/4 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  HOT
                </div>
              )}
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className="text-xs font-medium">{item.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
