import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const ROOT_DIR = path.resolve(__dirname, "../..");

interface LevelConfig {
  slug: string;
  title: string;
  roman: string;
  badge: string;
  order: number;
  description: string;
  tone: string;
  accentColor: string;
  moduleOrder: string[];
}

const LEVELS: LevelConfig[] = [
  {
    slug: "beginner",
    title: "Level 1: Beginner Fundamentals",
    roman: "I · Foundation",
    badge: "Volume 01",
    order: 1,
    description:
      "Learn to think in Python. Syntax, data types, control flow, collections, functions, file handling, and the mental models that make every future line feel inevitable.",
    tone: "bg-[#e9dfc9]",
    accentColor: "#b28a47",
    moduleOrder: [
      "fundamentals",
      "variables-data-types",
      "operators",
      "strings",
      "control-flow",
      "collections",
      "functions",
      "comprehensions",
      "modules",
      "file-handling",
      "exceptions",
      "projects",
    ],
  },
  {
    slug: "intermediate",
    title: "Level 2: Intermediate Python & Software Engineering",
    roman: "II · Craft",
    badge: "Volume 02",
    order: 2,
    description:
      "Turn scripts into software with object design, testing, typing, advanced data structures, relational databases, REST APIs, and elegant abstractions.",
    tone: "bg-[#d5dfd1]",
    accentColor: "#386641",
    moduleOrder: [
      "oop",
      "iterators-generators",
      "decorators",
      "functional-programming",
      "typing",
      "advanced-data-structures",
      "databases",
      "apis-and-networking",
      "testing",
      "package-management",
      "projects",
    ],
  },
  {
    slug: "advanced",
    title: "Level 3: Advanced Python, Architecture & Systems Engineering",
    roman: "III · Mastery",
    badge: "Volume 03",
    order: 3,
    description:
      "Meet the runtime. CPython internals, bytecode, GIL, concurrency, async programming, application security, clean architecture, DevOps, and enterprise systems.",
    tone: "bg-[#c9d4d2]",
    accentColor: "#203a2b",
    moduleOrder: [
      "internals",
      "metaprogramming",
      "concurrency",
      "async",
      "fastapi-django",
      "security",
      "architecture",
      "devops",
      "data-science-ai",
      "projects",
    ],
  },
];

