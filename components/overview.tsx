"use client";

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  ClockIcon,
  FileIcon,
  LayersIcon,
} from "@/components/icons";
import { FileTile } from "@/components/document-list";
import { Button, EmptyState, Label, Panel, SectionHeading, StatCard } from "@/components/ui";
import { formatBytes, type MonthGroup, type PdfDocument, type ViewId } from "@/lib/types";

type OverviewProps = {
  documents: PdfDocument[];
  months: MonthGroup[];
  recentDocs: PdfDocument[];
  storageLabel: string;
  onOpen: (document: PdfDocument) => void;
  onNavigate: (view: ViewId) => void;
  onSelectMonth: (key: string) => void;
};

export default function Overview({
  documents,
  months,
  recentDocs,
  storageLabel,
  onOpen,
  onNavigate,
  onSelectMonth,
}: OverviewProps) {
  const latest = documents.slice(0, 5);
  const latestMonth = months[0]?.name ?? "—";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Workspace / Overview"
        title="Your archive, at a glance."
        description="Everything you need to find a week, open a note, and get back to revision."
        action={
          <Button variant="primary" onClick={() => onNavigate("library")}>
            Browse library
            <ArrowRightIcon className="size-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Documents" value={String(documents.length)} hint="PDFs in this workspace" icon={<FileIcon className="size-3.5" />} />
        <StatCard label="Months" value={String(months.length)} hint="Covered in the archive" icon={<CalendarIcon className="size-3.5" />} />
        <StatCard label="Latest" value={latestMonth} hint="Most recent collection" icon={<ClockIcon className="size-3.5" />} />
        <StatCard label="Storage" value={formatBytes(documents.reduce((total, doc) => total + doc.size, 0))} hint={storageLabel} icon={<LayersIcon className="size-3.5" />} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <Label>Continue reading</Label>
              <h2 className="mt-1 text-[14px] font-medium text-ink">Pick up where you left off</h2>
            </div>
            <button
              onClick={() => onNavigate("recent")}
              className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-faint transition-colors hover:text-primary"
            >
              View all
              <ArrowUpRightIcon className="size-3" />
            </button>
          </div>

          {recentDocs.length > 0 ? (
            <div className="divide-y divide-line">
              {recentDocs.slice(0, 3).map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onOpen(doc)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-panel/50"
                >
                  <FileTile doc={doc} className="size-9" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-ink">{doc.title}</span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-ink-faint">
                      {doc.month} · {formatBytes(doc.size)}
                    </span>
                  </span>
                  <ArrowRightIcon className="size-4 shrink-0 text-ink-faint" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={<ClockIcon className="size-5" />}
                title="No recent reads yet"
                description="Open any note and it will show up here for quick access."
                action={
                  <Button variant="secondary" size="sm" onClick={() => onNavigate("library")}>
                    Open the library
                  </Button>
                }
              />
            </div>
          )}
        </Panel>

        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <Label>Latest additions</Label>
              <h2 className="mt-1 text-[14px] font-medium text-ink">Fresh in the archive</h2>
            </div>
            <button
              onClick={() => onNavigate("library")}
              className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-faint transition-colors hover:text-primary"
            >
              View all
              <ArrowUpRightIcon className="size-3" />
            </button>
          </div>
          <div className="divide-y divide-line">
            {latest.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onOpen(doc)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-panel/50"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] text-ink">{doc.title}</span>
                  <span className="block truncate font-mono text-[10px] text-ink-faint">{doc.month}</span>
                </span>
                <ArrowUpRightIcon className="size-3.5 shrink-0 text-ink-faint" />
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <Label>Collections</Label>
            <h2 className="mt-1 text-[14px] font-medium text-ink">Browse by month</h2>
          </div>
          <button
            onClick={() => {
              onSelectMonth("all");
              onNavigate("library");
            }}
            className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-faint transition-colors hover:text-primary"
          >
            All notes
            <ArrowUpRightIcon className="size-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 xl:grid-cols-4">
          {months.map((month) => (
            <button
              key={month.key}
              onClick={() => {
                onSelectMonth(month.key);
                onNavigate("library");
              }}
              className="group flex items-center justify-between gap-3 bg-surface px-4 py-4 text-left transition-colors hover:bg-panel"
            >
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-ink">{month.name}</span>
                <span className="mt-1 block font-mono text-[10px] text-ink-faint">{month.count} notes</span>
              </span>
              <ArrowUpRightIcon className="size-4 shrink-0 text-ink-faint transition-colors group-hover:text-primary" />
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}
