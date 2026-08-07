"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui";

/** Shared aside shell (brand header + mobile close + scroll area + footer
 * slot) used by both the admin and employee sidebars, so the structural
 * markup and mobile/desktop responsive behavior live in one place. */
export function SidebarShell({
  dir,
  sidebarOpen,
  onCloseSidebar,
  brandAr,
  brandEn,
  children,
  footer,
}: {
  dir: "rtl" | "ltr";
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  brandAr: string;
  brandEn: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const ar = dir === "rtl";
  const hiddenTranslate = dir === "rtl" ? "translate-x-full" : "-translate-x-full";

  return (
    <aside
      className={[
        "fixed inset-y-0 start-0 z-50 w-[272px]",
        "transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : hiddenTranslate,
        "lg:sticky lg:top-5 lg:z-auto lg:translate-x-0",
        "lg:h-[calc(100vh-36px)] lg:inset-y-auto lg:start-auto",
        "flex flex-col overflow-y-auto bg-white rounded-none lg:rounded-2xl shadow-[var(--shadow-card)] gap-1 mk-scrollbar-none pt-6 px-4 pb-5",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 px-2 pb-7">
        <div className="w-11 h-11 rounded-md flex items-center justify-center shrink-0 p-2 bg-mk-blue-50">
          <Image src="/assets/logo-symbol-v2.png" alt="Maarkbh" width={28} height={12} className="object-contain" />
        </div>
        <div className="flex-1">
          <div className="mk-h4 leading-none text-mk-ink-900 tracking-tight">{ar ? brandAr : brandEn}</div>
          <div className="mk-overline mt-1 text-mk-ink-400 tracking-brand font-arabic normal-case tracking-wide">
            {ar ? brandEn : brandAr}
          </div>
        </div>
        <button
          onClick={onCloseSidebar}
          className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-mk-ink-500 hover:text-mk-ink-900 hover:bg-mk-ink-100 border-0 cursor-pointer transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {children}

      <div className="flex-1" />

      {footer}
    </aside>
  );
}

interface SidebarNavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  labelAr: string;
  ar: boolean;
  active: boolean;
  dir: "rtl" | "ltr";
  badge?: number;
  onClick?: () => void;
}

export function SidebarNavLink({ href, icon: Icon, label, labelAr, ar, active, dir, badge, onClick }: SidebarNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`mk-nav-item flex items-center gap-4 px-4 py-3 rounded-md mk-body-sm transition-all duration-fast relative mb-1 no-underline ${
        active ? "bg-mk-blue-500 text-white shadow-[var(--shadow-glow-blue)]" : "bg-transparent text-mk-ink-600 hover:bg-mk-ink-50"
      }`}
    >
      {active && (
        <span
          className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-mk-blue-500"
          style={{ insetInlineStart: -16, borderRadius: dir === "rtl" ? "4px 0 0 4px" : "0 4px 4px 0" }}
        />
      )}
      <Icon size={18} className="shrink-0" />
      <span className="flex-1">{ar ? labelAr : label}</span>
      {badge !== undefined && (
        <Badge variant={active ? "inverse" : "danger"} size="sm" className="min-w-5 justify-center uppercase tracking-wide">
          {badge}
        </Badge>
      )}
    </Link>
  );
}

export function SidebarRoleSwitcher({
  ar,
  activeIsFirst,
  firstLabelAr,
  firstLabelEn,
  secondLabelAr,
  secondLabelEn,
  onSelectOther,
}: {
  ar: boolean;
  activeIsFirst: boolean;
  firstLabelAr: string;
  firstLabelEn: string;
  secondLabelAr: string;
  secondLabelEn: string;
  onSelectOther: () => void;
}) {
  const pill = (active: boolean, labelAr: string, labelEn: string, onClick?: () => void) => (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded-full mk-label border-0 transition-colors ${
        active ? "bg-mk-blue-500 text-white cursor-default" : "bg-transparent text-mk-ink-600 hover:text-mk-ink-900 cursor-pointer"
      }`}
    >
      {ar ? labelAr : labelEn}
    </button>
  );

  return (
    <div className="flex items-center gap-1 bg-white rounded-full p-1">
      {pill(activeIsFirst, firstLabelAr, firstLabelEn, activeIsFirst ? undefined : onSelectOther)}
      {pill(!activeIsFirst, secondLabelAr, secondLabelEn, !activeIsFirst ? undefined : onSelectOther)}
    </div>
  );
}

export function SidebarUserCard({
  ar,
  initials,
  gradient,
  name,
  nameAr,
  sub,
  subAr,
  onToggleDir,
}: {
  ar: boolean;
  initials: { ar: string; en: string };
  gradient: string;
  name: string;
  nameAr: string;
  sub: string;
  subAr: string;
  onToggleDir: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-1 pt-3 border-t border-black/[0.06] mt-1">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white mk-label shrink-0"
        style={{ background: gradient }}
      >
        {ar ? initials.ar : initials.en}
      </div>
      <div className="min-w-0">
        <div className="mk-label leading-[var(--lh-h2)] truncate text-mk-ink-900">{ar ? nameAr : name}</div>
        <div
          className="mk-overline normal-case tracking-normal truncate text-mk-ink-500 cursor-pointer"
          onClick={onToggleDir}
          title="Toggle language"
        >
          {ar ? subAr : sub}
        </div>
      </div>
    </div>
  );
}
