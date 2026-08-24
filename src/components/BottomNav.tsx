"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import { navItems } from "@/lib/nav";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-rule bg-paper-raised/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-between px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex flex-col items-center gap-1 py-3 text-[11px] tracking-wide"
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.25 : 1.5}
                  className={active ? "text-accent" : "text-muted"}
                />
                <span
                  className={
                    active
                      ? "font-medium text-accent"
                      : "text-muted"
                  }
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <SignOutButton
            className="flex w-full flex-col items-center gap-1 py-3 text-[11px] tracking-wide text-muted"
            iconSize={20}
          />
        </li>
      </ul>
    </nav>
  );
}
