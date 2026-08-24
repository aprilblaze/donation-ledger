"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import { navItems } from "@/lib/nav";

export default function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-rule bg-paper-raised px-4 py-6 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <Image
          src="/logo-mark.svg"
          alt=""
          width={200}
          height={200}
          className=" shrink-0"
        />
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-paper"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 1.5} />
              <span className={active ? "font-medium" : ""}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-rule pt-4">
        <SignOutButton className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-ink-soft hover:bg-paper" />
      </div>
    </aside>
  );
}
