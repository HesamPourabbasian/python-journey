# Project 07 — Interactive Timed Quiz & Flashcard Engine in Python

## Introduction

Welcome to Project 07 of the Beginner Python Curriculum!

Interactive assessment platforms, automated developer certification exam simulators, and spaced-repetition flashcard engines (like Anki or Quizlet) are essential software tools in modern computer-assisted learning. In this capstone project, you will build an **Interactive Timed Quiz & Flashcard Engine (`quiz_engine.py`)**.

This project implements a complete **Assessment Testing Platform** featuring **JSON Question Bank Ingestion**, **Randomized Question & Option Shuffling**, **Per-Question Timed Countdown Tracking**, **Detailed Answer Explanations**, **Weighted Scoring Algorithms**, and **Performance Diagnostic Reports**.

This project synthesizes foundational concepts from:
- **Module 5**: Control Flow, While Loops, and Pattern Matching
- **Module 6**: Lists, Dictionaries, Sets, and Built-in Helpers (`enumerate`, `zip`, `random`)
- **Module 7**: Modular Functions, Type Annotations, and Docstrings
- **Module 8**: List and Set Comprehensions
- **Module 9**: Standard Library (`time`, `random`, `json`, `pathlib`)
- **Module 10**: Persistent JSON File Handling and Context Managers
- **Module 11**: Custom Exception Hierarchies

---

## Prerequisites

Before beginning this project, ensure you have:
- Mastered [Working with CSV & JSON Data](../file-handling/working-with-csv-json.md).
- Mastered [Python Standard Library Overview](../modules/standard-library-overview.md) (`time` and `random`).
- Mastered [Structural Pattern Matching](../control-flow/match-case.md).

---

## Core Concept & Architecture

```
                            QUIZ SESSION FLOW ARCHITECTURE

                                 [ Load JSON Question Bank ]
                                             │
                                             ▼
                             [ Select Topic & Question Count ]
                                             │
                                             ▼
                             [ Randomize Question Sample ]
                             (random.sample without mutation)
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │           FOR EACH QUESTION               │
                       │                                           │
                       │  1. Shuffle Multiple Choice Options       │
                       │  2. Record Start Time (time.perf_counter) │
                       │  3. Prompt User for Selection             │
                       │  4. Measure Elapsed Seconds               │
                       │  5. Validate Choice & Explain Answer      │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                                  [ Calculate Diagnostics ]
                                  • Accuracy %
                                  • Average Time per Question
                                  • Topic Weakness Breakdown
                                             │
                                             ▼
                                  [ Render Assessment Card ]
```

---

## Complete Production Source Code

