"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  useSyncExternalStore,
} from "react";

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookIcon,
  CalendarIcon,
  ClockIcon,
  DownloadIcon,
  FileIcon,
  GridIcon,
  ListIcon,
  SearchIcon,
  SparkIcon,
} from "@/components/icons";
import PdfReader from "@/components/pdf-reader";
import Reveal from "@/components/reveal";
import { formatBytes, type MonthGroup, type PdfDocument } from "@/lib/types";

type LibraryProps = {
  documents: PdfDocument[];
  months: MonthGroup[];
};

type SortMode = "newest" | "oldest" | "title";
type ViewMode = "grid" | "list";

const EMPTY_RECENT: string[] = [];
let recentCache: string[] = EMPTY_RECENT;
let recentRaw: string | null = null;

function readRecent(): string[] {
  if (typeof window === "undefined") return EMPTY_RECENT;
  const raw = window.localStorage.getItem("varta-recent");
  if (raw === recentRaw) return recentCache;
  recentRaw = raw;
  try {
    recentCache = raw ? (JSON.parse(raw) as string[]) : EMPTY_RECENT;
  } catch {
    recentCache = EMPTY_RECENT;
  }
  return recentCache;
}

function subscribeRecent(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const EMPTY_DOC: PdfDocument = {
  id: "empty",
  title: "Weekly current affairs",
  fileName: "weekly-notes.pdf",
  month: "January 2026",
  monthKey: "january",
  period: "This week",
  size: 0,
  url: "#",
  sortKey: 0,
  accent: "indigo",
};

function GlowButton({
  children,
  className = "",
  onClick,
  href,
  type = "button",
  title,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
  title?: string;
}) {
  const handleMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--gx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--gy", `${event.clientY - rect.top}px`);
  };

  const shared = {
    onMouseMove: handleMove,
    className: `glow-button inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium ${className}`,
    title,
  };

  if (href) {
    return (
      <a {...shared} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button {...shared} onClick={onClick} type={type}>
      {children}
    </button>
  );
}

function MiniPdf({ doc }: { doc: PdfDocument }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[10px] border border-white/5 bg-[var(--accent-soft)]">
      <div className="motif-dots absolute inset-0 opacity-50" />
      <div className="absolute left-1/2 top-1/2 flex h-[76%] w-[62%] -translate-x-1/2 -translate-y-[46%] flex-col rounded-md border border-white/10 bg-[#08111f] p-[9%] shadow-[0_16px_34px_-16px_rgba(0,0,0,0.9)]">
        <div className="h-1.5 w-1/2 rounded-full" style={{ background: "var(--accent)" }} />
        <div className="mt-2.5 space-y-1.5">
          <div className="h-1 w-full rounded-full bg-[#1b2a42]" />
          <div className="h-1 w-[92%] rounded-full bg-[#1b2a42]" />
          <div className="h-1 w-[78%] rounded-full bg-[#1b2a42]" />
        </div>
        <div className="mt-2.5 h-1 w-2/3 rounded-full" style={{ background: "var(--accent-line)" }} />
        <div className="mt-1.5 space-y-1.5">
          <div className="h-1 w-[88%] rounded-full bg-[#16243a]" />
          <div className="h-1 w-[96%] rounded-full bg-[#16243a]" />
          <div className="h-1 w-[70%] rounded-full bg-[#16243a]" />
        </div>
      </div>
      <span className="absolute left-2 top-2 rounded border border-primary/25 bg-[#08111f]/85 px-2 py-1 font-mono text-[9px] font-semibold tracking-wider text-primary">
        {doc.month.split(" ")[0].toUpperCase()} &apos;26
      </span>
      <span className="absolute bottom-2 right-2 rounded bg-primary px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-[#04130c]">
        PDF
      </span>
    </div>
  );
}

