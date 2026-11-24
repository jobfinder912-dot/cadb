"use client";

import { ArrowRightIcon, BookIcon, DownloadIcon, FileIcon, SearchIcon } from "@/components/icons";
import { Button, Label, Panel, SectionHeading } from "@/components/ui";
import type { ViewId } from "@/lib/types";

export default function GuideView({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const steps = [
    {
      icon: SearchIcon,
      title: "Find your week",
      body: "Use the search bar or library filters to narrow notes by month, week, or file name.",
    },
    {
      icon: BookIcon,
      title: "Read in place",
      body: "Open a note in the built-in reader. Browser PDF tools let you search, zoom, and print.",
    },
    {
      icon: DownloadIcon,
      title: "Keep it close",
      body: "Download a PDF or open it in a new tab. Recently opened notes stay one click away.",
    },
  ];

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Workspace / Guide"
        title="How the workspace works"
        description="A quick tour of the tools available in Varta."
        action={
          <Button variant="primary" onClick={() => onNavigate("library")}>
            Open library
            <ArrowRightIcon className="size-4" />
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Panel key={step.title} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-9 items-center justify-center rounded-md border border-primary/25 bg-primary-soft text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="font-mono text-[18px] text-line-strong">0{index + 1}</span>
              </div>
              <h2 className="mt-6 text-[15px] font-medium text-ink">{step.title}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{step.body}</p>
            </Panel>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <Label>Keyboard shortcuts</Label>
            <h2 className="mt-1 text-[14px] font-medium text-ink">Move faster</h2>
          </div>
          <div className="divide-y divide-line">
            {[
              { keys: ["/"], label: "Focus search" },
              { keys: ["Esc"], label: "Close reader or search" },
              { keys: ["←", "→"], label: "Previous or next note" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-[13px] text-ink-soft">{row.label}</span>
                <span className="flex items-center gap-1">
                  {row.keys.map((key) => (
                    <kbd key={key} className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[10px] text-ink">
                      {key}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <Label>About this workspace</Label>
            <h2 className="mt-1 text-[14px] font-medium text-ink">Built for weekly revision</h2>
          </div>
          <div className="space-y-3 p-4 text-[13px] leading-relaxed text-ink-soft">
            <p>
              Varta keeps every current affairs PDF in one searchable place. Files are read directly from the local
              archive, so nothing needs to be uploaded.
            </p>
            <p>
              Use <span className="font-medium text-ink">Collections</span> in the sidebar to jump to a month, or open
              the <span className="font-medium text-ink">Library</span> to sort and switch layouts.
            </p>
          </div>
          <div className="flex items-center gap-2 border-t border-line px-4 py-3 font-mono text-[10px] text-ink-faint">
            <FileIcon className="size-3.5 text-primary" />
            PDF reader · Local files · Offline-friendly
          </div>
        </Panel>
      </div>
    </div>
  );
}
