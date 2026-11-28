"use client";

import { useCallback, useRef, useState } from "react";
import { Check, Copy, Download, FileText } from "lucide-react";
import { PdfDocument } from "./pdf-document";
import { HtmlDocument } from "./html-document";

type Body =
  | { type: "pdf"; url: string }
  | { type: "html"; html: string }
  /** A prompt: shown as-is in a copy box. */
  | { type: "prompt"; text: string };

/**
 * The resource or prompt from a video, shown in full on its page: a bar on top with the name,
 * Download (for uploaded files) and Copy, then the document itself.
 */
export function ResourceViewer({
  title,
  kind,
  body,
  download,
}: {
  title: string;
  kind: "prompt" | "resource";
  body: Body;
  download?: { url: string; name: string; size: string | null };
}) {
  const docRef = useRef<HTMLDivElement>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const onText = useCallback((t: string) => setPdfText(t), []);

  async function copyAll() {
    const text = body.type === "prompt" ? body.text : body.type === "pdf" ? pdfText ?? "" : docRef.current?.innerText.replace(/\n?Copy\n/g, "\n") ?? "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const copyLabel = kind === "prompt" ? "Copy prompt" : "Copy all text";
  const isPdf = download?.name.toLowerCase().endsWith(".pdf");

  return (
    <section className="space-y-3">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-b border-border-subtle bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-4">
        <FileText size={22} className="shrink-0 text-accent-cyan" />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-text-faint">{kind === "prompt" ? "Prompt" : "Resource"}</p>
          <p className="truncate font-medium">{title}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          {download && (
            <a
              href={download.url}
              className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-accent-cyan px-4 py-2.5 text-sm font-medium text-bg hover:brightness-110 sm:flex-none"
            >
              <Download size={15} /> {isPdf ? "Download PDF" : "Download"}
              {download.size && <span className="hidden text-xs font-normal opacity-70 sm:inline">{download.size}</span>}
            </a>
          )}
          <button
            type="button"
            onClick={copyAll}
            disabled={body.type === "pdf" && !pdfText}
            className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium sm:flex-none disabled:opacity-50 ${
              download ? "border border-border hover:border-accent-cyan/40" : "bg-accent-cyan text-bg hover:brightness-110"
            }`}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : copyLabel}
          </button>
        </div>
      </div>

      <div ref={docRef}>
        {body.type === "pdf" && <PdfDocument url={body.url} onText={onText} />}
        {body.type === "html" && <HtmlDocument html={body.html} />}
        {body.type === "prompt" && (
          <pre className="panel whitespace-pre-wrap break-words p-4 sm:p-5 font-mono text-[13px] leading-relaxed text-text">{body.text}</pre>
        )}
      </div>
    </section>
  );
}
