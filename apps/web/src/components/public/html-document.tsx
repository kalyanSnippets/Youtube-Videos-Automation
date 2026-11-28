"use client";

import { useEffect, useRef } from "react";

/**
 * A Word / Markdown / text resource shown as a formatted document page. The HTML is sanitized on
 * the server (lib/document-html.ts). Every code or command block gets its own Copy button.
 */
export function HtmlDocument({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    for (const pre of Array.from(root.querySelectorAll("pre"))) {
      if (pre.querySelector("button[data-copy]")) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.copy = "";
      button.textContent = "Copy";
      button.className = "absolute right-2 top-2 rounded-md bg-white/90 border border-black/10 px-2 py-0.5 text-xs font-medium text-[#1f2430] hover:bg-white";
      button.addEventListener("click", async () => {
        const copy = pre.cloneNode(true) as HTMLElement;
        copy.querySelector("button[data-copy]")?.remove();
        const text = copy.textContent?.trim() ?? "";
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
        button.textContent = "Copied ✓";
        window.setTimeout(() => (button.textContent = "Copy"), 1500);
      });
      pre.style.paddingTop = "2.2em";
      pre.appendChild(button);
    }
  }, [html]);

  return (
    <div className="rounded-lg bg-white px-5 py-6 sm:px-10 sm:py-10 shadow-lg ring-1 ring-black/5">
      <div ref={ref} className="doc-page" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
