import Link from "next/link";
import { FileDown } from "lucide-react";

import { parseInline, type LegalBlock, type LegalDocument } from "@/lib/content/legal";

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, i) => {
        if (!("href" in part)) return <span key={i}>{part.text}</span>;
        const className = "text-primary hover:underline";
        if (part.href.startsWith("/")) {
          return (
            <Link key={i} href={part.href} className={className}>
              {part.text}
            </Link>
          );
        }
        const external = part.href.startsWith("http");
        return (
          <a
            key={i}
            href={part.href}
            className={className}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {part.text}
          </a>
        );
      })}
    </>
  );
}

/** A table on wider screens; stacked label/value cards on phones so no column is hidden. */
function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <>
      <ul className="space-y-3 sm:hidden">
        {rows.map((row) => (
          <li key={row[0]} className="border-border rounded-lg border p-3">
            <dl className="space-y-2">
              {row.map((cell, i) => (
                <div key={i}>
                  <dt className="text-foreground text-xs font-medium">{head[i]}</dt>
                  <dd>{cell}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <table className="hidden w-full text-left text-sm sm:table">
        <thead className="text-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="border-border border-b py-2 pr-4 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="align-top">
              {row.map((cell, i) => (
                <td key={i} className="border-border border-b py-2 pr-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "p") {
    return (
      <p>
        <Inline text={block.text} />
      </p>
    );
  }
  if (block.type === "list") {
    return (
      <ul className="list-disc space-y-1 pl-5">
        {block.items.map((item) => (
          <li key={item}>
            <Inline text={item} />
          </li>
        ))}
      </ul>
    );
  }
  return <Table head={block.head} rows={block.rows} />;
}

/** Renders a legal document from lib/content/legal.ts, with a link to its PDF version. */
export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  return (
    <div id={doc.anchor} className="mt-12 scroll-mt-24 first:mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-2xl font-semibold">{doc.title}</h2>
        <a
          href={`/legal/${doc.slug}.pdf`}
          target="_blank"
          rel="noopener"
          className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
        >
          <FileDown className="size-4" aria-hidden="true" /> Open as PDF
        </a>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">Last updated {doc.updated}</p>
      <p className="text-muted-foreground mt-6 text-sm leading-relaxed">
        <Inline text={doc.intro} />
      </p>
      {doc.sections.map((section) => (
        <section key={section.id} id={section.id} className="mt-10 scroll-mt-24">
          <h3 className="text-lg font-semibold">{section.title}</h3>
          <div className="text-muted-foreground mt-3 space-y-3 text-sm leading-relaxed">
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
