"use client";

import { useEffect } from "react";

import PdfViewer from "@/components/pdf-viewer";
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DownloadIcon,
} from "@/components/icons";
import { Label } from "@/components/ui";
import { formatBytes, type PdfDocument } from "@/lib/types";

type PdfReaderProps = {
  pdf: PdfDocument;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
};

const iconButton =
  "flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-panel text-ink-soft transition-colors hover:border-primary/45 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30";

export default function PdfReader({
  pdf: doc,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: PdfReaderProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col bg-[var(--overlay)] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
    >
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary-soft font-mono text-[10px] font-bold text-primary">
          PDF
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Label className="hidden sm:block">Reader</Label>
            <p className="truncate text-[13px] font-medium text-ink">{doc.title}</p>
          </div>
          <p className="truncate font-mono text-[10px] text-ink-faint">
            {doc.month} · {doc.period} · {formatBytes(doc.size)}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={onPrevious} disabled={!hasPrevious} aria-label="Previous note" className={`${iconButton} hidden sm:flex`}>
            <ChevronLeftIcon className="size-4" />
          </button>
          <button onClick={onNext} disabled={!hasNext} aria-label="Next note" className={`${iconButton} hidden sm:flex`}>
            <ChevronRightIcon className="size-4" />
          </button>
          <a href={`${doc.url}&download=1`} className={`${iconButton} hidden sm:flex`} aria-label="Download PDF" title="Download PDF">
            <DownloadIcon className="size-4" />
          </a>
          <a href={doc.url} target="_blank" rel="noreferrer" className={`${iconButton} hidden sm:flex`} aria-label="Open in new tab" title="Open in new tab">
            <ArrowUpRightIcon className="size-4" />
          </a>
          <button
            onClick={onClose}
            aria-label="Close reader"
            className="sb-primary flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 sm:mx-4 sm:mb-0 sm:mt-3 sm:overflow-hidden sm:rounded-md sm:border sm:border-line">
        <PdfViewer key={doc.id} url={doc.url} title={doc.title} />
      </div>

      <div className="hidden shrink-0 items-center justify-between border-t border-line bg-surface px-5 py-2 font-mono text-[10px] text-ink-faint sm:flex">
        <span>Pages render inside Varta, including on mobile.</span>
        <span>Esc to close · ← → for pages</span>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-2 border-t border-line bg-surface px-4 py-2.5 sm:hidden">
        <button onClick={onPrevious} disabled={!hasPrevious} aria-label="Previous note" className={iconButton}>
          <ChevronLeftIcon className="size-4" />
        </button>
        <button onClick={onNext} disabled={!hasNext} aria-label="Next note" className={iconButton}>
          <ChevronRightIcon className="size-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-line" />
        <a href={`${doc.url}&download=1`} className={iconButton} aria-label="Download PDF" title="Download PDF">
          <DownloadIcon className="size-4" />
        </a>
        <a href={doc.url} target="_blank" rel="noreferrer" className={iconButton} aria-label="Open in new tab" title="Open in new tab">
          <ArrowUpRightIcon className="size-4" />
        </a>
      </div>
    </div>
  );
}
