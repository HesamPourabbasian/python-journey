import { prisma } from "./prisma";
import cachedData from "./curriculum-data.json";

export async function getCurriculumData() {
  try {
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

    if (levels.length > 0 && dbLessons.length > 0) {
      return {
        levels,
        lessons: dbLessons.map((l) => ({
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
        })),
        stats: { totalLessons, totalProjects, totalModules },
      };
    }
  } catch (err) {
    console.warn("PostgreSQL query fallback to cached curriculum data:", err);
  }

  // Graceful fallback to pre-seeded JSON cache
  return {
    levels: cachedData.levels.map((lvl) => ({
      ...lvl,
      _count: {
        lessons: lvl.modules.reduce((acc, m) => acc + m.lessons.length, 0),
        modules: lvl.modules.length,
      },
      lessons: [{ slug: lvl.modules[0]?.lessons[0]?.slug || "what-is-python" }],
    })),
    lessons: cachedData.lessons.map((l) => ({
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
    })),
    stats: cachedData.stats,
  };
}

export async function getFullCurriculum() {
  try {
    const levels = await prisma.level.findMany({
      orderBy: { order: "asc" },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (levels.length > 0) {
      return levels;
    }
  } catch (err) {
    console.warn("PostgreSQL full curriculum fallback:", err);
  }

  return cachedData.levels;
}

export async function getLessonBySlug(slug: string) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { slug },
      include: {
        level: true,
        module: true,
      },
    });

    if (lesson) {
      const [prevLesson, nextLesson, moduleLessons] = await Promise.all([
        prisma.lesson.findFirst({
          where: { order: lesson.order - 1 },
          select: { slug: true, title: true, order: true },
        }),
        prisma.lesson.findFirst({
          where: { order: lesson.order + 1 },
          select: { slug: true, title: true, order: true },
        }),
        prisma.lesson.findMany({
          where: { moduleSlug: lesson.moduleSlug },
          orderBy: { order: "asc" },
          select: { id: true, slug: true, title: true, order: true },
        }),
      ]);

      return { lesson, prevLesson, nextLesson, moduleLessons };
    }
  } catch (err) {
    console.warn("PostgreSQL lesson lookup fallback:", err);
  }

  // Fallback to cache
  const cachedLesson = cachedData.lessons.find((l) => l.slug === slug);
  if (!cachedLesson) return null;

  const prev = cachedData.lessons.find((l) => l.order === cachedLesson.order - 1);
  const next = cachedData.lessons.find((l) => l.order === cachedLesson.order + 1);
  const modLessons = cachedData.lessons
    .filter((l) => l.moduleSlug === cachedLesson.moduleSlug)
    .sort((a, b) => a.order - b.order)
    .map((l) => ({ id: l.id, slug: l.slug, title: l.title, order: l.order }));

  return {
    lesson: cachedLesson,
    prevLesson: prev ? { slug: prev.slug, title: prev.title, order: prev.order } : null,
    nextLesson: next ? { slug: next.slug, title: next.title, order: next.order } : null,
    moduleLessons: modLessons,
  };
}
