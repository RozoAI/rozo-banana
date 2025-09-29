"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAccount } from "wagmi";

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className = "" }: BottomNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected } = useAccount();

  const navItems = useMemo(() => {
    const items = [
      {
        href: "/topup",
        icon: "💎",
        label: "Rozo OG",
        isActive: pathname === "/topup",
        hasHotBadge: true,
      },
      {
        href: "/generate",
        icon: "🎨",
        label: "Generate",
        isActive: pathname === "/generate",
      },
      {
        href: "/gallery",
        icon: "🖼️",
        label: "Gallery",
        isActive: pathname === "/gallery",
        hasHotBadge: false,
      },
    ];

    if (isConnected) {
      items.push({
        href: "/profile",
        icon: "👤",
        label: "Profile",
        isActive: pathname === "/profile",
      });
    }

    return items;
  }, [isConnected]);

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
      className={`fixed bottom-0 left-0 right-0 bg-[rgb(17,17,17)] border-t border-gray-800 ${className}`}
    >
      <div className="max-w-lg mx-auto">
        <div
          className={`grid ${
            navItems.length === 4 ? "grid-cols-4" : "grid-cols-3"
          }`}
        >
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`py-3 text-center transition-colors relative w-full ${
                item.isActive
                  ? "text-[rgb(245,210,60)]"
                  : "text-gray-400 hover:text-[rgb(245,210,60)]"
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
