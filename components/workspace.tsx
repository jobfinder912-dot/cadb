"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import DocumentList from "@/components/document-list";
import GuideView from "@/components/guide-view";
import {
  FileIcon,
  HistoryIcon,
  HomeIcon,
  LayersIcon,
  HelpIcon,
} from "@/components/icons";
import LibraryView from "@/components/library-view";
import Overview from "@/components/overview";
import PdfReader from "@/components/pdf-reader";
import SearchDialog from "@/components/search-dialog";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { Button, EmptyState, SectionHeading } from "@/components/ui";
import {
  formatBytes,
  type LayoutMode,
  type MonthGroup,
  type PdfDocument,
  type SortMode,
  type ViewId,
} from "@/lib/types";

type WorkspaceProps = {
  documents: PdfDocument[];
  months: MonthGroup[];
};

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

const navItems = [
  { id: "overview" as const, label: "Overview", icon: HomeIcon },
  { id: "library" as const, label: "Library", icon: LayersIcon },
  { id: "recent" as const, label: "Recent", icon: HistoryIcon },
  { id: "guide" as const, label: "Guide", icon: HelpIcon },
];

export default function Workspace({ documents, months }: WorkspaceProps) {
  const [view, setView] = useState<ViewId>("overview");
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [layout, setLayout] = useState<LayoutMode>("table");
  const [active, setActive] = useState<PdfDocument | null>(null);
  const [recentOverride, setRecentOverride] = useState<string[] | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const storedRecent = useSyncExternalStore(subscribeRecent, readRecent, () => EMPTY_RECENT);
  const recentIds = recentOverride ?? storedRecent;

  const navigate = useCallback((next: ViewId) => {
    setView(next);
    if (typeof window !== "undefined" && window.location.hash !== `#${next}`) {
      window.location.hash = next;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "overview" || hash === "library" || hash === "recent" || hash === "guide") {
        setView(hash);
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    if (searchOpen || active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT";
      if (
        (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) &&
        !isTyping
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen, active]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = documents.filter((doc) => {
      const matchesMonth = month === "all" || doc.monthKey === month;
      const matchesQuery =
        !needle ||
        [doc.title, doc.fileName, doc.period, doc.month].some((value) =>
          value.toLowerCase().includes(needle),
        );
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
        .slice(0, 6),
    [recentIds, documents],
  );

  const readerDocuments = useMemo(() => {
    if (!active) return documents;
    return visible.some((doc) => doc.id === active.id) ? visible : documents;
  }, [active, documents, visible]);

  const activeIndex = active ? readerDocuments.findIndex((doc) => doc.id === active.id) : -1;

  const openPdf = useCallback(
    (doc: PdfDocument) => {
      setActive(doc);
      const next = [doc.id, ...recentIds.filter((id) => id !== doc.id)].slice(0, 6);
      try {
        window.localStorage.setItem("varta-recent", JSON.stringify(next));
      } catch {
        return;
      }
      setRecentOverride(next);
    },
    [recentIds],
  );

  const handleTopbarQuery = (value: string) => {
    setQuery(value);
    if (value && view !== "library") navigate("library");
  };

  const resetFilters = () => {
    setQuery("");
    setMonth("all");
  };

  const storageLabel = `${documents.length} files · ${months.length} months`;

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-on-primary"
      >
        Skip to content
      </a>

      <Sidebar
        view={view}
        onNavigate={navigate}
        onSelectMonth={setMonth}
        months={months}
        activeMonth={month}
        documentsCount={documents.length}
        recentCount={recentIds.length}
        storageLabel={storageLabel}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="min-h-screen lg:pl-[248px]">
        <Topbar
          view={view}
          query={query}
          onQueryChange={handleTopbarQuery}
          onOpenMenu={() => setMobileNavOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenLibrary={() => navigate("library")}
          searchRef={searchRef}
        />

        <main id="main-content" className="mx-auto w-full max-w-[1280px] px-4 pb-24 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:pb-12">
          {view === "overview" ? (
            <Overview
              documents={documents}
              months={months}
              recentDocs={recentDocs}
              storageLabel={storageLabel}
              onOpen={openPdf}
              onNavigate={navigate}
              onSelectMonth={setMonth}
            />
          ) : null}

          {view === "library" ? (
            <LibraryView
              documents={documents}
              visible={visible}
              months={months}
              query={query}
              onQueryChange={setQuery}
              month={month}
              onMonthChange={setMonth}
              sort={sort}
              onSortChange={setSort}
              layout={layout}
              onLayoutChange={setLayout}
              onOpen={openPdf}
              onReset={resetFilters}
            />
          ) : null}

          {view === "recent" ? (
            <div className="space-y-5">
              <SectionHeading
                eyebrow="Workspace / Recent"
                title="Recent notes"
                description="The PDFs you opened most recently, ready to pick up again."
                action={
                  <Button variant="secondary" onClick={() => navigate("library")}>
                    Browse library
                  </Button>
                }
              />
              {recentDocs.length > 0 ? (
                <DocumentList documents={recentDocs} layout={layout} onOpen={openPdf} />
              ) : (
                <EmptyState
                  icon={<FileIcon className="size-5" />}
                  title="Nothing opened yet"
                  description="Open a note from the library and it will appear here for quick access."
                  action={
                    <Button variant="primary" size="sm" onClick={() => navigate("library")}>
                      Open library
                    </Button>
                  }
                />
              )}
            </div>
          ) : null}

          {view === "guide" ? <GuideView onNavigate={navigate} /> : null}
        </main>

        <footer className="hidden border-t border-line px-6 py-4 font-mono text-[10px] text-ink-faint lg:flex lg:items-center lg:justify-between">
          <span>varta_ / Current affairs workspace</span>
          <span>{formatBytes(documents.reduce((total, doc) => total + doc.size, 0))} indexed locally</span>
        </footer>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-background/95 backdrop-blur-md lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const activeItem = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex flex-col items-center gap-1 py-2.5 font-mono text-[10px] transition-colors ${
                activeItem ? "text-primary" : "text-ink-faint"
              }`}
            >
              <Icon className="size-[18px]" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        query={query}
        onQueryChange={setQuery}
        documents={documents}
        onOpen={openPdf}
      />

      {active ? (
        <PdfReader
          key={active.id}
          pdf={active}
          onClose={() => setActive(null)}
          onPrevious={() => setActive(readerDocuments[activeIndex - 1] ?? active)}
          onNext={() => setActive(readerDocuments[activeIndex + 1] ?? active)}
          hasPrevious={activeIndex > 0}
          hasNext={activeIndex >= 0 && activeIndex < readerDocuments.length - 1}
        />
      ) : null}
    </div>
  );
}