function cleanTitle(rawTitle: string): string {
  return rawTitle
    .replace(/^#+\s*/, "")
    .replace(/^[^\w\s\(\)]+/, "")
    .replace(/Module\s+\d+:\s*/i, "")
    .replace(/Level\s+\d+:\s*/i, "")
    .trim();
}

function parseMarkdownLesson(filePath: string, raw: string) {
  const lines = raw.split("\n");

  let title = "";
  for (const line of lines) {
    if (line.startsWith("# ")) {
      title = cleanTitle(line);
      break;
    }
  }
  if (!title) {
    title = path.basename(filePath, ".md").replace(/[-_]/g, " ");
  }

  // Extract first python code block
  const codeMatch = raw.match(/```python\s*([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : 'print("The Python Atelier")';

  // Extract topics from ## Headings
  const topics: string[] = [];
  const headingMatches = raw.matchAll(/^##\s+(.+)$/gm);
  for (const match of headingMatches) {
    const h = cleanTitle(match[1]);
    if (
      ![
        "Prerequisites",
        "Summary",
        "Exercises",
        "Knowledge Check",
        "Project Overview",
        "Key Takeaways",
        "Table of Contents",
      ].includes(h) &&
      h.length < 60
    ) {
      topics.push(h);
    }
  }

  // Extract intro
  let intro = "";
  const introMatch = raw.match(/## Introduction\s+([\s\S]*?)(?=\n##|\n---)/);
  if (introMatch) {
    const paras = introMatch[1].trim().split(/\n\s*\n/);
    intro = paras[0].replace(/\n/g, " ").trim();
  } else {
    const afterTitle = raw.replace(/^#\s+.*?\n+/, "");
    const firstPara = afterTitle.split(/\n\s*\n/)[0] || "";
    intro = firstPara.replace(/^##\s+.*?\n*/, "").replace(/\n/g, " ").trim();
  }

  if (intro.length > 350) {
    intro = intro.slice(0, 347) + "...";
  }

  const wordCount = raw.split(/\s+/).length;
  const readTime = Math.max(4, Math.round(wordCount / 220));

  return {
    title,
    intro: intro || "A comprehensive study into this Python concept.",
    code,
    topics: topics.slice(0, 6),
    readTime,
  };
}

async function main() {
  console.log("Starting database seed with Prisma and PostgreSQL...");

  for (const levelConfig of LEVELS) {
    console.log(`\nProcessing ${levelConfig.title}...`);

    const level = await prisma.level.upsert({
      where: { slug: levelConfig.slug },
      update: {
        title: levelConfig.title,
        roman: levelConfig.roman,
        badge: levelConfig.badge,
        description: levelConfig.description,
        tone: levelConfig.tone,
        accentColor: levelConfig.accentColor,
        order: levelConfig.order,
      },
      create: {
        slug: levelConfig.slug,
        title: levelConfig.title,
        roman: levelConfig.roman,
        badge: levelConfig.badge,
        description: levelConfig.description,
        tone: levelConfig.tone,
        accentColor: levelConfig.accentColor,
        order: levelConfig.order,
      },
    });

    const levelDir = path.join(ROOT_DIR, levelConfig.slug);
    if (!fs.existsSync(levelDir)) {
      console.warn(`Directory not found: ${levelDir}`);
      continue;
    }

    const availableModules = fs
      .readdirSync(levelDir)
      .filter((d) => fs.statSync(path.join(levelDir, d)).isDirectory());

    // Sort modules according to levelConfig.moduleOrder
    const sortedModules = [
      ...levelConfig.moduleOrder.filter((m) => availableModules.includes(m)),
      ...availableModules.filter((m) => !levelConfig.moduleOrder.includes(m)),
    ];

    let moduleOrderIndex = 1;
    let globalLessonOrder = 1;

    for (const modDirName of sortedModules) {
      const modPath = path.join(levelDir, modDirName);
      const modReadmePath = path.join(modPath, "README.md");
      const modSlug = `${levelConfig.slug}-${modDirName}`;

      let modTitle = modDirName
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      let modDescription = "";

      let orderedLessonFiles: string[] = [];

      if (fs.existsSync(modReadmePath)) {
        const readmeContent = fs.readFileSync(modReadmePath, "utf-8");
        const firstLine = readmeContent.split("\n")[0] || "";
        const extractedTitle = cleanTitle(firstLine);
        if (extractedTitle) modTitle = extractedTitle;

        const overviewMatch = readmeContent.match(
          /## (?:🎯 )?(?:Module )?Overview\s+([\s\S]*?)(?=\n##|\n---)/i
        );
        if (overviewMatch) {
          modDescription = overviewMatch[1].trim().split(/\n\s*\n/)[0].trim();
        }

        const linkMatches = [
          ...readmeContent.matchAll(/\[.*?\]\(([\w\-\.]+?\.md)\)/g),
        ];
        for (const m of linkMatches) {
          const fn = path.basename(m[1]);
          if (
            fs.existsSync(path.join(modPath, fn)) &&
            fn !== "README.md" &&
            !orderedLessonFiles.includes(fn)
          ) {
            orderedLessonFiles.push(fn);
          }
        }
      }

      const allModFiles = fs
        .readdirSync(modPath)
        .filter((f) => f.endsWith(".md") && f !== "README.md");

      for (const fn of allModFiles.sort()) {
        if (!orderedLessonFiles.includes(fn)) {
          orderedLessonFiles.push(fn);
        }
      }

      const dbModule = await prisma.module.upsert({
        where: { slug: modSlug },
        update: {
          title: modTitle,
          description: modDescription,
          order: moduleOrderIndex++,
          levelSlug: level.slug,
        },
        create: {
          slug: modSlug,
          title: modTitle,
          description: modDescription,
          order: moduleOrderIndex++,
          levelSlug: level.slug,
        },
      });

      console.log(
        `  Created module [${dbModule.slug}]: "${dbModule.title}" with ${orderedLessonFiles.length} lessons`
      );

      let lessonIndex = 1;
      for (const lessonFile of orderedLessonFiles) {
        const lessonFilePath = path.join(modPath, lessonFile);
        const relativeFilePath = path.relative(ROOT_DIR, lessonFilePath);
        const rawContent = fs.readFileSync(lessonFilePath, "utf-8");
        const parsed = parseMarkdownLesson(relativeFilePath, rawContent);

        const slug = path.basename(lessonFile, ".md");
        const isProject =
          modDirName === "projects" || lessonFile.startsWith("project-");

        await prisma.lesson.upsert({
          where: { slug },
          update: {
            title: parsed.title,
            levelSlug: level.slug,
            moduleSlug: dbModule.slug,
            order: globalLessonOrder++,
            intro: parsed.intro,
            content: rawContent,
            code: parsed.code,
            topics: parsed.topics,
            filePath: relativeFilePath,
            isProject,
            readTime: parsed.readTime,
          },
          create: {
            slug,
            title: parsed.title,
            levelSlug: level.slug,
            moduleSlug: dbModule.slug,
            order: globalLessonOrder++,
            intro: parsed.intro,
            content: rawContent,
            code: parsed.code,
            topics: parsed.topics,
            filePath: relativeFilePath,
            isProject,
            readTime: parsed.readTime,
          },
        });
        lessonIndex++;
      }
    }
  }

  const totalLevels = await prisma.level.count();
  const totalModules = await prisma.module.count();
  const totalLessons = await prisma.lesson.count();

  console.log("\n===========================================");
  console.log(" Database Seed Successful!");
  console.log(` Levels seeded:   ${totalLevels}`);
  console.log(` Modules seeded:  ${totalModules}`);
  console.log(` Lessons seeded:  ${totalLessons}`);
  console.log("===========================================\n");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