```python
"""
Interactive Timed Quiz & Flashcard Assessment Engine
Author: Hesam Pourabbasain
Curriculum: Python Journey - Beginner Capstone Project 07
"""

import json
import random
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# =====================================================================
# 1. DOMAIN DATA MODELS
# =====================================================================

@dataclass
class Question:
    id: str
    topic: str
    prompt: str
    correct_answer: str
    distractors: list[str]
    explanation: str

    def get_shuffled_choices(self) -> list[str]:
        """Return a randomized list of options containing all distractors + correct answer."""
        all_choices = [self.correct_answer] + self.distractors
        random.shuffle(all_choices)
        return all_choices

@dataclass
class AnswerAttempt:
    question: Question
    selected_answer: str
    is_correct: bool
    time_taken_sec: float

# =====================================================================
# 2. DEFAULT QUESTION BANK & LOADER
# =====================================================================

DEFAULT_QUESTION_BANK = [
    {
        "id": "PY-01",
        "topic": "Python Fundamentals",
        "prompt": "Which built-in function returns a constant O(1) memory iterator for reverse traversal?",
        "correct_answer": "reversed()",
        "distractors": ["reverse()", "sorted(..., reverse=True)", "list.flip()"],
        "explanation": "'reversed()' returns a lightweight reverse iterator object without allocating a new list in RAM."
    },
    {
        "id": "PY-02",
        "topic": "Data Structures",
        "prompt": "What is the average time complexity of checking membership ('x in s') in a Python set?",
        "correct_answer": "O(1) Constant Time",
        "distractors": ["O(N) Linear Time", "O(log N) Logarithmic Time", "O(N^2) Quadratic Time"],
        "explanation": "Python sets are implemented using hash tables, providing instantaneous O(1) average lookup performance."
    },
    {
        "id": "PY-03",
        "topic": "Control Flow",
        "prompt": "When does the 'else' block attached to a 'for' loop execute?",
        "correct_answer": "When the loop completes naturally without encountering a 'break'",
        "distractors": [
            "When an exception occurs inside the loop",
            "Whenever the loop runs for at least one iteration",
            "Only when the loop condition evaluates to False on the first check"
        ],
        "explanation": "A loop 'else' clause executes only when the loop terminates without hitting a 'break' statement."
    },
    {
        "id": "PY-04",
        "topic": "Security & Standard Library",
        "prompt": "Which Python standard library module must be used for generating cryptographic passwords and tokens?",
        "correct_answer": "secrets",
        "distractors": ["random", "math", "hashlib"],
        "explanation": "The 'secrets' module (PEP 506) accesses OS CSPRNG (/dev/urandom), unlike 'random' which uses predictable Mersenne Twister."
    },
    {
        "id": "PY-05",
        "topic": "Functions & Scope",
        "prompt": "What search order hierarchy does Python execute to resolve variable identifiers?",
        "correct_answer": "LEGB: Local -> Enclosing -> Global -> Built-in",
        "distractors": [
            "GELB: Global -> Enclosing -> Local -> Built-in",
            "LIFO: Local -> Inherited -> Free -> Outer",
            "FIFO: First -> Inner -> Outer -> Last"
        ],
        "explanation": "Python resolves variables sequentially across Local, Enclosing, Global, and Built-in namespaces."
    }
]

class QuizBankRepository:
    def __init__(self, filepath: Path = Path("quiz_question_bank.json")):
        self.filepath = filepath
        self._ensure_bank_exists()

    def _ensure_bank_exists(self):
        if not self.filepath.exists():
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_QUESTION_BANK, f, indent=2)

    def load_questions(self) -> list[Question]:
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                return [
                    Question(
                        id=q["id"],
                        topic=q["topic"],
                        prompt=q["prompt"],
                        correct_answer=q["correct_answer"],
                        distractors=q["distractors"],
                        explanation=q["explanation"]
                    )
                    for q in raw_data
                ]
        except (OSError, json.JSONDecodeError, KeyError):
            return []

# =====================================================================
# 3. QUIZ SESSION CONTROLLER
# =====================================================================

class QuizSessionEngine:
    def __init__(self, questions: list[Question]):
        self.questions = questions

    def get_available_topics(self) -> list[str]:
        return sorted(list(set(q.topic for q in self.questions)))

    def conduct_quiz(self, selected_topic: str = None, question_count: int = 5) -> list[AnswerAttempt]:
        # Filter questions by topic if specified
        pool = self.questions
        if selected_topic and selected_topic.upper() != "ALL":
            pool = [q for q in pool if q.topic.lower() == selected_topic.lower()]

        if not pool:
            raise ValueError("No questions available matching criteria.")

        # Sample randomized questions without mutation
        sample_size = min(question_count, len(pool))
        active_quiz_questions = random.sample(pool, sample_size)
        attempts = []

        print("\n" + "=" * 68)
        print(f"       🎯 STARTING TIMED QUIZ ({sample_size} Questions | Topic: {selected_topic or 'ALL'})")
        print("=" * 68)

        for q_index, q in enumerate(active_quiz_questions, start=1):
            print(f"\n[Question #{q_index}/{sample_size}] Topic: [{q.topic}]")
            print(f"👉 {q.prompt}\n")

            choices = q.get_shuffled_choices()
            choice_map = {}
            for letter, choice_text in zip(["A", "B", "C", "D"], choices):
                choice_map[letter] = choice_text
                print(f"   ({letter}) {choice_text}")

            # Timed Input
            start_t = time.perf_counter()
            while True:
                user_choice = input("\nYour Answer (A, B, C, D) or 'Q' to quit: ").strip().upper()
                if user_choice in ("Q", "QUIT"):
                    print("🚪 Quiz aborted by user.")
                    return attempts
                if user_choice in choice_map:
                    break
                print("❌ Invalid selection. Please enter A, B, C, or D.")

            elapsed_sec = time.perf_counter() - start_t
            selected_text = choice_map[user_choice]
            is_correct = (selected_text == q.correct_answer)

            # Immediate Feedback
            if is_correct:
                print(f"✅ CORRECT! (Answered in {elapsed_sec:.2f}s)")
            else:
                print(f"❌ INCORRECT. Correct Answer was: ({[k for k, v in choice_map.items() if v == q.correct_answer][0]}) {q.correct_answer}")
            
            print(f"💡 Explanation: {q.explanation}")
            print("-" * 68)

            attempts.append(AnswerAttempt(q, selected_text, is_correct, elapsed_sec))

        return attempts

# =====================================================================
# 4. REPORT & DIAGNOSTICS GENERATOR
# =====================================================================

class AssessmentReportGenerator:
    @staticmethod
    def render_report(attempts: list[AnswerAttempt]):
        if not attempts:
            print("No completed questions to evaluate.")
            return

        total_questions = len(attempts)
        correct_count = sum(1 for a in attempts if a.is_correct)
        accuracy_pct = (correct_count / total_questions) * 100.0
        total_time_sec = sum(a.time_taken_sec for a in attempts)
        avg_time_sec = total_time_sec / total_questions

        # Topic Breakdown
        topic_stats = {}
        for a in attempts:
            topic = a.question.topic
            if topic not in topic_stats:
                topic_stats[topic] = {"correct": 0, "total": 0}
            topic_stats[topic]["total"] += 1
            if a.is_correct:
                topic_stats[topic]["correct"] += 1

        print("\n" + "=" * 68)
        print("                📊 FINAL ASSESSMENT SCORECARD")
        print("=" * 68)
        print(f"  Final Score      : {correct_count} / {total_questions} ({accuracy_pct:.1f}%)")
        print(f"  Total Duration   : {total_time_sec:.1f} seconds (Avg {avg_time_sec:.1f}s / question)")
        
        # Grade Evaluation
        if accuracy_pct >= 90: grade = "💎 MASTER (GRADE: A+)"
        elif accuracy_pct >= 80: grade = "🟢 PROFICIENT (GRADE: A)"
        elif accuracy_pct >= 70: grade = "🟡 COMPETENT (GRADE: B)"
        else: grade = "🔴 NEEDS REVIEW (GRADE: C)"
        
        print(f"  Proficiency Tier : {grade}")
        print("-" * 68)
        print("  Topic Mastery Breakdown:")
        for topic, stat in topic_stats.items():
            t_pct = (stat["correct"] / stat["total"]) * 100.0
            print(f"   • {topic:<32}: {stat['correct']}/{stat['total']} ({t_pct:>5.1f}%)")
        print("=" * 68 + "\n")

# =====================================================================
# 5. INTERACTIVE CLI
# =====================================================================

class QuizApplicationCLI:
    def __init__(self):
        self.repo = QuizBankRepository()
        self.questions = self.repo.load_questions()
        self.engine = QuizSessionEngine(self.questions)

    def print_banner(self):
        print("=" * 68)
        print("         🎓 INTERACTIVE PYTHON CERTIFICATION QUIZ ARENA")
        print("=" * 68)
        print(f"  Question Bank Active: {len(self.questions)} Loaded Questions")
        print("=" * 68)

    def run(self):
        self.print_banner()

        while True:
            print("\nOptions:")
            print("  [1] Start Timed Quiz Assessment")
            print("  [2] View Available Topics")
            print("  [3] Flashcard Study Mode")
            print("  [4] Exit Application")

            choice = input("\nEnter choice (1-4): ").strip()

            match choice:
                case "1":
                    self._handle_quiz_flow()
                case "2":
                    topics = self.engine.get_available_topics()
                    print("\nAvailable Topics in Bank:")
                    for t in topics: print(f"  • {t}")
                case "3":
                    self._handle_flashcard_mode()
                case "4" | "exit" | "q":
                    print("👋 Quiz arena closed. Happy coding!")
                    break
                case _:
                    print("❌ Invalid option. Please enter 1-4.")

    def _handle_quiz_flow(self):
        topics = ["ALL"] + self.engine.get_available_topics()
        print("\nSelect Quiz Topic:")
        for idx, t in enumerate(topics, start=1):
            print(f"  [{idx}] {t}")

        t_idx = input(f"Choose Topic (1-{len(topics)}): ").strip()
        try:
            selected_topic = topics[int(t_idx) - 1]
        except (ValueError, IndexError):
            selected_topic = "ALL"

        attempts = self.engine.conduct_quiz(selected_topic=selected_topic, question_count=5)
        AssessmentReportGenerator.render_report(attempts)

    def _handle_flashcard_mode(self):
        print("\n" + "=" * 68)
        print("              💡 FLASHCARD REVISION STUDY MODE")
        print("=" * 68)
        sample = random.sample(self.questions, len(self.questions))
        for idx, q in enumerate(sample, start=1):
            print(f"\n[Card #{idx}/{len(sample)}] Topic: {q.topic}")
            print(f"Question : {q.prompt}")
            input("\nPress [ENTER] to reveal answer...")
            print(f"Answer   : 🎯 {q.correct_answer}")
            print(f"Details  : {q.explanation}")
            print("-" * 68)
            cont = input("Next card? (y/n): ").strip().lower()
            if cont not in ("y", "yes"):
                break

# =====================================================================
# 6. ENTRY POINT
# =====================================================================

if __name__ == "__main__":
    app = QuizApplicationCLI()
    app.run()
```

