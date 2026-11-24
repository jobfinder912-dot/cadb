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
    className: `glow-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium ${className}`,
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
    <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-[var(--accent-soft)]">
      <div className="motif-dots absolute inset-0 opacity-70" />
      <div className="absolute left-1/2 top-1/2 flex h-[78%] w-[64%] -translate-x-1/2 -translate-y-[46%] flex-col rounded-[8px] border border-black/5 bg-white p-[9%] shadow-[0_10px_24px_-10px_rgba(20,23,28,0.35)]">
        <div className="h-1.5 w-1/2 rounded-full" style={{ background: "var(--accent)" }} />
        <div className="mt-2.5 space-y-1.5">
          <div className="h-1 w-full rounded-full bg-[#e6e6e3]" />
          <div className="h-1 w-[92%] rounded-full bg-[#e6e6e3]" />
          <div className="h-1 w-[78%] rounded-full bg-[#e6e6e3]" />
        </div>
        <div className="mt-2.5 h-1 w-2/3 rounded-full" style={{ background: "var(--accent-line)" }} />
        <div className="mt-1.5 space-y-1.5">
          <div className="h-1 w-[88%] rounded-full bg-[#eeeeeb]" />
          <div className="h-1 w-[96%] rounded-full bg-[#eeeeeb]" />
          <div className="h-1 w-[70%] rounded-full bg-[#eeeeeb]" />
        </div>
      </div>
      <span className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/85 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[var(--accent)] backdrop-blur">
        {doc.month.split(" ")[0].toUpperCase()} &apos;26
      </span>
      <span className="absolute bottom-3 right-3 rounded-md bg-white/90 px-2 py-1 text-[10px] font-bold tracking-wider text-ink-soft shadow-sm">
        PDF
      </span>
    </div>
  );
}

