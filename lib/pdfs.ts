import "server-only";

import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import type { AccentName, MonthGroup, PdfDocument } from "@/lib/types";

const ROOT = path.join(process.cwd(), "current_affairs");

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const ACCENTS: AccentName[] = ["indigo", "orange", "pink", "green", "yellow", "violet"];

function parseFolder(folder: string) {
  const match = folder.match(/(\d{1,2})[_\s-]*([A-Za-z]+)/);
  if (!match) return { month: folder, monthKey: folder.toLowerCase(), monthNumber: 0 };
  const month = MONTH_NAMES[Number(match[2].slice(0, 2).padStart(2, "0")) - 1] ?? match[2];
  const monthNumber = Number(match[1]);
  return {
    month: MONTH_NAMES[monthNumber - 1] ?? month,
    monthKey: (MONTH_NAMES[monthNumber - 1] ?? month).toLowerCase(),
    monthNumber,
  };
}

function parseMonth(source: string) {
  const folder = parseFolder(source.split("/")[0] ?? "");
  if (folder.monthNumber) return folder;

  const fileName = (source.split("/").pop() ?? "").replace(/[_-]+/g, " ");
  const monthName = MONTH_NAMES.find((name) => new RegExp(`\\b${name}\\b`, "i").test(fileName));
  if (!monthName) return folder;

  const monthNumber = MONTH_NAMES.indexOf(monthName) + 1;
  return { month: monthName, monthKey: monthName.toLowerCase(), monthNumber };
}

function extractPeriod(name: string) {
  const pattern =
    /\d{1,2}(?:st|nd|rd|th)?(?:\s+[A-Za-z]+)?\s*(?:to|[-–—])\s*\d{1,2}(?:st|nd|rd|th)?(?:\s*(?:to|[-–—])\s*\d{1,2}(?:st|nd|rd|th)?)?(?:\s+[A-Za-z]+)?/i;
  const match = name.match(pattern);
  return match ? match[0].replace(/\s+/g, " ").trim() : "";
}

function describe(name: string) {
  if (/revision/i.test(name)) return "Revision notes";
  if (/compiled/i.test(name)) return "Compiled notes";
  if (/short/i.test(name)) return "Weekly short notes";
  return "Current affairs notes";
}

function makeTitle(name: string, dateRange: string, month: string) {
  if (/consolidated/i.test(name)) {
    return dateRange ? `Consolidated notes · ${dateRange}` : "Consolidated revision notes";
  }
  if (dateRange) return `Week of ${dateRange}`;
  const cleaned = name
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b20\d{2}\b/g, " ")
    .replace(/\b(weekly|weekkly|short|notes?|ca|current affairs|in english|english|the|for)\b/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—.,]+|[\s\-–—.,]+$/g, "")
    .trim();
  return cleaned ? cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase()) : `Notes · ${month}`;
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      return entry.name.toLowerCase().endsWith(".pdf") ? [fullPath] : [];
    }),
  );
  return files.flat();
}

export async function getPdfs(): Promise<{ documents: PdfDocument[]; months: MonthGroup[] }> {
  "use cache";
  const paths = await walk(ROOT);
  const documents = await Promise.all(
    paths.map(async (fullPath) => {
      const name = path.basename(fullPath);
      const relative = path.relative(ROOT, fullPath).split(path.sep).join("/");
      const info = parseMonth(relative);
      const dateRange = extractPeriod(name);
      const firstDay = /consolidated/i.test(name) ? 99 : Number(dateRange.match(/\d{1,2}/)?.[0] ?? 0);
      const accentIndex =
        (info.monthNumber * 3 + firstDay) % ACCENTS.length;

      return {
        id: Buffer.from(relative, "utf8").toString("base64url"),
        title: makeTitle(name, dateRange, info.month),
        fileName: name,
        month: `${info.month} 2026`,
        monthKey: info.monthKey,
        period: describe(name),
        size: (await stat(fullPath)).size,
        url: `/api/pdf?id=${encodeURIComponent(Buffer.from(relative, "utf8").toString("base64url"))}`,
        sortKey: info.monthNumber * 100 + firstDay,
        accent: ACCENTS[accentIndex],
      } satisfies PdfDocument;
    }),
  );

  documents.sort((a, b) => b.sortKey - a.sortKey || a.title.localeCompare(b.title));

  const monthMap = new Map<string, MonthGroup>();
  for (const document of documents) {
    const existing = monthMap.get(document.monthKey);
    if (existing) existing.count += 1;
    else monthMap.set(document.monthKey, { name: document.month.split(" ")[0], key: document.monthKey, count: 1 });
  }

  return { documents, months: [...monthMap.values()] };
}

export function resolvePdfPath(id: string) {
  let relative: string;
  try {
    relative = Buffer.from(id, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!relative || path.isAbsolute(relative)) return null;
  const resolved = path.resolve(ROOT, relative);
  if (!resolved.startsWith(ROOT + path.sep) || !resolved.toLowerCase().endsWith(".pdf")) return null;
  return resolved;
}
