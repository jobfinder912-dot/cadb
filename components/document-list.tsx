"use client";

import { ArrowUpRightIcon, FileIcon } from "@/components/icons";
import { Label } from "@/components/ui";
import { formatBytes, type LayoutMode, type PdfDocument } from "@/lib/types";

export function FileTile({
  doc,
  className = "",
}: {
  doc: PdfDocument;
  className?: string;
}) {
  return (
    <span
      className={`accent-${doc.accent} relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent)] ${className}`}
    >
      <FileIcon className="size-[45%]" />
    </span>
  );
}

function DocumentCard({ doc, onOpen }: { doc: PdfDocument; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label={`Read ${doc.title}`}
      className="sb-panel group flex w-full items-center gap-3 p-3 text-left transition-colors hover:border-primary/45 hover:bg-panel/40"
    >
      <FileTile doc={doc} className="size-10" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">{doc.title}</span>
        <span className="mt-1 block truncate font-mono text-[10px] text-ink-faint">
          {doc.month} · {formatBytes(doc.size)}
        </span>
      </span>
      <ArrowUpRightIcon className="size-4 shrink-0 text-ink-faint transition-colors group-hover:text-primary" />
    </button>
  );
}

function DocumentGridCard({ doc, onOpen }: { doc: PdfDocument; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label={`Read ${doc.title}`}
      className="sb-panel group flex h-full flex-col p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-panel/40"
    >
      <FileTile doc={doc} className="h-20 w-full" />
      <span className="mt-3 block min-h-[38px] text-[13px] font-medium leading-snug text-ink">{doc.title}</span>
      <span className="mt-1 block truncate font-mono text-[10px] text-ink-faint">{doc.fileName}</span>
      <span className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="font-mono text-[10px] text-ink-faint">{doc.month}</span>
        <ArrowUpRightIcon className="size-3.5 text-ink-faint transition-colors group-hover:text-primary" />
      </span>
    </button>
  );
}

export default function DocumentList({
  documents,
  layout,
  onOpen,
}: {
  documents: PdfDocument[];
  layout: LayoutMode;
  onOpen: (document: PdfDocument) => void;
}) {
  if (layout === "grid") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {documents.map((doc) => (
          <DocumentGridCard key={doc.id} doc={doc} onOpen={() => onOpen(doc)} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="sb-panel hidden overflow-hidden md:block">
        <div className="grid grid-cols-[minmax(0,1fr)_95px_28px] items-center gap-3 border-b border-line bg-panel/40 px-4 py-2.5 lg:grid-cols-[minmax(0,1fr)_130px_110px_80px_28px]">
          <Label>Name</Label>
          <Label className="hidden lg:block">Type</Label>
          <Label>Month</Label>
          <Label className="hidden lg:block">Size</Label>
          <span className="sr-only">Open</span>
        </div>
        <div className="divide-y divide-line">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onOpen(doc)}
              className="grid w-full grid-cols-[minmax(0,1fr)_95px_28px] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-panel/50 lg:grid-cols-[minmax(0,1fr)_130px_110px_80px_28px]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <FileTile doc={doc} className="size-8" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-ink">{doc.title}</span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] text-ink-faint">{doc.fileName}</span>
                </span>
              </span>
              <span className="hidden truncate text-[12px] text-ink-soft lg:block">{doc.period}</span>
              <span className="truncate font-mono text-[11px] text-ink-soft">{doc.month.split(" ")[0]}</span>
              <span className="hidden truncate font-mono text-[11px] text-ink-faint lg:block">{formatBytes(doc.size)}</span>
              <ArrowUpRightIcon className="size-4 text-ink-faint transition-colors hover:text-primary" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 md:hidden">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} onOpen={() => onOpen(doc)} />
        ))}
      </div>
    </>
  );
}
