import Link from "next/link";
import { prisma } from "../lib/prisma";
import Navbar from "./components/Navbar";
import ReadingRoom, { LessonSummary } from "./components/ReadingRoom";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [levels, dbLessons, totalLessons, totalProjects, totalModules] =
    await Promise.all([
      prisma.level.findMany({
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: { lessons: true, modules: true },
          },
          lessons: {
            take: 1,
            orderBy: { order: "asc" },
            select: { slug: true },
          },
        },
      }),
      prisma.lesson.findMany({
        orderBy: { order: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
          order: true,
          readTime: true,
          isProject: true,
          topics: true,
          levelSlug: true,
          level: {
            select: { title: true, roman: true },
          },
          moduleSlug: true,
          module: {
            select: { title: true },
          },
        },
      }),
      prisma.lesson.count(),
      prisma.lesson.count({ where: { isProject: true } }),
      prisma.module.count(),
    ]);

  const lessons: LessonSummary[] = dbLessons.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    order: l.order,
    readTime: l.readTime,
    isProject: l.isProject,
    topics: l.topics,
    levelSlug: l.levelSlug,
    levelTitle: l.level.title,
    levelRoman: l.level.roman,
    moduleSlug: l.moduleSlug,
    moduleTitle: l.module.title,
  }));

  return (
    <main className="min-h-screen paper-grain">
      <Navbar />

      {/* Hero Section */}
      <section
        id="top"
        className="mx-auto grid max-w-[1320px] gap-12 px-6 pb-24 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10 lg:pt-20"
      >
        <div>
          <p className="eyebrow mb-7 text-brass">
            A considered education in Python
          </p>
          <h1 className="serif max-w-3xl text-6xl leading-[.91] tracking-[-.04em] text-ink sm:text-8xl">
            Learn the language.
            <br />
            <em className="font-normal text-forest">Keep the craft.</em>
          </h1>
          <p className="mt-8 max-w-lg text-base leading-8 text-ink/65">
            A beautifully structured, deeply practical path from your first{" "}
            <code className="rounded bg-[#e8e1d2] px-1.5 py-0.5 text-sm text-forest font-mono">
              print()
            </code>{" "}
            to production systems. Powered by PostgreSQL and Prisma ORM.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <a
              href="#curriculum"
              className="rounded-sm bg-forest px-7 py-4 text-xs font-bold uppercase tracking-[.15em] text-cream shadow-lg shadow-forest/10 transition hover:bg-ink"
            >
              Explore the curriculum <span className="ml-6 text-brass">→</span>
            </a>
            <Link
              href="/curriculum"
              className="text-xs font-bold uppercase tracking-widest text-ink/60 hover:text-forest transition"
            >
              View Full Syllabus ↗
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[540px] lg:ml-auto">
          <div className="absolute -right-2 -top-5 z-10 flex h-28 w-28 rotate-6 flex-col items-center justify-center rounded-full border border-brass bg-[#f5f1e7] text-center shadow-xl">
            <span className="serif text-2xl text-brass">Est.</span>
            <span className="eyebrow text-[.5rem]">for curious minds</span>
          </div>
          <div className="olive-glow relative overflow-hidden rounded-sm px-8 pb-8 pt-10 text-cream shadow-2xl shadow-forest/20 sm:px-12">
            <div className="absolute -right-12 bottom-0 text-[240px] font-black leading-none text-white/[.035]">
              {`{ }`}
            </div>
            <div className="relative">
              <div className="mb-24 flex items-center justify-between">
                <span className="eyebrow text-brass">Volume one</span>
                <span className="text-xs text-cream/45">01 / 03</span>
              </div>
              <p className="serif text-5xl leading-none sm:text-6xl">
                The
                <br />
                <span className="italic text-[#d6bf91]">quiet</span> power
                <br />
                of Python.
              </p>
              <div className="mt-20 flex items-end justify-between border-t border-cream/15 pt-4">
                <Link
                  href="/lessons/what-is-python"
                  className="text-xs text-cream/70 hover:text-cream transition flex items-center gap-2"
                >
                  <span>Begin with Lesson 01</span>
                  <span className="text-brass">→</span>
                </Link>
                <span className="serif text-4xl text-brass">⌁</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Stats Banner from PostgreSQL */}
      <section className="border-y border-line bg-[#f0eadc]/70">
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 divide-x divide-line px-6 lg:grid-cols-4 lg:px-10">
          <Stat value={`${totalLessons}+`} label="carefully written lessons" />
          <Stat value={`${totalProjects}`} label="hands-on capstone projects" />
          <Stat value={`${totalModules}`} label="comprehensive modules" />
          <Stat value="3" label="levels of progression" />
        </div>
      </section>

      {/* Curriculum Collection (3 Levels) */}
      <section
        id="curriculum"
        className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10"
      >
        <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-4 text-brass">The collection</p>
            <h2 className="serif text-5xl tracking-tight sm:text-6xl text-ink">
              A proper way to learn.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-ink/55">
            Three volumes. One clear progression. Built for the long view.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {levels.map((level, idx) => {
            const firstLessonSlug = level.lessons[0]?.slug || "what-is-python";
            return (
              <div
                key={level.id}
                className={`${level.tone} group relative flex flex-col justify-between min-h-[380px] overflow-hidden rounded-sm p-8 transition hover:-translate-y-1 hover:shadow-xl`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="eyebrow text-ink/60">{level.roman}</span>
                    <span className="serif text-2xl text-ink/35 font-bold">
                      0{idx + 1}
                    </span>
                  </div>
                  <div className="relative mt-16">
                    <span className="eyebrow text-brass block mb-1">
                      {level.badge}
                    </span>
                    <h3 className="serif text-3xl sm:text-4xl leading-tight text-ink font-semibold">
                      {level.title.replace(/^Level \d+:\s*/, "")}
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-ink/70">
                      {level.description}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-ink/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-forest">
                    <span>{level._count.lessons} lessons</span>
                    <span className="text-ink/30">·</span>
                    <span>{level._count.modules} modules</span>
                  </div>
                  <Link
                    href={`/curriculum#${level.slug}`}
                    className="text-xs font-bold uppercase tracking-wider text-forest group-hover:text-ink transition flex items-center gap-1"
                  >
                    <span>View volume</span>
                    <span className="text-brass">→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Atelier Method Section */}
      <section id="method" className="olive-glow text-cream">
        <div className="mx-auto grid max-w-[1320px] gap-14 px-6 py-24 lg:grid-cols-[.8fr_1.2fr] lg:px-10">
          <div>
            <p className="eyebrow mb-5 text-brass">The atelier method</p>
            <h2 className="serif text-5xl leading-[.95] sm:text-6xl">
              Depth over
              <br />
              <i className="text-[#d6bf91]">shortcuts.</i>
            </h2>
            <p className="mt-7 max-w-sm text-sm leading-7 text-cream/60">
              Most tutorials teach you what to type. We take the time to show you
              why it works, when it breaks, and how to make it yours.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {[
              [
                "01",
                "Read with purpose",
                "Every lesson starts with a mental model, then earns its code.",
              ],
              [
                "02",
                "Make it real",
                "Small exercises become useful tools you can keep and improve.",
              ],
              [
                "03",
                "Return often",
                "A good reference is not finished. It grows with your questions.",
              ],
              [
                "04",
                "Build judgment",
                "Learn the trade-offs behind the syntax, not just the syntax itself.",
              ],
            ].map(([num, title, copy]) => (
              <div key={num} className="border-t border-cream/20 pt-5">
                <span className="eyebrow text-brass">{num}</span>
                <h3 className="serif mt-6 text-3xl">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-cream/55">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Reading Room with All Lessons from PostgreSQL */}
      <ReadingRoom lessons={lessons} />

      {/* Footer */}
      <footer className="border-t border-line bg-[#eee7d7]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brass text-xs font-bold text-brass">
              Py
            </span>
            <span className="serif text-lg text-ink">The Python Atelier</span>
          </div>
          <p className="text-xs text-ink/45">
            A complete learning journey across 3 progressive volumes, powered by
            Prisma &amp; PostgreSQL.
          </p>
          <div className="flex gap-5 text-xs font-bold uppercase tracking-widest text-ink/55">
            <Link href="/curriculum">Full Curriculum</Link>
            <a href="#top">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 py-7 first:pl-0 last:pr-0 sm:px-7">
      <p className="serif text-4xl text-forest">{value}</p>
      <p className="mt-1 text-[.65rem] font-bold uppercase leading-4 tracking-widest text-ink/45">
        {label}
      </p>
    </div>
  );
}