function OpenButton({ onClick, label = "Read note" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="group/btn inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition-all duration-300 hover:border-ink hover:bg-ink hover:text-white"
    >
      {label}
      <ArrowUpRightIcon className="size-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
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
  if (view === "list") {
    return (
      <article
        className={`accent-${doc.accent} card-surface reveal group flex items-center gap-4 p-3 transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_18px_40px_-24px_rgba(20,23,28,0.35)]`}
        style={{ "--delay": `${(index % 8) * 45}ms` } as CSSProperties}
      >
        <button onClick={onOpen} aria-label={`Read ${doc.title}`} className="h-20 w-16 shrink-0 overflow-hidden rounded-xl">
          <MiniPdf doc={doc} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
            <span>{doc.month}</span>
            <span className="size-1 rounded-full bg-line-strong" />
            <span className="normal-case tracking-normal text-ink-faint">{doc.period}</span>
          </div>
          <h3 className="mt-1 truncate text-[15px] font-medium tracking-tight text-ink">{doc.title}</h3>
          <p className="mt-0.5 truncate text-xs text-ink-faint">{doc.fileName}</p>
        </div>
        <span className="hidden shrink-0 rounded-full bg-surface-soft px-3 py-1.5 text-xs text-ink-soft md:inline">
          {formatBytes(doc.size)}
        </span>
        <OpenButton onClick={onOpen} />
      </article>
    );
  }

  return (
    <article
      className={`accent-${doc.accent} card-surface reveal group flex flex-col p-3 transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-1.5 hover:border-line-strong hover:shadow-[0_24px_50px_-28px_rgba(20,23,28,0.4)]`}
      style={{ "--delay": `${(index % 8) * 45}ms` } as CSSProperties}
    >
      <button onClick={onOpen} aria-label={`Read ${doc.title}`} className="aspect-[5/4] w-full overflow-hidden rounded-[18px]">
        <MiniPdf doc={doc} />
      </button>
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-4">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--accent)" }}>
          <span>{doc.month}</span>
          <span className="size-1 rounded-full bg-line-strong" />
          <span className="font-normal normal-case tracking-normal text-ink-faint">{doc.period}</span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-[17px] font-medium leading-snug tracking-[-0.02em] text-ink">{doc.title}</h3>
        <p className="mt-1.5 line-clamp-1 text-[11px] text-ink-faint">{doc.fileName}</p>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
            <FileIcon className="size-3.5" />
            {formatBytes(doc.size)}
          </span>
          <OpenButton onClick={onOpen} label="Read" />
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

  const heroOne = documents[0] ?? EMPTY_DOC;
  const heroTwo = documents[2] ?? heroOne;
  const heroThree = documents[4] ?? heroOne;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
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
      <header className="sticky top-0 z-40 border-b border-line/80 bg-[rgba(251,251,250,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center gap-6 px-5 sm:px-8">
          <a href="#top" className="flex items-center gap-2.5" aria-label="Varta home">
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-slate-ink text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
              <SparkIcon className="size-[18px]" />
            </span>
            <span className="text-[19px] font-semibold tracking-[-0.04em] text-ink">
              varta<span className="text-indigo-accent">.</span>
            </span>
          </a>

          <nav className="ml-4 hidden items-center gap-7 text-sm text-ink-soft md:flex">
            <a href="#library" className="transition-colors hover:text-ink">Library</a>
            <a href="#months" className="transition-colors hover:text-ink">Months</a>
            <a href="#how" className="transition-colors hover:text-ink">How it works</a>
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <button
              onClick={() => searchRef.current?.focus()}
              className="hidden items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-xs text-ink-faint transition hover:border-line-strong hover:text-ink sm:flex"
            >
              <SearchIcon className="size-3.5" />
              Search notes
              <kbd className="rounded border border-line bg-surface-soft px-1.5 py-0.5 font-sans text-[10px]">/</kbd>
            </button>
            <GlowButton href="#library" className="bg-slate-ink text-white">
              Open library
              <ArrowRightIcon className="size-4" />
            </GlowButton>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        <section className="hero-mesh relative overflow-hidden border-b border-line">
          <div className="motif-dots pointer-events-none absolute inset-0 opacity-30" />
          <div className="breathe pointer-events-none absolute -left-40 top-10 size-[420px] rounded-full bg-indigo-200/25 blur-[110px]" />
          <div className="breathe pointer-events-none absolute -right-32 top-0 size-[380px] rounded-full bg-orange-200/25 blur-[110px]" />

          <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3.5 py-1.5 text-xs font-medium text-ink-soft shadow-sm backdrop-blur">
                <span className="breathe size-1.5 rounded-full bg-green" />
                {documents.length} curated notes · {months.length} months · 2026 edition
              </div>

              <h1 className="mt-7 max-w-[640px] font-display text-[44px] font-medium leading-[1.06] tracking-[-0.045em] text-ink sm:text-[62px] lg:text-[70px]">
                Every week in focus,
                <br />
                <em className="font-normal text-indigo-accent">nothing missed.</em>
              </h1>

              <p className="mt-6 max-w-[520px] text-[16px] leading-[1.7] text-ink-soft sm:text-[17px]">
                A quiet, considered home for your weekly current affairs PDFs. Find the right note, read it
                comfortably, and get back to what matters.
              </p>

              <form onSubmit={onSearchSubmit} className="mt-9 flex max-w-[560px] items-center gap-2 rounded-full border border-line bg-white p-2 pl-5 shadow-[0_18px_40px_-28px_rgba(20,23,28,0.45)] transition focus-within:border-indigo-300 focus-within:shadow-[0_20px_50px_-26px_rgba(79,70,229,0.4)]">
                <SearchIcon className="size-[18px] shrink-0 text-ink-faint" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search a week, topic or file name…"
                  aria-label="Search PDF notes"
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-faint"
                />
                <GlowButton type="submit" className="shrink-0 bg-slate-ink px-4 py-2.5 text-white sm:px-5">
                  <span className="hidden sm:inline">Find notes</span>
                  <ArrowRightIcon className="size-4" />
                </GlowButton>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                <span>Try:</span>
                {months.slice(-4).map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setMonth(item.key);
                      document.getElementById("library")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="rounded-full border border-line bg-white/70 px-3 py-1.5 transition hover:-translate-y-0.5 hover:border-ink hover:text-ink"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative hidden h-[430px] lg:block">
              <div className="float-a absolute left-[2%] top-[6%] w-[54%] rounded-[24px] border border-line bg-white p-3 shadow-[0_30px_60px_-32px_rgba(20,23,28,0.45)]">
                <div className="aspect-[5/4] overflow-hidden rounded-2xl">
                  <MiniPdf doc={heroOne} />
                </div>
                <div className="px-1 pb-1 pt-3">
                  <p className="text-[11px] text-indigo-accent">{heroOne.month}</p>
                  <p className="mt-1 truncate text-sm font-medium text-ink">{heroOne.title}</p>
                </div>
              </div>

              <div className="float-b absolute right-[0%] top-[22%] w-[52%] rounded-[24px] border border-line bg-white p-3 shadow-[0_30px_60px_-32px_rgba(20,23,28,0.45)]">
                <div className="aspect-[5/4] overflow-hidden rounded-2xl">
                  <MiniPdf doc={heroTwo} />
                </div>
                <div className="px-1 pb-1 pt-3">
                  <p className="text-[11px] text-orange-accent">{heroTwo.month}</p>
                  <p className="mt-1 truncate text-sm font-medium text-ink">{heroTwo.title}</p>
                </div>
              </div>

              <div className="float-c absolute bottom-[4%] left-[18%] w-[46%] rounded-[24px] border border-line bg-white p-3 shadow-[0_30px_60px_-32px_rgba(20,23,28,0.45)]">
                <div className="aspect-[5/4] overflow-hidden rounded-2xl">
                  <MiniPdf doc={heroThree} />
                </div>
                <div className="px-1 pb-1 pt-3">
                  <p className="text-[11px] text-[#db2777]">{heroThree.month}</p>
                  <p className="mt-1 truncate text-sm font-medium text-ink">{heroThree.title}</p>
                </div>
              </div>

              <div className="wiggle-hover absolute left-[45%] top-[2%] z-10 flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink shadow-lg">
                <SparkIcon className="size-4 text-indigo-accent" />
                Search · Read · Revise
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8">
          <Reveal className="card-surface grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
            {[
              { value: String(documents.length), label: "Weekly notes", icon: <FileIcon className="size-4" /> },
              { value: String(months.length), label: "Months covered", icon: <CalendarIcon className="size-4" /> },
              { value: "52", label: "Weeks a year", icon: <ClockIcon className="size-4" /> },
              { value: "01", label: "Place for it all", icon: <BookIcon className="size-4" /> },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 px-5 py-5 sm:px-7">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-ink-soft">
                  {stat.icon}
                </span>
                <div>
                  <p className="font-display text-2xl font-medium leading-none tracking-tight text-ink">{stat.value}</p>
                  <p className="mt-1.5 text-xs text-ink-faint">{stat.label}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </section>

        <div className="overflow-hidden border-y border-line bg-surface py-4">
          <div className="marquee-track flex w-max items-center gap-9 whitespace-nowrap px-4 text-sm font-medium text-ink-soft">
            {[...topics, ...topics].map((topic, index) => (
              <span key={`${topic}-${index}`} className="flex items-center gap-9">
                {topic}
                <span className="size-1.5 rotate-45 rounded-[2px] bg-indigo-accent/60" />
              </span>
            ))}
          </div>
        </div>

        <section id="library" className="mx-auto max-w-[1240px] scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
          <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-accent">01 / The archive</p>
              <h2 className="mt-3 font-display text-[36px] font-medium leading-[1.1] tracking-[-0.04em] text-ink sm:text-[46px]">
                Browse the archive
              </h2>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink-soft">
                Every weekly note, organised by month. Search by week, skim the cards, and open any PDF in a click.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-faint">
              <span className="font-medium text-ink">{visible.length}</span>
              <span>of {documents.length} notes shown</span>
            </div>
          </Reveal>

          <Reveal delay={80} id="months" className="mt-9 scroll-mt-24">
            <div className="card-surface flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                <button
                  onClick={() => setMonth("all")}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all duration-300 ${
                    month === "all" ? "bg-slate-ink text-white shadow-sm" : "bg-surface-soft text-ink-soft hover:bg-[#ececea] hover:text-ink"
                  }`}
                >
                  All notes <span className="ml-1 opacity-60">{documents.length}</span>
                </button>
                {months.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setMonth(item.key)}
                    className={`wiggle-hover shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all duration-300 ${
                      month === item.key
                        ? "bg-slate-ink text-white shadow-sm"
                        : "bg-surface-soft text-ink-soft hover:bg-[#ececea] hover:text-ink"
                    }`}
                  >
                    {item.name} <span className="ml-1 opacity-60">{item.count}</span>
                  </button>
                ))}
              </div>

              <div className="flex shrink-0 items-center gap-2 border-line lg:border-l lg:pl-3">
                <label className="relative flex items-center">
                  <span className="sr-only">Sort notes</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortMode)}
                    className="appearance-none rounded-full border border-line bg-surface py-2 pl-3.5 pr-8 text-xs font-medium text-ink outline-none transition hover:border-line-strong focus:border-indigo-300"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title">Title A–Z</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 text-[9px] text-ink-faint">▼</span>
                </label>
                <div className="flex items-center rounded-full border border-line bg-surface p-0.5">
                  <button
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                    className={`flex size-8 items-center justify-center rounded-full transition ${view === "grid" ? "bg-slate-ink text-white" : "text-ink-faint hover:text-ink"}`}
                  >
                    <GridIcon className="size-4" />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    aria-label="List view"
                    className={`flex size-8 items-center justify-center rounded-full transition ${view === "list" ? "bg-slate-ink text-white" : "text-ink-faint hover:text-ink"}`}
                  >
                    <ListIcon className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </Reveal>

          {recentDocs.length > 0 && !query && month === "all" && (
            <div className="mt-10">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium text-ink-faint">
                <ClockIcon className="size-4" />
                Recently opened
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {recentDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => openPdf(doc)}
                    className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left transition hover:-translate-y-0.5 hover:border-line-strong"
                  >
                    <span className={`accent-${doc.accent} flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]`}>
                      <FileIcon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{doc.title}</span>
                      <span className="block text-xs text-ink-faint">{doc.month}</span>
                    </span>
                    <ArrowRightIcon className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {visible.length > 0 ? (
            <div className={`mt-9 ${view === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-3"}`}>
              {visible.map((doc, index) => (
                <PdfCard key={doc.id} doc={doc} view={view} onOpen={() => openPdf(doc)} index={index} />
              ))}
            </div>
          ) : (
            <div className="card-surface mt-9 flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-soft text-ink-faint">
                <SearchIcon className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-medium tracking-tight text-ink">No notes found</h3>
              <p className="mt-2 max-w-sm text-sm text-ink-soft">
                Try a different week, month, or keyword. Your notes are all still here.
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setMonth("all");
                }}
                className="mt-5 rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium text-ink transition hover:border-ink"
              >
                Reset filters
              </button>
            </div>
          )}
        </section>

        <section id="how" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 lg:py-24">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-accent">02 / How it works</p>
              <h2 className="mt-3 font-display text-[36px] font-medium leading-[1.1] tracking-[-0.04em] text-ink sm:text-[46px]">
                Three small steps.
                <br />
                <em className="font-normal text-ink-soft">A whole lot less scrolling.</em>
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Find your week",
                  body: "Search by date, topic, or file name — or simply pick a month from the archive.",
                  icon: <SearchIcon className="size-5" />,
                  accent: "indigo",
                },
                {
                  number: "02",
                  title: "Read in one click",
                  body: "Every note opens right here, with browser tools for zoom, search, and print.",
                  icon: <BookIcon className="size-5" />,
                  accent: "orange",
                },
                {
                  number: "03",
                  title: "Keep it close",
                  body: "Download the PDF or open it in a new tab. Recently read notes stay a tap away.",
                  icon: <DownloadIcon className="size-5" />,
                  accent: "green",
                },
              ].map((step, index) => (
                <Reveal key={step.number} delay={index * 90}>
                  <div className={`accent-${step.accent} card-surface group h-full p-6 transition-transform duration-500 hover:-translate-y-1`}>
                    <div className="flex items-start justify-between">
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] transition-transform duration-500 group-hover:rotate-6">
                        {step.icon}
                      </span>
                      <span className="font-display text-2xl text-line-strong">{step.number}</span>
                    </div>
                    <h3 className="mt-7 text-lg font-medium tracking-tight text-ink">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8">
          <Reveal className="relative overflow-hidden rounded-[32px] bg-slate-ink px-7 py-14 text-white sm:px-14 sm:py-16">
            <div className="motif-dots pointer-events-none absolute inset-0 opacity-20" />
            <div className="breathe pointer-events-none absolute -right-16 -top-24 size-[360px] rounded-full bg-indigo-500/40 blur-[100px]" />
            <div className="breathe pointer-events-none absolute -bottom-28 left-1/3 size-[300px] rounded-full bg-orange-500/25 blur-[100px]" />
            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Made for the curious</p>
                <h2 className="mt-3 max-w-xl font-display text-[36px] font-medium leading-[1.1] tracking-[-0.04em] sm:text-[48px]">
                  Stay ready,
                  <br />
                  one week at a time.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
                  Your whole current affairs archive, quietly in one place. No noise, no clutter — just the notes you need.
                </p>
              </div>
              <GlowButton href="#library" className="shrink-0 bg-white text-slate-ink">
                Explore all {documents.length} notes
                <ArrowUpRightIcon className="size-4" />
              </GlowButton>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-4 px-5 py-8 text-xs text-ink-faint sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-slate-ink text-white">
              <SparkIcon className="size-3.5" />
            </span>
            <span className="font-medium text-ink">varta.</span>
            <span className="text-line-strong">/</span>
            <span>Weekly current affairs, beautifully organised.</span>
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
