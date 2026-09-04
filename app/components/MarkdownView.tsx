"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewProps {
  content: string;
}

function CodeBlock({
  inline,
  className,
  children,
  ...props
}: {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const codeString = String(children).replace(/\n$/, "");

  if (inline) {
    return (
      <code
        className="rounded bg-[#ebe4d4] px-1.5 py-0.5 text-[0.88em] font-mono text-forest font-semibold"
        {...props}
      >
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const language = match ? match[1] : "python";

  return (
    <div className="relative my-7 overflow-hidden rounded-sm border border-cream/20 bg-[#192e22] text-[#f5f1e7] shadow-lg">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#14261c] px-4 py-2 text-xs">
        <span className="eyebrow text-brass">{language}</span>
        <button
          onClick={handleCopy}
          className="rounded px-2.5 py-1 text-[0.7rem] font-bold tracking-wider text-cream/70 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? "COPIED ✓" : "COPY CODE"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 text-[0.92rem] leading-7 font-mono text-[#e5d9bb]">
        <code>{codeString}</code>
      </pre>
    </div>
  );
}

export default function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <div className="prose-atelier space-y-6 text-ink/80 leading-8">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="serif mt-12 mb-6 text-4xl sm:text-5xl font-semibold tracking-tight text-ink first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="serif mt-12 mb-5 text-3xl sm:text-4xl font-semibold tracking-tight text-ink border-b border-line pb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="serif mt-8 mb-4 text-2xl font-semibold text-forest">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="serif mt-6 mb-3 text-xl font-medium text-ink">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-base sm:text-[1.05rem] leading-8 text-ink/80 my-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-5 space-y-2.5 pl-6 list-disc marker:text-brass">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-5 space-y-2.5 pl-6 list-decimal marker:text-brass font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-base leading-7 text-ink/85">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-4 border-brass bg-[#eee7d7]/60 pl-5 py-3 italic text-ink/75 rounded-r">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-10 border-t border-line" />,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-forest underline decoration-brass/60 underline-offset-4 font-semibold hover:text-brass transition"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-8 overflow-x-auto border border-line rounded-sm bg-[#faf7ef]">
              <table className="w-full text-left text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-line bg-[#eee7d7] text-xs font-bold uppercase tracking-wider text-ink/70">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 font-semibold text-ink">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-line/60 px-4 py-3 text-ink/80">
              {children}
            </td>
          ),
          code: ({ node, inline, className, children, ...props }: any) => (
            <CodeBlock inline={inline} className={className} {...props}>
              {children}
            </CodeBlock>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
