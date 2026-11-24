"use client";

import {
  ChevronDownIcon,
  CloseIcon,
  HelpIcon,
  HistoryIcon,
  HomeIcon,
  LayersIcon,
  SparkIcon,
} from "@/components/icons";
import { Label } from "@/components/ui";
import type { MonthGroup, ViewId } from "@/lib/types";

type SidebarProps = {
  view: ViewId;
  onNavigate: (view: ViewId) => void;
  onSelectMonth: (key: string) => void;
  months: MonthGroup[];
  activeMonth: string;
  documentsCount: number;
  recentCount: number;
  storageLabel: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

function SidebarContent({
  view,
  onNavigate,
  onSelectMonth,
  months,
  activeMonth,
  documentsCount,
  recentCount,
  storageLabel,
  onCloseMobile,
}: Omit<SidebarProps, "mobileOpen">) {
  const primaryNav = [
    { id: "overview" as const, label: "Overview", icon: HomeIcon },
    { id: "library" as const, label: "Library", icon: LayersIcon, count: documentsCount },
    { id: "recent" as const, label: "Recent", icon: HistoryIcon, count: recentCount },
    { id: "guide" as const, label: "Guide", icon: HelpIcon },
  ];

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-4">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-on-primary">
          <SparkIcon className="size-4" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-ink">
          varta<span className="text-primary">_</span>
        </span>
        <button
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="ml-auto flex size-8 items-center justify-center rounded-md text-ink-faint hover:bg-panel hover:text-ink lg:hidden"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div className="app-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <button
          onClick={() => onNavigate("overview")}
          className="flex w-full items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-line-strong"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded border border-primary/25 bg-primary-soft font-mono text-[10px] font-bold text-primary">
            CA
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-medium text-ink">Current affairs</span>
            <span className="block truncate font-mono text-[10px] text-ink-faint">2026 edition</span>
          </span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-ink-faint" />
        </button>

        <div className="mt-6">
          <Label className="px-2">Workspace</Label>
          <nav className="mt-2 space-y-0.5">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  data-active={active}
                  className="sb-nav-item"
                >
                  <Icon className={`size-4 shrink-0 ${active ? "text-primary" : "text-ink-faint"}`} />
                  <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                  {item.count !== undefined ? (
                    <span className="font-mono text-[10px] text-ink-faint">{item.count}</span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between px-2">
            <Label>Collections</Label>
            <button
              onClick={() => {
                onSelectMonth("all");
                onNavigate("library");
              }}
              className="font-mono text-[10px] text-ink-faint transition-colors hover:text-primary"
            >
              View all
            </button>
          </div>
          <nav className="mt-2 space-y-0.5">
            {months.map((month) => {
              const active = activeMonth === month.key && view === "library";
              return (
                <button
                  key={month.key}
                  onClick={() => {
                    onSelectMonth(month.key);
                    onNavigate("library");
                  }}
                  data-active={active}
                  className="sb-nav-item"
                >
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${active ? "bg-primary" : "bg-line-strong"}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-left">{month.name}</span>
                  <span className="font-mono text-[10px] text-ink-faint">{month.count}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="shrink-0 border-t border-line p-3">
        <div className="rounded-md border border-line bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <Label>Archive status</Label>
            <span className="sb-dot" />
          </div>
          <p className="mt-2 text-[12px] text-ink">All notes indexed</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
            <div className="h-full w-full rounded-full bg-primary" />
          </div>
          <p className="mt-2 truncate font-mono text-[10px] text-ink-faint">{storageLabel}</p>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar(props: SidebarProps) {
  const close = () => props.onCloseMobile();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-line lg:block">
        <SidebarContent
          {...props}
          onNavigate={(view) => {
            props.onNavigate(view);
            close();
          }}
        />
      </aside>

      {props.mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            onClick={close}
            aria-label="Close navigation"
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
          />
          <div className="app-scroll relative h-full w-[272px] overflow-y-auto border-r border-line shadow-2xl">
            <SidebarContent
              {...props}
              onNavigate={(view) => {
                props.onNavigate(view);
                close();
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
