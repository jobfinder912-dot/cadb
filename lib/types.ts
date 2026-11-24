export type AccentName = "indigo" | "orange" | "pink" | "green" | "yellow" | "violet";

export type PdfDocument = {
  id: string;
  title: string;
  fileName: string;
  month: string;
  monthKey: string;
  period: string;
  size: number;
  url: string;
  sortKey: number;
  accent: AccentName;
};

export type MonthGroup = {
  name: string;
  key: string;
  count: number;
};

export type ViewId = "overview" | "library" | "recent" | "guide";
export type SortMode = "newest" | "oldest" | "title";
export type LayoutMode = "table" | "grid";

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
