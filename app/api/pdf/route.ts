import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { resolvePdfPath } from "@/lib/pdfs";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const filePath = resolvePdfPath(id);
  if (!filePath) return new Response("Not found", { status: 404 });

  let info;
  try {
    info = await stat(filePath);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const fileName = filePath.split(/[\\/]/).pop() ?? "document.pdf";
  const asAttachment = new URL(request.url).searchParams.get("download") === "1";
  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `${asAttachment ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    "Cache-Control": "public, max-age=3600",
    "Accept-Ranges": "bytes",
  });

  const range = request.headers.get("range");
  if (range) {
    const match = range.match(/bytes=(\d*)-(\d*)/);
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
      if (start > end || start >= info.size) {
        headers.set("Content-Range", `bytes */${info.size}`);
        return new Response(null, { status: 416, headers });
      }
      headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
      headers.set("Content-Length", String(end - start + 1));
      const stream = Readable.toWeb(
        createReadStream(filePath, { start, end }),
      ) as ReadableStream<Uint8Array>;
      return new Response(stream, { status: 206, headers });
    }
  }

  headers.set("Content-Length", String(info.size));
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>;
  return new Response(stream, { headers });
}
