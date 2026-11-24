"use client";

import { useEffect, useState } from "react";

import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DownloadIcon,
} from "@/components/icons";
import { formatBytes, type PdfDocument } from "@/lib/types";

type PdfReaderProps = {
  pdf: PdfDocument;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
};

export default function PdfReader({
  pdf: doc,
  onClose,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: PdfReaderProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasPrevious) onPrevious();
      if (event.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, onPrevious, onNext, hasPrevious, hasNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#030910]/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
    >
      <div className="flex items-center gap-2.5 border-b border-line bg-surface px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary-soft font-mono text-[10px] font-bold text-primary sm:size-10 sm:text-[11px]">
          PDF
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-ink sm:text-sm">{doc.title}</p>
          <p className="truncate font-mono text-[10px] text-ink-faint sm:text-[11px]">
            {doc.month} &nbsp;·&nbsp; {doc.period}
            <span className="hidden sm:inline"> &nbsp;·&nbsp; {formatBytes(doc.size)}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            aria-label="Previous note"
            className="hidden size-9 items-center justify-center rounded-md border border-line bg-panel text-ink-soft transition hover:border-primary/50 hover:text-primary disabled:opacity-30 sm:flex"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next note"
            className="hidden size-9 items-center justify-center rounded-md border border-line bg-panel text-ink-soft transition hover:border-primary/50 hover:text-primary disabled:opacity-30 sm:flex"
          >
            <ChevronRightIcon className="size-5" />
          </button>
          <a
            href={`${doc.url}&download=1`}
            className="hidden size-9 items-center justify-center rounded-md border border-line bg-panel text-ink-soft transition hover:border-primary/50 hover:text-primary sm:flex"
            aria-label="Download PDF"
            title="Download PDF"
          >
            <DownloadIcon className="size-5" />
          </a>
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            className="hidden size-9 items-center justify-center rounded-md border border-line bg-panel text-ink-soft transition hover:border-primary/50 hover:text-primary sm:flex"
            aria-label="Open in new tab"
            title="Open in new tab"
          >
            <ArrowUpRightIcon className="size-5" />
          </a>
          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-md bg-primary text-[#04130c] transition hover:bg-primary-bright active:scale-95"
            aria-label="Close reader"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
      </div>

      <div className="relative mx-2 flex-1 overflow-hidden rounded-t-lg border border-b-0 border-line bg-white sm:mx-6">
        {!loaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface">
            <div className="flex size-12 items-center justify-center rounded-lg border border-primary/25 bg-primary-soft font-mono text-xs font-bold text-primary">
              PDF
            </div>
            <p className="font-mono text-[11px] text-ink-faint">Opening {doc.month} notes…</p>
            <div className="h-1 w-32 overflow-hidden rounded-full bg-line">
              <div className="shimmer h-full w-full rounded-full" />
            </div>
          </div>
        )}
        <iframe
          key={doc.id}
          src={`${doc.url}#toolbar=1&navpanes=0`}
          title={`${doc.title} PDF viewer`}
          onLoad={() => setLoaded(true)}
          className="h-full w-full border-0"
        />
      </div>

      <div className="hidden items-center justify-between border-t border-line bg-surface px-5 py-2.5 font-mono text-[10px] text-ink-faint sm:flex sm:px-7">
        <span>Use your browser&apos;s PDF tools to search or print.</span>
        <span>Esc to close &nbsp;·&nbsp; ← → to browse</span>
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-line bg-surface px-4 py-3 sm:hidden">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label="Previous note"
          className="flex size-10 items-center justify-center rounded-md border border-line bg-panel text-ink-soft transition hover:border-primary/50 hover:text-primary disabled:opacity-30"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next note"
          className="flex size-10 items-center justify-center rounded-md border border-line bg-panel text-ink-soft transition hover:border-primary/50 hover:text-primary disabled:opacity-30"
        >
          <ChevronRightIcon className="size-5" />
        </button>
        <span className="h-6 w-px bg-line" />
        <a
          href={`${doc.url}&download=1`}
          className="flex size-10 items-center justify-center rounded-md border border-line bg-panel text-ink-soft transition hover:border-primary/50 hover:text-primary"
          aria-label="Download PDF"
          title="Download PDF"
        >
          <DownloadIcon className="size-5" />
        </a>
        <a
          href={doc.url}
          target="_blank"
          rel="noreferrer"
          className="flex size-10 items-center justify-center rounded-md border border-line bg-panel text-ink-soft transition hover:border-primary/50 hover:text-primary"
          aria-label="Open in new tab"
          title="Open in new tab"
        >
          <ArrowUpRightIcon className="size-5" />
        </a>
      </div>
    </div>
  );
}
