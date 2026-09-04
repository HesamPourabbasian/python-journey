"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-6 lg:px-10">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brass text-sm font-bold text-brass">
          Py
        </span>
        <span className="serif text-xl font-semibold tracking-tight text-ink">
          The Python Atelier
        </span>
      </Link>
      <div className="hidden items-center gap-9 text-xs font-bold uppercase tracking-[.14em] text-ink/65 md:flex">
        <Link href="/curriculum" className="transition hover:text-brass">
          Curriculum
        </Link>
        <a href="#method" className="transition hover:text-brass">
          Our method
        </a>
        <a href="#library" className="transition hover:text-brass">
          Library
        </a>
        <Link
          href="/lessons/what-is-python"
          className="border-b border-brass pb-1 text-ink hover:text-forest transition"
        >
          Start Lesson 01 <span className="ml-1 text-brass">→</span>
        </Link>
      </div>
      <button
        aria-label="Open menu"
        onClick={() => setMenuOpen(!menuOpen)}
        className="text-2xl md:hidden text-ink"
      >
        {menuOpen ? "×" : "☰"}
      </button>

      {menuOpen && (
        <div className="absolute top-20 left-6 right-6 z-50 rounded border border-line bg-[#f5f1e7] p-6 shadow-xl space-y-4 text-sm font-bold md:hidden">
          <Link
            className="block text-ink hover:text-brass"
            href="/curriculum"
            onClick={() => setMenuOpen(false)}
          >
            Curriculum
          </Link>
          <a
            className="block text-ink hover:text-brass"
            href="#method"
            onClick={() => setMenuOpen(false)}
          >
            Our method
          </a>
          <a
            className="block text-ink hover:text-brass"
            href="#library"
            onClick={() => setMenuOpen(false)}
          >
            Library
          </a>
          <Link
            className="block text-forest"
            href="/lessons/what-is-python"
            onClick={() => setMenuOpen(false)}
          >
            Start Lesson 01 →
          </Link>
        </div>
      )}
    </nav>
  );
}
