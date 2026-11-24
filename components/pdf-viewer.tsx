"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

import { ChevronLeftIcon, ChevronRightIcon, FileIcon } from "@/components/icons";

type PdfViewerProps = {
  url: string;
  title: string;
};

const viewerButton =
  "flex size-8 shrink-0 items-center justify-center rounded-md border border-line bg-panel text-ink-soft transition-colors hover:border-primary/45 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30";

export default function PdfViewer({ url, title }: PdfViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const renderRef = useRef<RenderTask | null>(null);

  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(width);
    });
    observer.observe(element);
    setContainerWidth(element.clientWidth);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setStatus("loading");
      setMessage("");
      setPageNumber(1);
      setPageCount(0);

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Could not load PDF (${response.status})`);
        const data = await response.arrayBuffer();
        if (cancelled) return;

        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(data) });
        const pdf = await loadingTask.promise;
        if (cancelled) {
          void loadingTask.destroy();
          return;
        }

        documentRef.current = pdf;
        setPageCount(pdf.numPages);
        setStatus("ready");
      } catch (error) {
        if (cancelled || (error as Error).name === "AbortError") return;
        setMessage(error instanceof Error ? error.message : "Could not open this PDF.");
        setStatus("error");
      }
    }

    void load();

    return () => {
      cancelled = true;
      controller.abort();
      renderRef.current?.cancel();
      const pdf = documentRef.current;
      documentRef.current = null;
      if (pdf) void pdf.destroy();
    };
  }, [url, attempt]);

  useEffect(() => {
    if (status !== "ready" || !containerWidth) return;

    const pdf = documentRef.current;
    if (!pdf || pageNumber < 1 || pageNumber > pdf.numPages) return;

    let cancelled = false;

    async function render() {
      try {
        renderRef.current?.cancel();
        const page = await pdf!.getPage(pageNumber);
        if (cancelled) return;

        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;

        const base = page.getViewport({ scale: 1 });
        const available = Math.max(containerWidth - 32, 260);
        const fitScale = available / base.width;
        const scale = Math.min(Math.max(fitScale * zoom, 0.25), 4);
        const viewport = page.getViewport({ scale });
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const task = page.render({
          canvasContext: context,
          viewport,
          transform: [outputScale, 0, 0, outputScale, 0, 0],
        });
        renderRef.current = task;
        await task.promise;
      } catch (error) {
        if (cancelled || (error as Error).name === "RenderingCancelledException") return;
        setMessage(error instanceof Error ? error.message : "Could not render this page.");
        setStatus("error");
      }
    }

    void render();

    return () => {
      cancelled = true;
      renderRef.current?.cancel();
    };
  }, [status, pageNumber, zoom, containerWidth]);

  const goToPage = useCallback(
    (next: number) => {
      setPageNumber(Math.min(Math.max(next, 1), pageCount || 1));
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },
    [pageCount],
  );

  const changeZoom = useCallback((delta: number) => {
    setZoom((current) => Math.min(3, Math.max(0.5, Math.round((current + delta) * 100) / 100)));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (status !== "ready") return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        goToPage(pageNumber + 1);
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goToPage(pageNumber - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status, pageNumber, goToPage]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-panel px-2 py-1.5 sm:px-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(pageNumber - 1)}
            disabled={status !== "ready" || pageNumber <= 1}
            aria-label="Previous page"
            className={viewerButton}
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <span className="min-w-20 text-center font-mono text-[11px] text-ink-soft">
            {status === "ready" ? `${pageNumber} / ${pageCount}` : "-- / --"}
          </span>
          <button
            onClick={() => goToPage(pageNumber + 1)}
            disabled={status !== "ready" || pageNumber >= pageCount}
            aria-label="Next page"
            className={viewerButton}
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => changeZoom(-0.15)}
            disabled={status !== "ready" || zoom <= 0.5}
            aria-label="Zoom out"
            className={`${viewerButton} font-mono text-base`}
          >
            −
          </button>
          <span className="w-12 text-center font-mono text-[11px] text-ink-faint">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => changeZoom(0.15)}
            disabled={status !== "ready" || zoom >= 3}
            aria-label="Zoom in"
            className={`${viewerButton} font-mono text-base`}
          >
            +
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto bg-[#202329] p-4 sm:p-6">
        <canvas ref={canvasRef} aria-label={`${title} page ${pageNumber}`} className="mx-auto block shadow-xl" />

        {status === "loading" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/95">
            <span className="flex size-11 items-center justify-center rounded-md border border-primary/25 bg-primary-soft text-primary">
              <FileIcon className="size-5" />
            </span>
            <p className="font-mono text-[11px] text-ink-faint">Opening {title}...</p>
            <div className="h-1 w-32 overflow-hidden rounded-full bg-line">
              <div className="shimmer h-full w-full rounded-full" />
            </div>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/95 px-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-md border border-primary/30 bg-primary-soft text-primary">
              <FileIcon className="size-5" />
            </span>
            <p className="text-sm text-ink">This PDF could not be opened in the reader.</p>
            <p className="max-w-sm font-mono text-[10px] text-ink-faint">{message}</p>
            <button
              onClick={() => setAttempt((value) => value + 1)}
              className="sb-primary rounded-md px-3 py-2 font-mono text-[11px]"
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