---

## Code Explanation & Architecture

1. **`Question` Dataclass Model**: Defines strict domain attributes and a clean helper method `get_shuffled_choices()` that combines correct answers and distractors dynamically.
2. **`random.sample` Non-Destructive Sampling**: Questions are chosen using `random.sample()`, ensuring original question bank arrays are never mutated.
3. **High-Resolution Timer**: Uses `time.perf_counter()` to measure exact user answering speed to millisecond accuracy.
4. **Decoupled Reporting Engine**: `AssessmentReportGenerator` computes proficiency grades, accuracy percentages, and topic-specific weakness breakdowns.
5. **Flashcard Study Mode**: Allows learners to review concepts without time pressure.

---

## Example Demonstration Run

```text
====================================================================
         🎓 INTERACTIVE PYTHON CERTIFICATION QUIZ ARENA
====================================================================
  Question Bank Active: 5 Loaded Questions
====================================================================

Options:
  [1] Start Timed Quiz Assessment
  [2] View Available Topics
  [3] Flashcard Study Mode
  [4] Exit Application

Enter choice (1-4): 1

Select Quiz Topic:
  [1] ALL
  [2] Control Flow
  [3] Data Structures
  [4] Functions & Scope
  [5] Python Fundamentals
  [6] Security & Standard Library
Choose Topic (1-6): 1

====================================================================
       🎯 STARTING TIMED QUIZ (5 Questions | Topic: ALL)
====================================================================

[Question #1/5] Topic: [Data Structures]
👉 What is the average time complexity of checking membership ('x in s') in a Python set?

   (A) O(log N) Logarithmic Time
   (B) O(N) Linear Time
   (C) O(1) Constant Time
   (D) O(N^2) Quadratic Time

Your Answer (A, B, C, D) or 'Q' to quit: C
✅ CORRECT! (Answered in 2.85s)
💡 Explanation: Python sets are implemented using hash tables, providing instantaneous O(1) average lookup performance.
--------------------------------------------------------------------

====================================================================
                📊 FINAL ASSESSMENT SCORECARD
====================================================================
  Final Score      : 5 / 5 (100.0%)
  Total Duration   : 14.2 seconds (Avg 2.8s / question)
  Proficiency Tier : 💎 MASTER (GRADE: A+)
--------------------------------------------------------------------
  Topic Mastery Breakdown:
   • Data Structures                 : 1/1 (100.0%)
   • Python Fundamentals             : 1/1 (100.0%)
   • Control Flow                    : 1/1 (100.0%)
   • Security & Standard Library     : 1/1 (100.0%)
   • Functions & Scope               : 1/1 (100.0%)
====================================================================
```

