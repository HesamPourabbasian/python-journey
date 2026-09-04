import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonBySlug } from "../../../lib/data";
import MarkdownView from "../../components/MarkdownView";

export const dynamic = "force-dynamic";

const ALIASES: Record<string, string> = {
  "python-fundamentals": "what-is-python",
  "data-structures": "lists",
  "functions-and-scope": "defining-functions",
  "object-oriented-python": "classes-and-objects",
  "testing-and-quality": "unittest-fundamentals",
  "async-concurrency": "asyncio-event-loop-coroutines",
};

export default async function LessonPage({
  params,
}: {
  params: { slug: string };
}) {
  const targetSlug = ALIASES[params.slug] || params.slug;

  const data = await getLessonBySlug(targetSlug);

  if (!data) {
    // Fallback to first lesson
    const fallback = await getLessonBySlug("what-is-python");
    if (!fallback) notFound();
    return renderLesson(fallback);
  }

  return renderLesson(data);
}

function renderLesson({
  lesson,
  prevLesson,
  nextLesson,
  moduleLessons,
}: {
  lesson: any;
  prevLesson: any;
  nextLesson: any;
  moduleLessons: any[];
}) {
  return (
    <main className="min-h-screen paper-grain">
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6 lg:px-10 border-b border-line">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brass text-sm font-bold text-brass">
            Py
          </span>
          <span className="serif text-xl font-semibold text-ink">
            The Python Atelier
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/curriculum"
            className="text-xs font-bold uppercase tracking-[.14em] text-ink/65 hover:text-brass transition"
          >
            Curriculum
          </Link>
          <Link
            href="/#library"
            className="text-xs font-bold uppercase tracking-[.14em] text-forest hover:text-ink transition"
          >
            ← Reading room
          </Link>
        </div>
      </nav>

      <article className="mx-auto max-w-[1200px] px-6 pb-24 pt-12 lg:px-10">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink/50 mb-6">
          <Link href="/" className="hover:text-brass transition">
            Home
          </Link>
          <span>/</span>
          <Link
            href={`/curriculum#${lesson.levelSlug}`}
            className="hover:text-brass transition text-forest font-bold"
          >
            {lesson.level.title}
          </Link>
          <span>/</span>
          <span className="text-ink/80">{lesson.module.title}</span>
        </div>

        {/* Hero Section */}
        <div className="border-b border-line pb-12">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow text-brass">
              {lesson.level.roman} · Lesson {String(lesson.order).padStart(2, "0")}
            </span>
            {lesson.isProject && (
              <span className="rounded bg-brass/20 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-brass">
                Capstone Project
              </span>
            )}
            <span className="text-xs text-ink/40">·</span>
            <span className="text-xs text-ink/50 font-medium">
              {lesson.readTime} min read
            </span>
          </div>

          <h1 className="serif mt-5 max-w-4xl text-5xl leading-[1.02] tracking-tight sm:text-7xl font-semibold text-ink">
            {lesson.title}
          </h1>

          <p className="mt-7 max-w-3xl text-lg sm:text-xl leading-8 text-ink/70">
            {lesson.intro}
          </p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_.9fr] items-start">
            {/* Topics Overview */}
            {lesson.topics && lesson.topics.length > 0 && (
              <div className="rounded-sm border border-line bg-[#f7f3e8] p-6">
                <p className="eyebrow mb-4 text-brass">In this lesson</p>
                <ul className="space-y-3">
                  {lesson.topics.map((topic: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm leading-6 text-ink/80">
                      <span className="text-brass font-bold">✦</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Featured Code Snippet */}
            {lesson.code && (
              <div className="rounded-sm bg-forest p-6 text-cream shadow-xl">
                <div className="mb-4 flex items-center justify-between border-b border-cream/15 pb-3">
                  <span className="eyebrow text-brass">A first taste</span>
                  <span className="text-xs text-cream/40 font-mono">python</span>
                </div>
                <pre className="overflow-x-auto text-sm leading-6 text-[#e5d9bb] font-mono max-h-48">
                  <code>{lesson.code}</code>
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Content Layout with Sidebar */}
        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_280px]">
          {/* Main Markdown Article */}
          <div className="min-w-0">
            <MarkdownView content={lesson.content} />

            {/* Next / Previous Lesson Navigation */}
            <div className="mt-16 pt-10 border-t border-line grid gap-6 sm:grid-cols-2">
              {prevLesson ? (
                <Link
                  href={`/lessons/${prevLesson.slug}`}
                  className="group rounded-sm border border-line p-5 transition hover:border-brass hover:bg-white/40"
                >
                  <span className="eyebrow text-ink/40 text-[0.62rem]">
                    ← Previous Lesson
                  </span>
                  <p className="serif text-xl font-semibold text-ink group-hover:text-forest mt-1 truncate">
                    {prevLesson.title}
                  </p>
                </Link>
              ) : (
                <div className="rounded-sm border border-dashed border-line/60 p-5 text-xs text-ink/40">
                  You are at the first lesson in the curriculum.
                </div>
              )}

              {nextLesson ? (
                <Link
                  href={`/lessons/${nextLesson.slug}`}
                  className="group rounded-sm border border-line p-5 text-right transition hover:border-brass hover:bg-white/40"
                >
                  <span className="eyebrow text-forest text-[0.62rem]">
                    Next Lesson →
                  </span>
                  <p className="serif text-xl font-semibold text-ink group-hover:text-forest mt-1 truncate">
                    {nextLesson.title}
                  </p>
                </Link>
              ) : (
                <div className="rounded-sm border border-dashed border-line/60 p-5 text-right text-xs text-ink/40">
                  You have reached the end of the curriculum!
                </div>
              )}
            </div>

            {/* Bottom Back Button */}
            <div className="mt-12 flex flex-wrap gap-4">
              <Link
                href="/#library"
                className="rounded-sm bg-forest px-6 py-4 text-xs font-bold uppercase tracking-[.14em] text-cream hover:bg-ink transition"
              >
                Back to Library
              </Link>
              <Link
                href="/curriculum"
                className="border border-line px-6 py-4 text-xs font-bold uppercase tracking-[.14em] text-forest hover:border-brass transition"
              >
                View Master Syllabus ↗
              </Link>
            </div>
          </div>

          {/* Module Navigation Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 rounded-sm border border-line bg-[#faf7ef] p-5">
              <p className="eyebrow text-brass mb-2 text-[0.65rem]">
                Module Outline
              </p>
              <h4 className="serif text-lg font-semibold text-ink mb-4 pb-2 border-b border-line">
                {lesson.module.title}
              </h4>
              <ul className="space-y-2 text-xs">
                {moduleLessons.map((item) => {
                  const isCurrent = item.slug === lesson.slug;
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/lessons/${item.slug}`}
                        className={`block py-1.5 px-2 rounded-sm transition ${
                          isCurrent
                            ? "bg-forest text-cream font-bold"
                            : "text-ink/70 hover:bg-[#eee7d7] hover:text-ink"
                        }`}
                      >
                        <span className="truncate block">{item.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 pt-4 border-t border-line text-[0.7rem] text-ink/45">
                <p>Repository file:</p>
                <code className="text-[0.68rem] text-forest break-all">
                  {lesson.filePath}
                </code>
              </div>
            </div>
          </aside>
        </div>
      </article>

      <footer className="border-t border-line bg-[#eee7d7]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-7 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brass text-xs font-bold text-brass">
              Py
            </span>
            <span className="serif text-lg text-ink">The Python Atelier</span>
          </div>
          <p className="text-xs text-ink/45">
            Lesson stored in PostgreSQL and retrieved with Prisma.
          </p>
          <div className="flex gap-5 text-xs font-bold uppercase tracking-widest text-ink/55">
            <Link href="/curriculum">Syllabus</Link>
            <Link href="/#library">Library</Link>
            <a href="#top">Top ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
