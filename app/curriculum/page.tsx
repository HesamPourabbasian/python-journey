import Link from "next/link";
import { getFullCurriculum } from "../../lib/data";

export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  const levels = await getFullCurriculum();

  const totalLessons = levels.reduce(
    (acc: number, lvl: any) =>
      acc + lvl.modules.reduce((mAcc: number, m: any) => mAcc + m.lessons.length, 0),
    0
  );

  return (
    <main className="min-h-screen paper-grain">
      <nav className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-6 lg:px-10 border-b border-line">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brass text-sm font-bold text-brass">
            Py
          </span>
          <span className="serif text-xl font-semibold tracking-tight text-ink">
            The Python Atelier
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-[.14em] text-ink/65 hover:text-brass transition"
          >
            ← Home
          </Link>
          <Link
            href="/#library"
            className="text-xs font-bold uppercase tracking-[.14em] text-forest hover:text-ink transition"
          >
            Search Library
          </Link>
        </div>
      </nav>

      <header className="mx-auto max-w-[1320px] px-6 pt-16 pb-12 lg:px-10">
        <p className="eyebrow mb-4 text-brass">Master Curriculum Syllabus</p>
        <h1 className="serif text-5xl sm:text-7xl font-semibold tracking-tight text-ink">
          The Complete Architecture of Python.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-ink/70">
          An exhaustive, production-grade syllabus sequenced into three distinct cognitive tiers:
          Beginner Foundations, Intermediate Craft, and Advanced Systems Engineering.
        </p>

        <div className="mt-8 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider text-ink/60">
          <span className="rounded-sm bg-[#eee7d7] px-3.5 py-1.5 border border-line">
            3 Progressive Volumes
          </span>
          <span className="rounded-sm bg-[#eee7d7] px-3.5 py-1.5 border border-line">
            33 Dedicated Modules
          </span>
          <span className="rounded-sm bg-[#eee7d7] px-3.5 py-1.5 border border-line">
            {totalLessons} In-depth Lessons &amp; Projects
          </span>
          <span className="rounded-sm bg-[#eee7d7] px-3.5 py-1.5 border border-line text-forest font-semibold">
            PostgreSQL &amp; Prisma Backed
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-6 pb-28 lg:px-10 space-y-20">
        {levels.map((level: any) => {
          const levelLessonCount = level.modules.reduce(
            (acc: number, m: any) => acc + m.lessons.length,
            0
          );

          return (
            <section
              key={level.id}
              id={level.slug}
              className="rounded-sm border border-line bg-[#fbf8f1] p-8 sm:p-12 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-line pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="eyebrow text-brass">{level.badge}</span>
                    <span className="text-xs text-ink/40">·</span>
                    <span className="text-xs font-bold tracking-wider text-forest uppercase">
                      {level.roman}
                    </span>
                  </div>
                  <h2 className="serif text-4xl sm:text-5xl font-semibold text-ink">
                    {level.title}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm sm:text-base leading-7 text-ink/65">
                    {level.description}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-ink/50">
                  <span>{level.modules.length} modules</span>
                  <span>·</span>
                  <span className="text-forest font-bold">{levelLessonCount} lessons</span>
                </div>
              </div>

              <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {level.modules.map((mod: any, modIdx: number) => (
                  <div
                    key={mod.id}
                    className="flex flex-col justify-between rounded-sm border border-line/80 bg-white/70 p-6 transition hover:border-brass hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-ink/40 mb-3">
                        <span className="font-mono text-brass font-bold">
                          MODULE {String(modIdx + 1).padStart(2, "0")}
                        </span>
                        <span>{mod.lessons.length} articles</span>
                      </div>
                      <h3 className="serif text-2xl font-semibold text-ink mb-3 leading-snug">
                        {mod.title}
                      </h3>
                      {mod.description && (
                        <p className="text-xs text-ink/60 line-clamp-2 leading-5 mb-4">
                          {mod.description}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-line/50 pt-4 mt-2">
                      <ul className="space-y-2 text-xs">
                        {mod.lessons.map((lesson: any) => (
                          <li key={lesson.id}>
                            <Link
                              href={`/lessons/${lesson.slug}`}
                              className="group flex items-center justify-between py-1 text-ink/75 hover:text-forest transition"
                            >
                              <span className="truncate pr-2 font-medium">
                                {lesson.title}
                              </span>
                              <span className="text-ink/30 text-sm group-hover:translate-x-0.5 group-hover:text-brass transition">
                                ↗
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="border-t border-line bg-[#eee7d7]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brass text-xs font-bold text-brass">
              Py
            </span>
            <span className="serif text-lg text-ink">The Python Atelier</span>
          </div>
          <p className="text-xs text-ink/45">
            Full three-level curriculum powered by PostgreSQL and Prisma ORM.
          </p>
          <div className="flex gap-5 text-xs font-bold uppercase tracking-widest text-ink/55">
            <Link href="/">Home ↑</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