---

## Extension Challenges

1. **Challenge 1 (CSV Custom Bank Importer)**: Add an import option allowing educators to upload questions from CSV spreadsheets.
2. **Challenge 2 (Hard Mode Timer)**: Add a strict 15-second per-question countdown that marks the question wrong if the timer elapses.
3. **Challenge 3 (Adaptive Spaced Repetition)**: Implement the SuperMemo SM-2 algorithm to schedule questions you got wrong for review more frequently.

---

## Summary

In Project 07, you built an assessment platform:
- Implemented **Randomized Sampling without Mutation** via `random.sample`.
- Measured user latency to millisecond accuracy with **`time.perf_counter()`**.
- Designed a **Decoupled JSON Question Bank Repository**.
- Evaluated **Topic-Specific Weakness Analytics** and **Grading Scorecards**.

---

## Best Practices Checklist

- [ ] Use `dataclasses` for domain entities like `Question` and `AnswerAttempt`.
- [ ] Never mutate global question lists during random shuffling.
- [ ] Use high-precision `time.perf_counter()` for benchmarking user interactions.
- [ ] Group performance metrics by sub-category for targeted learner feedback.

---

## What's Next?

Congratulations on completing Project 07! Continue to the final capstone project in Level 1:
👉 **[Project 08 — Terminal Weather & City Forecast Client](08-weather-cli.md)** to master HTTP requests, REST API ingestion, JSON payload destructuring with `match/case`, and ASCII dashboards.
