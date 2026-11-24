"use client";

import { GridIcon, ListIcon, SearchIcon } from "@/components/icons";
import DocumentList from "@/components/document-list";
import { Button, EmptyState, Label, SectionHeading } from "@/components/ui";
import type { LayoutMode, MonthGroup, PdfDocument, SortMode } from "@/lib/types";

type LibraryViewProps = {
  documents: PdfDocument[];
  visible: PdfDocument[];
  months: MonthGroup[];
  query: string;
  onQueryChange: (value: string) => void;
  month: string;
  onMonthChange: (value: string) => void;
  sort: SortMode;
  onSortChange: (value: SortMode) => void;
  layout: LayoutMode;
  onLayoutChange: (value: LayoutMode) => void;
  onOpen: (document: PdfDocument) => void;
  onReset: () => void;
};

export default function LibraryView({
  documents,
  visible,
  months,
  query,
  onQueryChange,
  month,
  onMonthChange,
  sort,
  onSortChange,
  layout,
  onLayoutChange,
  onOpen,
  onReset,
}: LibraryViewProps) {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Workspace / Library"
        title="Library"
        description="Search the archive, narrow by month, and open any PDF in the built-in reader."
        action={
          <span className="sb-panel px-3 py-2 font-mono text-[11px] text-ink-faint">
            <span className="text-primary">{visible.length}</span> / {documents.length} notes
          </span>
        }
      />

      <div className="sb-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-3 lg:flex-row lg:items-center">
          <label className="relative flex min-w-0 flex-1 items-center">
            <SearchIcon className="pointer-events-none absolute left-3 size-3.5 text-ink-faint" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Filter by week, topic, or file name..."
              aria-label="Filter notes"
              className="sb-input h-9 pl-9 pr-3 text-[13px]"
            />
          </label>

          <div className="flex shrink-0 items-center gap-2">
            <label className="relative flex items-center">
              <span className="sr-only">Sort notes</span>
              <select
                value={sort}
                onChange={(event) => onSortChange(event.target.value as SortMode)}
                className="sb-input h-9 appearance-none py-0 pl-3 pr-8 text-[12px]"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="title">Title A–Z</option>
              </select>
              <span className="pointer-events-none absolute right-3 font-mono text-[9px] text-ink-faint">▼</span>
            </label>

            <div className="flex h-9 items-center rounded-md border border-line bg-background p-0.5">
              <button
                onClick={() => onLayoutChange("table")}
                aria-label="Table view"
                aria-pressed={layout === "table"}
                className={`flex size-8 items-center justify-center rounded transition-colors ${
                  layout === "table" ? "bg-primary text-on-primary" : "text-ink-faint hover:text-ink"
                }`}
              >
                <ListIcon className="size-4" />
              </button>
              <button
                onClick={() => onLayoutChange("grid")}
                aria-label="Grid view"
                aria-pressed={layout === "grid"}
                className={`flex size-8 items-center justify-center rounded transition-colors ${
                  layout === "grid" ? "bg-primary text-on-primary" : "text-ink-faint hover:text-ink"
                }`}
              >
                <GridIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="scrollbar-none flex gap-2 overflow-x-auto px-3 py-3">
          <button
            onClick={() => onMonthChange("all")}
            className={`shrink-0 rounded-md px-3 py-1.5 font-mono text-[11px] transition-colors ${
              month === "all" ? "bg-primary text-on-primary" : "bg-panel text-ink-soft hover:bg-panel-strong hover:text-ink"
            }`}
          >
            All <span className="ml-1 opacity-70">{documents.length}</span>
          </button>
          {months.map((item) => (
            <button
              key={item.key}
              onClick={() => onMonthChange(item.key)}
              className={`shrink-0 rounded-md px-3 py-1.5 font-mono text-[11px] transition-colors ${
                month === item.key ? "bg-primary text-on-primary" : "bg-panel text-ink-soft hover:bg-panel-strong hover:text-ink"
              }`}
            >
              {item.name} <span className="ml-1 opacity-70">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length > 0 ? (
        <DocumentList documents={visible} layout={layout} onOpen={onOpen} />
      ) : (
        <EmptyState
          icon={<SearchIcon className="size-5" />}
          title="No notes found"
          description="Try a different week, month, or keyword. Your archive is still here."
          action={
            <Button variant="secondary" size="sm" onClick={onReset}>
              Reset filters
            </Button>
          }
        />
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <Label>Showing {visible.length} of {documents.length}</Label>
        <Label className="hidden sm:block">Select a note to open the reader</Label>
      </div>
    </div>
  );
}