function DashboardPanel({ documents }: { documents: PdfDocument[] }) {
  const rows = [0, 1, 2, 3].map((index) => documents[index] ?? EMPTY_DOC);

  return (
    <div className="card-surface w-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-panel px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#f05b5b]" />
            <span className="size-2 rounded-full bg-[#e8b84b]" />
            <span className="size-2 rounded-full bg-primary" />
          </div>
          <span className="font-mono text-[11px] text-ink-faint">varta / workspace</span>
        </div>
        <span className="flex items-center gap-2 font-mono text-[10px] text-primary">
          <span className="breathe size-1.5 rounded-full bg-primary" />
          synced
        </span>
      </div>

      <div className="sm:grid sm:grid-cols-[128px_1fr]">
        <aside className="hidden border-r border-line bg-panel/40 p-3 sm:block">
          <p className="px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">Workspace</p>
          <div className="mt-3 space-y-1">
            {["Overview", "Archive", "Search", "Settings"].map((item, index) => (
              <div
                key={item}
                className={`flex items-center gap-2 rounded-md px-2 py-2 font-mono text-[11px] ${
                  index === 0 ? "bg-primary-soft text-primary" : "text-ink-faint"
                }`}
              >
                <span className={`size-1.5 rounded-sm ${index === 0 ? "bg-primary" : "bg-line-strong"}`} />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-md border border-line bg-surface p-2.5">
            <p className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">Storage</p>
            <p className="mt-2 font-mono text-xs text-ink">42.6 MB</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
              <div className="h-full w-2/3 rounded-full bg-primary" />
            </div>
          </div>
        </aside>

        <div className="min-w-0 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">Recent files</p>
              <h3 className="mt-1 text-base font-medium tracking-tight text-ink">This week&apos;s notes</h3>
            </div>
            <span className="rounded border border-primary/30 bg-primary-soft px-2 py-1 font-mono text-[10px] text-primary">
              2026
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {rows.map((doc, index) => (
              <div
                key={`${doc.id}-${index}`}
                className={`accent-${doc.accent} flex items-center gap-3 rounded-lg border border-line bg-panel/60 px-3 py-2.5`}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary-soft text-primary">
                  <FileIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-ink">{doc.title}</p>
                  <p className="truncate font-mono text-[10px] text-ink-faint">
                    {doc.month} · {formatBytes(doc.size)}
                  </p>
                </div>
                <span className="hidden font-mono text-[10px] text-primary sm:inline">READY</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 font-mono text-[10px] text-ink-faint">
            <span className="size-1.5 rounded-full bg-primary" />
            {documents.length} documents indexed · {monthsLabel(documents.length)}
          </div>
        </div>
      </div>
    </div>
  );
}

function monthsLabel(count: number) {
  return count > 0 ? "ready to read" : "awaiting upload";
}

function OpenButton({ onClick, label = "Read" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="group/btn inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 font-mono text-[11px] text-ink-soft transition-all duration-200 hover:border-primary/60 hover:bg-primary-soft hover:text-primary"
    >
      {label}
      <ArrowUpRightIcon className="size-3 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
    </button>
  );
}

function PdfCard({
  doc,
  view,
  onOpen,
  index,
}: {
  doc: PdfDocument;
  view: ViewMode;
  onOpen: () => void;
  index: number;
}) {
  const delay = { "--delay": `${(index % 8) * 40}ms` } as CSSProperties;

  if (view === "list") {
    return (
      <article
        className={`accent-${doc.accent} card-surface reveal group flex items-center gap-3 p-2.5 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_0_1px_rgba(62,207,142,0.12)] sm:gap-4 sm:p-3`}
        style={delay}
      >
        <button onClick={onOpen} aria-label={`Read ${doc.title}`} className="h-14 w-11 shrink-0 overflow-hidden rounded-md sm:h-16 sm:w-12">
          <MiniPdf doc={doc} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-primary">
            <span className="truncate">{doc.month}</span>
            <span className="size-1 shrink-0 rounded-full bg-line-strong" />
            <span className="hidden truncate normal-case tracking-normal text-ink-faint sm:inline">{doc.period}</span>
          </div>
          <h3 className="mt-1 truncate text-sm text-ink sm:text-[15px]">{doc.title}</h3>
          <p className="mt-0.5 hidden truncate font-mono text-[10px] text-ink-faint sm:block">{doc.fileName}</p>
        </div>
        <span className="hidden shrink-0 font-mono text-[10px] text-ink-faint lg:inline">{formatBytes(doc.size)}</span>
        <OpenButton onClick={onOpen} />
      </article>
    );
  }

  return (
    <article
      className={`accent-${doc.accent} card-surface reveal group flex flex-col p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_0_0_1px_rgba(62,207,142,0.12),0_18px_40px_-24px_rgba(0,0,0,0.9)]`}
      style={delay}
    >
      <button onClick={onOpen} aria-label={`Read ${doc.title}`} className="aspect-[5/4] w-full overflow-hidden rounded-lg">
        <MiniPdf doc={doc} />
      </button>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3.5">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-primary">
          <span className="truncate">{doc.month}</span>
          <span className="size-1 shrink-0 rounded-full bg-line-strong" />
          <span className="truncate font-normal normal-case tracking-normal text-ink-faint">{doc.period}</span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-[15px] leading-snug text-ink">{doc.title}</h3>
        <p className="mt-1.5 line-clamp-1 font-mono text-[10px] text-ink-faint">{doc.fileName}</p>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-faint">
            <FileIcon className="size-3.5" />
            {formatBytes(doc.size)}
          </span>
          <OpenButton onClick={onOpen} />
        </div>
      </div>
    </article>
  );
}

export default function Library({ documents, months }: LibraryProps) {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [view, setView] = useState<ViewMode>("grid");
  const [active, setActive] = useState<PdfDocument | null>(null);
  const [recentOverride, setRecentOverride] = useState<string[] | null>(null);
  const storedRecent = useSyncExternalStore(subscribeRecent, readRecent, () => EMPTY_RECENT);
  const recentIds = recentOverride ?? storedRecent;
  const searchRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = documents.filter((doc) => {
      const matchesMonth = month === "all" || doc.monthKey === month;
      const matchesQuery =
        !needle ||
        doc.title.toLowerCase().includes(needle) ||
        doc.fileName.toLowerCase().includes(needle) ||
        doc.period.toLowerCase().includes(needle) ||
        doc.month.toLowerCase().includes(needle);
      return matchesMonth && matchesQuery;
    });

    return filtered.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "oldest") return a.sortKey - b.sortKey;
      return b.sortKey - a.sortKey;
    });
  }, [documents, query, month, sort]);

  const recentDocs = useMemo(
    () =>
      recentIds
        .map((id) => documents.find((doc) => doc.id === id))
        .filter((doc): doc is PdfDocument => Boolean(doc))
        .slice(0, 3),
    [recentIds, documents],
  );

  const openPdf = useCallback((doc: PdfDocument) => {
    setActive(doc);
    const next = [doc.id, ...recentIds.filter((id) => id !== doc.id)].slice(0, 6);
    try {
      window.localStorage.setItem("varta-recent", JSON.stringify(next));
    } catch {
      /* ignore unavailable storage */
    }
    setRecentOverride(next);
  }, [recentIds]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT";
      if ((event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.03 },
    );
    const timer = window.setTimeout(() => {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach((element) => observer.observe(element));
    }, 60);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [query, month, sort, view]);

  const activeIndex = active ? visible.findIndex((doc) => doc.id === active.id) : -1;
  const navigate = (direction: -1 | 1) => {
    if (activeIndex < 0) return;
    const next = visible[activeIndex + direction];
    if (next) setActive(next);
  };

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    document.getElementById("library")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const topics = [
    "Politics",
    "Economy",
    "Science & Tech",
    "Governance",
    "Environment",
    "Banking",
    "International",
    "Sports",
    "Awards",
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-[#050c16]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 sm:h-[68px] sm:gap-6 sm:px-8">
          <a href="#top" className="flex shrink-0 items-center gap-2.5" aria-label="Varta home">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-[#04130c] shadow-[0_0_18px_-6px_rgba(62,207,142,0.8)]">
              <SparkIcon className="size-[18px]" />
            </span>
            <span className="text-[18px] font-semibold tracking-tight text-ink">
              varta<span className="text-primary">_</span>
            </span>
          </a>

          <nav className="ml-4 hidden items-center gap-7 text-[13px] text-ink-soft md:flex">
            <a href="#library" className="transition-colors hover:text-primary">Library</a>
            <a href="#months" className="transition-colors hover:text-primary">Months</a>
            <a href="#how" className="transition-colors hover:text-primary">How it works</a>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2.5">
            <button
              onClick={() => searchRef.current?.focus()}
              className="hidden items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 font-mono text-[11px] text-ink-faint transition hover:border-line-strong hover:text-ink lg:flex"
            >
              <SearchIcon className="size-3.5" />
              Search notes
              <kbd className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px]">/</kbd>
            </button>
            <GlowButton href="#library" className="px-3.5 py-2 text-[13px] sm:px-4">
              <span className="hidden sm:inline">Open library</span>
              <span className="sm:hidden">Library</span>
              <ArrowRightIcon className="size-4" />
            </GlowButton>
          </div>
        </div>
        <div className="scrollbar-none flex gap-5 overflow-x-auto border-t border-line px-4 py-2 font-mono text-[11px] text-ink-faint md:hidden">
          <a href="#library" className="shrink-0 hover:text-primary">Library</a>
          <a href="#months" className="shrink-0 hover:text-primary">Months</a>
          <a href="#how" className="shrink-0 hover:text-primary">How it works</a>
        </div>
      </header>

      <main id="top" className="flex-1">
        <section className="hero-glow relative overflow-hidden border-b border-line">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
          <div className="breathe pointer-events-none absolute -left-32 top-0 size-[360px] rounded-full bg-primary/10 blur-[100px]" />

          <div className="relative mx-auto grid max-w-[1280px] items-center gap-10 px-4 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pb-24 lg:pt-24">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary-soft px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                <span className="breathe size-1.5 rounded-full bg-primary" />
                Current affairs / 2026 edition
              </div>

              <h1 className="mt-7 max-w-[660px] text-[38px] font-semibold leading-[1.08] tracking-[-0.045em] text-ink sm:text-[56px] lg:text-[68px]">
                Your weekly notes,
                <br />
                <span className="text-primary">finally organized.</span>
              </h1>

              <p className="mt-6 max-w-[520px] text-[15px] leading-relaxed text-ink-soft sm:text-base">
                A focused workspace for every current affairs PDF. Search the archive, open a note instantly, and keep
                your revision moving.
              </p>

              <form onSubmit={onSearchSubmit} className="mt-8 flex max-w-[560px] items-center gap-2 rounded-md border border-line bg-surface p-1.5 pl-4 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)] transition focus-within:border-primary/60 sm:pl-5">
                <SearchIcon className="size-[18px] shrink-0 text-primary" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search a week, topic or file name…"
                  aria-label="Search PDF notes"
                  className="min-w-0 flex-1 bg-transparent py-2 text-[13px] text-ink outline-none placeholder:text-ink-faint sm:text-sm"
                />
                <GlowButton type="submit" className="shrink-0 px-3.5 py-2.5 sm:px-4">
                  <span className="hidden sm:inline">Search</span>
                  <ArrowRightIcon className="size-4" />
                </GlowButton>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink-faint">
                <span>Jump to:</span>
                {months.slice(-4).map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setMonth(item.key);
                      document.getElementById("library")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="rounded border border-line bg-surface px-2.5 py-1.5 text-ink-soft transition hover:border-primary/50 hover:text-primary"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="float-a min-w-0">
              <DashboardPanel documents={documents} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8 sm:py-10">
          <Reveal className="card-surface grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
            {[
              { value: String(documents.length), label: "Weekly notes", icon: <FileIcon className="size-4" /> },
              { value: String(months.length), label: "Months covered", icon: <CalendarIcon className="size-4" /> },
              { value: "52", label: "Weeks a year", icon: <ClockIcon className="size-4" /> },
              { value: "01", label: "Place for it all", icon: <BookIcon className="size-4" /> },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5 px-3 py-4 sm:gap-3 sm:px-6 sm:py-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary-soft text-primary sm:size-9">
                  {stat.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xl font-semibold leading-none text-ink sm:text-2xl">{stat.value}</p>
                  <p className="mt-1.5 font-mono text-[10px] text-ink-faint sm:text-[11px]">{stat.label}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </section>

        <div className="overflow-hidden border-y border-line bg-surface py-3">
          <div className="marquee-track flex w-max items-center gap-8 whitespace-nowrap px-4 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            {[...topics, ...topics].map((topic, index) => (
              <span key={`${topic}-${index}`} className="flex items-center gap-8">
                {topic}
                <span className="size-1 rotate-45 rounded-[1px] bg-primary" />
              </span>
            ))}
          </div>
        </div>

        <section id="library" className="mx-auto max-w-[1280px] scroll-mt-28 px-4 py-14 sm:scroll-mt-24 sm:px-8 sm:py-20 lg:py-24">
          <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">01 / Archive</p>
              <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-[44px]">
                Browse the archive
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
                Every weekly note in one place. Filter by month, switch views, and open any PDF without leaving the page.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 font-mono text-[11px] text-ink-faint">
              <span className="text-primary">{visible.length}</span>
              <span>/ {documents.length} notes shown</span>
            </div>
          </Reveal>

          <Reveal delay={60} id="months" className="mt-8 scroll-mt-28 sm:scroll-mt-24">
            <div className="card-surface flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                <button
                  onClick={() => setMonth("all")}
                  className={`shrink-0 rounded-md px-3.5 py-2 font-mono text-[11px] transition-all ${
                    month === "all" ? "bg-primary text-[#04130c]" : "bg-panel text-ink-soft hover:bg-panel-strong hover:text-ink"
                  }`}
                >
                  All notes <span className="ml-1 opacity-70">{documents.length}</span>
                </button>
                {months.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setMonth(item.key)}
                    className={`shrink-0 rounded-md px-3.5 py-2 font-mono text-[11px] transition-all ${
                      month === item.key ? "bg-primary text-[#04130c]" : "bg-panel text-ink-soft hover:bg-panel-strong hover:text-ink"
                    }`}
                  >
                    {item.name} <span className="ml-1 opacity-70">{item.count}</span>
                  </button>
                ))}
              </div>

              <div className="flex shrink-0 items-center justify-between gap-2 border-line lg:justify-start lg:border-l lg:pl-3">
                <label className="relative flex items-center">
                  <span className="sr-only">Sort notes</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortMode)}
                    className="appearance-none rounded-md border border-line bg-surface py-2 pl-3 pr-8 font-mono text-[11px] text-ink-soft outline-none transition hover:border-line-strong focus:border-primary/60"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title">Title A–Z</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 text-[9px] text-ink-faint">▼</span>
                </label>
                <div className="flex items-center rounded-md border border-line bg-surface p-0.5">
                  <button
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                    className={`flex size-8 items-center justify-center rounded transition ${
                      view === "grid" ? "bg-primary text-[#04130c]" : "text-ink-faint hover:text-ink"
                    }`}
                  >
                    <GridIcon className="size-4" />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    aria-label="List view"
                    className={`flex size-8 items-center justify-center rounded transition ${
                      view === "list" ? "bg-primary text-[#04130c]" : "text-ink-faint hover:text-ink"
                    }`}
                  >
                    <ListIcon className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </Reveal>

          {recentDocs.length > 0 && !query && month === "all" && (
            <div className="mt-10">
              <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                <ClockIcon className="size-4 text-primary" />
                Recently opened
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {recentDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => openPdf(doc)}
                    className="group flex items-center gap-3 rounded-lg border border-line bg-surface p-3 text-left transition hover:border-primary/50"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary-soft text-primary">
                      <FileIcon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-ink">{doc.title}</span>
                      <span className="block truncate font-mono text-[10px] text-ink-faint">{doc.month}</span>
                    </span>
                    <ArrowRightIcon className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {visible.length > 0 ? (
            <div className={`mt-8 ${view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-2.5"}`}>
              {visible.map((doc, index) => (
                <PdfCard key={doc.id} doc={doc} view={view} onOpen={() => openPdf(doc)} index={index} />
              ))}
            </div>
          ) : (
            <div className="card-surface mt-8 flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-lg border border-primary/20 bg-primary-soft text-primary">
                <SearchIcon className="size-6" />
              </div>
              <h3 className="mt-5 text-xl font-medium tracking-tight text-ink">No notes found</h3>
              <p className="mt-2 max-w-sm text-sm text-ink-soft">
                Try a different week, month, or keyword. Your archive is still here.
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setMonth("all");
                }}
                className="mt-5 rounded-md border border-line bg-surface px-4 py-2 font-mono text-[11px] text-ink-soft transition hover:border-primary/60 hover:text-primary"
              >
                Reset filters
              </button>
            </div>
          )}
        </section>

        <section id="how" className="border-y border-line bg-surface/60">
          <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-8 sm:py-20">
            <Reveal>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">02 / Workflow</p>
              <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-[44px]">
                Three steps. Zero friction.
              </h2>
            </Reveal>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Find your week",
                  body: "Search by date, topic, or file name — or narrow the archive by month.",
                  icon: <SearchIcon className="size-5" />,
                },
                {
                  number: "02",
                  title: "Read in place",
                  body: "Every PDF opens right here with zoom, search, and print from your browser.",
                  icon: <BookIcon className="size-5" />,
                },
                {
                  number: "03",
                  title: "Keep it close",
                  body: "Download the file or open it in a new tab. Recent reads stay one tap away.",
                  icon: <DownloadIcon className="size-5" />,
                },
              ].map((step, index) => (
                <Reveal key={step.number} delay={index * 70}>
                  <div className="card-surface group h-full p-5 transition-all duration-300 hover:border-primary/50 sm:p-6">
                    <div className="flex items-start justify-between">
                      <span className="flex size-11 items-center justify-center rounded-lg border border-primary/20 bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-105">
                        {step.icon}
                      </span>
                      <span className="font-mono text-xl text-line-strong">{step.number}</span>
                    </div>
                    <h3 className="mt-7 text-lg text-ink">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-4 py-14 sm:px-8 sm:py-20">
          <Reveal className="relative overflow-hidden rounded-xl border border-primary/20 bg-navy px-6 py-12 sm:px-12 sm:py-14">
            <div className="motif-dots pointer-events-none absolute inset-0 opacity-30" />
            <div className="breathe pointer-events-none absolute -right-20 -top-24 size-[320px] rounded-full bg-primary/20 blur-[100px]" />
            <div className="relative flex flex-col items-start justify-between gap-7 md:flex-row md:items-center">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Built for revision</p>
                <h2 className="mt-3 max-w-xl text-[30px] font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">
                  Stay ready, one week at a time.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
                  Your whole current affairs archive in a single, quiet workspace. No noise, no clutter.
                </p>
              </div>
              <GlowButton href="#library" className="w-full shrink-0 sm:w-auto">
                Explore all {documents.length} notes
                <ArrowUpRightIcon className="size-4" />
              </GlowButton>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 px-4 py-8 font-mono text-[11px] text-ink-faint sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded bg-primary text-[#04130c]">
              <SparkIcon className="size-3.5" />
            </span>
            <span className="text-ink">varta_</span>
            <span className="text-line-strong">/</span>
            <span>Current affairs, beautifully organized.</span>
          </div>
          <span>{documents.length} notes · 2026 edition</span>
        </div>
      </footer>

      {active && (
        <PdfReader
          key={active.id}
          pdf={active}
          onClose={() => setActive(null)}
          onPrevious={() => navigate(-1)}
          onNext={() => navigate(1)}
          hasPrevious={activeIndex > 0}
          hasNext={activeIndex >= 0 && activeIndex < visible.length - 1}
        />
      )}
    </>
  );
}
