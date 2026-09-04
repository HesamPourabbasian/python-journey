"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

export interface LessonSummary {
  id: string;
  slug: string;
  title: string;
  order: number;
  readTime: number;
  isProject: boolean;
  topics: string[];
  levelSlug: string;
  levelTitle: string;
  levelRoman: string;
  moduleSlug: string;
  moduleTitle: string;
}

interface ReadingRoomProps {
  lessons: LessonSummary[];
}

export default function ReadingRoom({ lessons }: ReadingRoomProps) {
  const [query, setQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [limit, setLimit] = useState(15);

  const filtered = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesLevel =
        selectedLevel === "all" || lesson.levelSlug === selectedLevel;

      if (!matchesLevel) return false;

      if (!query.trim()) return true;

      const q = query.toLowerCase();
      return (
        lesson.title.toLowerCase().includes(q) ||
        lesson.moduleTitle.toLowerCase().includes(q) ||
        lesson.topics.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [lessons, selectedLevel, query]);

  const displayed = filtered.slice(0, limit);

  return (
    <section id="library" className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10">
      <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
        <div>
          <p className="eyebrow mb-5 text-brass">The reading room</p>
          <h2 className="serif text-5xl leading-none sm:text-6xl text-ink">
            Find your
            <br />
            <i className="text-forest">next lesson.</i>
          </h2>
          <p className="mt-6 text-sm leading-7 text-ink/65">
            Browse the complete index of 132 meticulously sequenced Python lessons
            and capstone projects across all three levels.
          </p>

          <div className="relative mt-8">
            <span className="absolute left-4 top-3.5 text-ink/35 text-base">⌕</span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(15);
              }}
              placeholder="Search by topic, keyword, or module..."
              className="w-full rounded-sm border border-line bg-transparent py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink/40 outline-none transition focus:border-brass focus:bg-white/40"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-3 text-xs text-ink/40 hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {[
              { slug: "all", label: "All Volumes" },
              { slug: "beginner", label: "Vol. I · Foundation" },
              { slug: "intermediate", label: "Vol. II · Craft" },
              { slug: "advanced", label: "Vol. III · Mastery" },
            ].map((tab) => {
              const isActive = selectedLevel === tab.slug;
              return (
                <button
                  key={tab.slug}
                  onClick={() => {
                    setSelectedLevel(tab.slug);
                    setLimit(15);
                  }}
                  className={`rounded-sm px-3 py-1.5 text-xs font-bold transition ${
                    isActive
                      ? "bg-forest text-cream shadow-sm"
                      : "bg-[#eee7d7] text-ink/70 hover:bg-[#e4dcce] hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-ink/45">
            Showing {filtered.length} of {lessons.length} total lessons
          </p>
        </div>

        <div className="divide-y divide-line border-y border-line">
          {displayed.length > 0 ? (
            displayed.map((lesson) => (
              <Link
                href={`/lessons/${lesson.slug}`}
                key={lesson.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-3 transition hover:bg-[#eee7d7]/30 px-2 rounded-sm"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <span className="serif text-xl text-brass min-w-[2.2rem]">
                    {String(lesson.order).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink group-hover:text-forest transition">
                        {lesson.title}
                      </span>
                      {lesson.isProject && (
                        <span className="rounded bg-brass/15 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-brass">
                          Project
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink/50 mt-0.5">
                      {lesson.levelRoman} · {lesson.moduleTitle} · {lesson.readTime} min read
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-forest opacity-0 group-hover:opacity-100 transition hidden sm:inline">
                    Read lesson
                  </span>
                  <span className="text-lg text-ink/30 transition group-hover:translate-x-1 group-hover:text-brass">
                    ↗
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-base serif text-ink/70">No lessons matched your search.</p>
              <p className="text-xs text-ink/40 mt-1">
                Try searching for general keywords like &ldquo;functions&rdquo;, &ldquo;database&rdquo;, or &ldquo;async&rdquo;.
              </p>
            </div>
          )}

          {filtered.length > displayed.length && (
            <div className="py-6 text-center">
              <button
                onClick={() => setLimit((prev) => prev + 25)}
                className="rounded-sm border border-line bg-transparent px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-forest transition hover:border-brass hover:bg-white/40"
              >
                Load {Math.min(25, filtered.length - displayed.length)} more lessons ({filtered.length - displayed.length} remaining)
              </button>
            </div>
          )}

          <div className="flex items-center justify-between py-5">
            <Link
              href="/curriculum"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-forest hover:text-ink transition"
            >
              <span>Explore Master Curriculum Syllabus</span>
              <span className="text-brass">→</span>
            </Link>
            <span className="text-xs text-ink/40">Powered by Prisma &amp; PostgreSQL</span>
          </div>
        </div>
      </div>
    </section>
  );
}
