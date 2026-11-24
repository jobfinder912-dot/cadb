"use client";

import type { RefObject } from "react";

import { ArrowRightIcon, MenuIcon, SearchIcon } from "@/components/icons";
import { Badge, Button } from "@/components/ui";
import type { ViewId } from "@/lib/types";

type TopbarProps = {
  view: ViewId;
  query: string;
  onQueryChange: (value: string) => void;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
  onOpenLibrary: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
};

const labels: Record<ViewId, string> = {
  overview: "Overview",
  library: "Library",
  recent: "Recent",
  guide: "Guide",
};

export default function Topbar({
  view,
  query,
  onQueryChange,
  onOpenMenu,
  onOpenSearch,
  onOpenLibrary,
  searchRef,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-background/90 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onOpenMenu}
        aria-label="Open navigation"
        className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-ink-soft transition-colors hover:border-line-strong hover:text-ink lg:hidden"
      >
        <MenuIcon className="size-4" />
      </button>

      <div className="hidden min-w-0 items-center gap-2 font-mono text-[11px] text-ink-faint sm:flex">
        <span className="hidden sm:inline">workspace</span>
        <span className="hidden text-line-strong sm:inline">/</span>
        <span className="truncate text-ink-soft">{labels[view]}</span>
      </div>

      <label className="relative hidden w-[260px] shrink-0 items-center md:flex xl:w-[320px]">
        <SearchIcon className="pointer-events-none absolute left-3 size-3.5 text-ink-faint" />
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search notes..."
          aria-label="Search notes"
          className="sb-input h-9 pl-9 pr-12 text-[13px]"
        />
        <kbd className="pointer-events-none absolute right-2.5 rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
          /
        </kbd>
      </label>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button
          onClick={onOpenSearch}
          aria-label="Open search"
          className="flex size-9 items-center justify-center rounded-md border border-line bg-surface text-ink-soft transition-colors hover:border-line-strong hover:text-ink md:hidden"
        >
          <SearchIcon className="size-4" />
        </button>

        <Badge tone="primary">
          <span className="sb-dot mr-1.5" />
          Local
        </Badge>

        <Button variant="primary" size="sm" onClick={onOpenLibrary} className="hidden sm:inline-flex">
          Library
          <ArrowRightIcon className="size-3.5" />
        </Button>

        <span className="hidden size-8 items-center justify-center rounded-full border border-line bg-panel font-mono text-[10px] font-semibold text-ink-soft sm:flex">
          CA
        </span>
      </div>
    </header>
  );
}
