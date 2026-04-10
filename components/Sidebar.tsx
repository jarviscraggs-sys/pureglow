"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard", icon: "◈" },
  { href: "/bookings", label: "Bookings", icon: "📅" },
  { href: "/customers", label: "Customers", icon: "👥" },
  { href: "/packages", label: "Packages", icon: "📦" },
  { href: "/beds", label: "Beds", icon: "🛏" },
  { href: "/products", label: "Products", icon: "🧴" },
  { href: "/deals", label: "Deals", icon: "🏷" },
  { href: "/staff", label: "Staff", icon: "👤" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ width: 240 }}
      className="fixed left-0 top-0 h-screen bg-[#060c1a] border-r border-white/10 flex flex-col z-40"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <span className="text-[#f97316] font-bold text-xl tracking-widest">PURE</span>
        <span className="text-white font-bold text-xl tracking-widest">GLOW</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                active
                  ? "bg-[#f97316]/10 text-[#f97316] border-r-2 border-[#f97316]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full text-left text-sm text-white/40 hover:text-white/70 transition-colors px-2 py-1"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
