"use client";

import { useEffect, useMemo } from "react";

import { ArrowUpRightIcon, CloseIcon, FileIcon, SearchIcon } from "@/components/icons";
import { Label } from "@/components/ui";
import { formatBytes, type PdfDocument } from "@/lib/types";

type SearchDialogProps = {
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  documents: PdfDocument[];
  onOpen: (document: PdfDocument) => void;
};

export default function SearchDialog({
  open,
  onClose,
  query,
  onQueryChange,
  documents,
  onOpen,
}: SearchDialogProps) {
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? documents.filter((doc) =>
          [doc.title, doc.fileName, doc.month, doc.period].some((value) =>
            value.toLowerCase().includes(needle),
          ),
        )
      : documents;
    return matches.slice(0, 8);
  }, [documents, query]);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[8vh] sm:pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search notes">
      <button onClick={onClose} aria-label="Close search" className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm" />

      <div className="sb-panel relative w-full max-w-xl overflow-hidden shadow-[0_30px_80px_-40px_rgba(0,0,0,0.95)]">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <SearchIcon className="size-4 shrink-0 text-primary" />
          <input
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by week, topic, or file name..."
            aria-label="Search notes"
            className="h-12 min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="flex size-7 shrink-0 items-center justify-center rounded border border-line text-ink-faint transition-colors hover:text-ink"
          >
            <CloseIcon className="size-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5">
          <Label>{query ? `Results for "${query}"` : "Recent notes"}</Label>
          <span className="font-mono text-[10px] text-ink-faint">{results.length} shown</span>
        </div>

        <div className="app-scroll max-h-[52vh] overflow-y-auto border-t border-line p-2">
          {results.length > 0 ? (
            results.map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  onOpen(doc);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors hover:bg-panel"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded border border-primary/20 bg-primary-soft text-primary">
                  <FileIcon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-ink">{doc.title}</span>
                  <span className="block truncate font-mono text-[10px] text-ink-faint">
                    {doc.month} · {formatBytes(doc.size)}
                  </span>
                </span>
                <ArrowUpRightIcon className="size-3.5 shrink-0 text-ink-faint" />
              </button>
            ))
          ) : (
            <div className="px-4 py-10 text-center">
              <p className="text-[13px] text-ink">No matching notes</p>
              <p className="mt-1 text-[12px] text-ink-faint">Try a month, week, or file name.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2 font-mono text-[10px] text-ink-faint">
          <span>Enter a term to filter the archive</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
