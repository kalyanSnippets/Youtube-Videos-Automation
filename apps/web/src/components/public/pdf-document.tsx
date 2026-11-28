"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shows a PDF exactly as it looks, page by page, right on the page (phones included: iPhone Safari
 * can't show more than the first page of an embedded PDF). Each page is drawn with PDF.js and gets
 * an invisible text layer on top, so viewers can select and copy any part of it.
 */
export function PdfDocument({ url, onText }: { url: string; onText?: (text: string) => void }) {
  const holder = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [width, setWidth] = useState(0);

  // Redraw when the available width changes (rotate the phone, resize the window).
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0]!.contentRect.width);
      setWidth((prev) => (Math.abs(prev - w) > 24 ? w : prev));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!width) return;
    let cancelled = false;
    const el = holder.current!;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const data = await fetch(url).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.arrayBuffer();
        });
        const doc = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;
        el.replaceChildren();
        const texts: string[] = [];
        const ratio = Math.min(window.devicePixelRatio || 1, 3);
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: width / base.width });

          const sheet = document.createElement("div");
          sheet.className = "relative mx-auto mb-4 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5";
          sheet.style.width = `${Math.floor(viewport.width)}px`;
          sheet.style.height = `${Math.floor(viewport.height)}px`;
          sheet.style.setProperty("--scale-factor", String(viewport.scale));

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width * ratio);
          canvas.height = Math.floor(viewport.height * ratio);
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          canvas.setAttribute("aria-hidden", "true");
          sheet.appendChild(canvas);

          const textLayer = document.createElement("div");
          textLayer.className = "textLayer";
          sheet.appendChild(textLayer);
          el.appendChild(sheet);

          await page.render({
            canvasContext: canvas.getContext("2d")!,
            viewport,
            transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
          }).promise;
          const content = await page.getTextContent();
          await new pdfjs.TextLayer({ textContentSource: content, container: textLayer, viewport }).render();
          texts.push(
            content.items
              .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : "") : ""))
              .join("")
              .trim(),
          );
          if (n === 1) setStatus("ready");
        }
        onText?.(texts.join("\n\n"));
      } catch (error) {
        console.error("PDF failed to render", error);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, width, onText]);

  return (
    <div>
      {status === "loading" && <p className="py-10 text-center text-sm text-text-dim">Opening the document…</p>}
      {status === "error" && (
        <p className="py-10 text-center text-sm text-text-dim">
          This document couldn&apos;t be shown here. Use the Download button above to open it.
        </p>
      )}
      <div ref={holder} className="w-full" />
    </div>
  );
}
