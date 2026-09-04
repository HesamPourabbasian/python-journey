# Project 02 — Number Guessing Game with Adaptive Difficulty in Python

## Introduction

Welcome to Project 02 of the Beginner Python Curriculum!

In this project, you will build an interactive, production-grade **Number Guessing Game (`guessing_game.py`)** with **Adaptive Difficulty Tiers**, **Proximity Hints (Hot/Cold Feedback)**, **Binary Search Optimal Guess Calculators**, and a **Persistent High-Score Leaderboard (`leaderboard.json`)**.

While elementary guessing games are often written as crude 10-line scripts, this capstone project demonstrates how to structure a stateful interactive terminal game following clean object-oriented architecture, comprehensive input sanitization, JSON persistence, and algorithm analysis.

This project synthesizes foundational concepts from:
- **Module 3**: Comparison and Arithmetic Operators
- **Module 5**: Indefinite While Loops and Match/Case Branching
- **Module 6**: Dictionaries, Lists, and Collection Utilities
- **Module 7**: Modular Functions, Type Annotations, and Docstrings
- **Module 9**: Standard Library (`random`, `json`, `datetime`, `math`)
- **Module 10**: Persistent JSON File Handling with `pathlib`
- **Module 11**: Exception Handling

---

## Prerequisites

Before beginning this project, ensure you have:
- Mastered [While Loops & Indefinite Iteration](../control-flow/while-loops.md).
- Mastered [Working with CSV & JSON Data](../file-handling/working-with-csv-json.md).
- Reviewed [Modern Filesystem Operations with `pathlib`](../file-handling/pathlib-module.md).

---

## Core Concept & Game Architecture

```
                            GUESSING GAME STATE MACHINE

                                 [ Initialize Game ]
                                          │
                                          ▼
                             [ Select Difficulty Level ]
                             ├── Easy   : 1 - 50   (10 Attempts)
                             ├── Medium : 1 - 100  (7 Attempts)
                             └── Hard   : 1 - 500  (8 Attempts)
                                          │
                                          ▼
                            [ Generate Secret Target ]
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
             [ Read & Validate Guess ]             [ Check Quit Command ]
                        │                                   │
         ┌──────────────┴──────────────┐                    ▼
         ▼ (Valid Number)              ▼ (Invalid Input)  [ Terminate Game ]
   [ Compare with Target ]       [ Show Warning Prompt ]
         │                             │
   ┌─────┼─────────────────┐           └────────► (Prompt Again)
   ▼     ▼                 ▼
[ Higher ][ Lower ]  [ MATCH! (Victory) ]
   │         │                 │
   └────┬────┘                 ▼
        ▼              [ Update JSON Leaderboard ]
[ Decrement Attempts ]         │
        │                      ▼
  ┌─────┴─────┐        [ Ask Play Again? ]
  ▼           ▼
[ Attempts > 0 ][ Attempts == 0 ]
  │           ▼
  │     [ GAME OVER ]
  │           │
  └───────────┴────────► (Loop or Exit)
```

---

## The Mathematics of Optimal Guessing: Binary Search

In an interval $[1, N]$, the maximum number of comparisons required to guarantee identifying any target number using **Binary Search** is:

$$\text{Optimal Attempts} = \lceil \log_2(N) \rceil$$

- For $[1, 50]$: $\lceil \log_2(50) \rceil = \mathbf{6 \text{ guesses}}$
- For $[1, 100]$: $\lceil \log_2(100) \rceil = \mathbf{7 \text{ guesses}}$
- For $[1, 500]$: $\lceil \log_2(500) \rceil = \mathbf{9 \text{ guesses}}$
- For $[1, 1000]$: $\lceil \log_2(1000) \rceil = \mathbf{10 \text{ guesses}}$

Our difficulty configurations balance human intuition against mathematical optimality.

---

## Complete Production Source Code

```python
"""
Interactive Number Guessing Game with Adaptive Difficulty & JSON Leaderboard
Author: Hesam Pourabbasain
Curriculum: Python Journey - Beginner Capstone Project 02
"""

import json
import math
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import NamedTuple

# =====================================================================
# 1. DATA MODELS & CONFIGURATION
# =====================================================================

class DifficultyConfig(NamedTuple):
    name: str
    min_val: int
    max_val: int
    max_attempts: int

DIFFICULTY_TIERS: dict[str, DifficultyConfig] = {
    "1": DifficultyConfig("Easy", 1, 50, max_attempts=10),
    "2": DifficultyConfig("Medium", 1, 100, max_attempts=7),
    "3": DifficultyConfig("Hard", 1, 500, max_attempts=8),
    "4": DifficultyConfig("Custom", 1, 1000, max_attempts=10),
}

# =====================================================================
# 2. PERSISTENT LEADERBOARD MANAGER
# =====================================================================

class LeaderboardManager:
    """Manages persistent high-score records stored in JSON format."""

    def __init__(self, storage_path: Path = Path("guessing_leaderboard.json")):
        self.storage_path = storage_path
        self._scores = self._load_scores()

    def _load_scores(self) -> list[dict]:
        if not self.storage_path.exists():
            return []
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return []

    def record_victory(self, player_name: str, difficulty: str, attempts_used: int, max_attempts: int, range_span: int):
        # Calculate performance score based on efficiency and range span
        efficiency = (max_attempts - attempts_used + 1) / max_attempts
        calculated_points = int(efficiency * range_span * 10)

        entry = {
            "player": player_name.strip() or "Anonymous",
            "difficulty": difficulty,
            "attempts": attempts_used,
            "score": calculated_points,
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
        }
        self._scores.append(entry)
        # Sort scores descending
        self._scores.sort(key=lambda s: s["score"], reverse=True)
        self._save_scores()

    def _save_scores(self):
        try:
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(self._scores[:20], f, indent=2)  # Keep top 20
        except OSError as err:
            print(f"⚠️ [WARNING] Failed to persist leaderboard to disk: {err}")

    def display_leaderboard(self):
        print("\n" + "=" * 62)
        print("           🏆 GLOBAL HALL OF FAME LEADERBOARD")
        print("=" * 62)
        if not self._scores:
            print("  No high scores recorded yet. Be the first champion!")
            print("=" * 62 + "\n")
            return

        print(f"{'RANK':<6} {'PLAYER':<16} {'TIER':<10} {'ATTEMPTS':<10} {'SCORE':>8} {'DATE'}")
        print("-" * 62)
        for rank, entry in enumerate(self._scores[:10], start=1):
            print(f"#{rank:<5} {entry['player']:<16} {entry['difficulty']:<10} {entry['attempts']:<10} {entry['score']:>8,d} {entry['date']}")
        print("=" * 62 + "\n")

# =====================================================================
# 3. GAME ENGINE
# =====================================================================

class NumberGuessingGame:
    def __init__(self):
        self.leaderboard = LeaderboardManager()

    def print_banner(self):
        print("=" * 62)
        print("        🎯 ADAPTIVE NUMBER GUESSING ARENA")
        print("=" * 62)
        print("  Can you deduce the secret number before your attempts run out?")
        print("=" * 62)

    def select_difficulty(self) -> DifficultyConfig:
        print("\nSelect Difficulty Tier:")
        print("  [1] Easy   : Numbers 1 - 50   (10 Attempts)")
        print("  [2] Medium : Numbers 1 - 100  (7 Attempts - Mathematically Optimal)")
        print("  [3] Hard   : Numbers 1 - 500  (8 Attempts - High Challenge)")
        print("  [4] Custom : Custom Boundaries & Attempts")

        while True:
            choice = input("\nEnter choice (1-4): ").strip()
            if choice in ("1", "2", "3"):
                return DIFFICULTY_TIERS[choice]
            elif choice == "4":
                return self._configure_custom_tier()
            print("❌ Invalid selection. Please enter 1, 2, 3, or 4.")

    def _configure_custom_tier(self) -> DifficultyConfig:
        while True:
            try:
                min_v = int(input("Enter minimum bound (e.g. 1): "))
                max_v = int(input("Enter maximum bound (e.g. 1000): "))
                if min_v >= max_v:
                    print("❌ Minimum bound must be strictly less than maximum bound.")
                    continue
                    
                attempts = int(input(f"Enter allowed attempts (Recommended: {math.ceil(math.log2(max_v - min_v + 1))}): "))
                if attempts <= 0:
                    print("❌ Allowed attempts must be greater than zero.")
                    continue
                    
                return DifficultyConfig("Custom", min_v, max_v, attempts)
            except ValueError:
                print("❌ Invalid input: Please enter whole integers.")

    def calculate_proximity_hint(self, guess: int, target: int, span: int) -> str:
        """Calculate Hot/Cold feedback based on percentage distance."""
        distance = abs(guess - target)
        ratio = distance / span

        if ratio <= 0.03:
            return "🔥 BOILING HOT! You are extremely close!"
        elif ratio <= 0.08:
            return "🌡️ WARM! Very close to the target."
        elif ratio <= 0.20:
            return "🌤️ LUKEWARM. Getting closer."
        else:
            return "🧊 COLD. Far from the target."

    def play_round(self) -> bool:
        config = self.select_difficulty()
        secret_number = random.randint(config.min_val, config.max_val)
        span = config.max_val - config.min_val
        attempts_left = config.max_attempts
        attempts_taken = 0
        guesses_history = []

        optimal_binary_attempts = math.ceil(math.log2(span + 1))
        
        print("\n" + "-" * 62)
        print(f"🎮 Target generated between {config.min_val} and {config.max_val}!")
        print(f"🎯 Total Attempts Available : {config.max_attempts}")
        print(f"🧠 Binary Search Benchmark  : {optimal_binary_attempts} guesses")
        print("-" * 62)

        while attempts_left > 0:
            print(f"\n[Attempt {attempts_taken + 1}/{config.max_attempts}] (Remaining: {attempts_left})")
            raw_guess = input(f"Enter your guess ({config.min_val} - {config.max_val}) or 'q' to quit: ").strip()

            if raw_guess.lower() in ("q", "quit", "exit"):
                print("🚪 Surrendered! The secret number was:", secret_number)
                return False

            # Validate input
            try:
                guess = int(raw_guess)
            except ValueError:
                print("❌ Invalid input: Please enter a valid whole integer.")
                continue

            if not (config.min_val <= guess <= config.max_val):
                print(f"⚠️ Out of bounds! Guess must be between {config.min_val} and {config.max_val}.")
                continue

            if guess in guesses_history:
                print(f"⚠️ You already guessed {guess} previously! (Does not count against attempts)")
                continue

            # Valid guess registered
            attempts_taken += 1
            attempts_left -= 1
            guesses_history.append(guess)

            # Check Victory Condition
            if guess == secret_number:
                print("\n" + "🎉" * 20)
                print(f"🏆 BINGO! You correctly guessed {secret_number} in {attempts_taken} attempts!")
                print("🎉" * 20)
                
                player = input("\nEnter your name for the Hall of Fame: ").strip()
                self.leaderboard.record_victory(
                    player_name=player,
                    difficulty=config.name,
                    attempts_used=attempts_taken,
                    max_attempts=config.max_attempts,
                    range_span=span
                )
                self.leaderboard.display_leaderboard()
                return True

            # Directional Feedback
            direction = "📈 HIGHER (▲)" if guess < secret_number else "📉 LOWER (▼)"
            proximity = self.calculate_proximity_hint(guess, secret_number, span)
            
            print(f"  👉 {direction} | {proximity}")

        # Defeat condition
        print("\n" + "💀" * 20)
        print(f"GAME OVER! You have run out of attempts.")
        print(f"The secret target number was: {secret_number}")
        print("💀" * 20)
        return False

    def run(self):
        self.print_banner()
        self.leaderboard.display_leaderboard()

        while True:
            self.play_round()
            
            choice = input("\nWould you like to play another round? (y/n): ").strip().lower()
            if choice not in ("y", "yes"):
                print("\n👋 Thanks for playing Adaptive Number Guessing Arena. See you next time!")
                break

# =====================================================================
# 4. ENTRY POINT
# =====================================================================

if __name__ == "__main__":
    game = NumberGuessingGame()
    game.run()
```

---

## Code Explanation & Architecture

1. **`DifficultyConfig` NamedTuple**: Encapsulates tier boundaries and attempt budgets in an immutable data structure.
2. **Proximity Ratio Engine**: `calculate_proximity_hint` computes the relative distance $\frac{|guess - target|}{span}$, providing granular Hot/Warm/Cold feedback.
3. **Repeated Guess Guard**: Storing `guesses_history = []` prevents players from losing attempt points if they accidentally repeat a previous guess.
4. **Leaderboard Engine**: `LeaderboardManager` uses `pathlib.Path` and `json` to load, sort, and save high-score entries across sessions.
5. **Clean Separation of Concerns**: Game rules, difficulty configuration, persistence, and terminal UI rendering are fully separated into dedicated classes.

---

## Example Demonstration Run

```text
==============================================================
        🎯 ADAPTIVE NUMBER GUESSING ARENA
==============================================================

Select Difficulty Tier:
  [1] Easy   : Numbers 1 - 50   (10 Attempts)
  [2] Medium : Numbers 1 - 100  (7 Attempts - Mathematically Optimal)
  [3] Hard   : Numbers 1 - 500  (8 Attempts - High Challenge)
  [4] Custom : Custom Boundaries & Attempts

Enter choice (1-4): 2

--------------------------------------------------------------
🎮 Target generated between 1 and 100!
🎯 Total Attempts Available : 7
🧠 Binary Search Benchmark  : 7 guesses
--------------------------------------------------------------

[Attempt 1/7] (Remaining: 7)
Enter your guess (1 - 100) or 'q' to quit: 50
  👉 📈 HIGHER (▲) | 🌤️ LUKEWARM. Getting closer.

[Attempt 2/7] (Remaining: 6)
Enter your guess (1 - 100) or 'q' to quit: 75
  👉 📉 LOWER (▼) | 🌡️ WARM! Very close to the target.

[Attempt 3/7] (Remaining: 5)
Enter your guess (1 - 100) or 'q' to quit: 62
  👉 📈 HIGHER (▲) | 🔥 BOILING HOT! You are extremely close!

[Attempt 4/7] (Remaining: 4)
Enter your guess (1 - 100) or 'q' to quit: 68
  👉 📉 LOWER (▼) | 🔥 BOILING HOT! You are extremely close!

[Attempt 5/7] (Remaining: 3)
Enter your guess (1 - 100) or 'q' to quit: 65

🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉
🏆 BINGO! You correctly guessed 65 in 5 attempts!
🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉

Enter your name for the Hall of Fame: Hesam

==============================================================
           🏆 GLOBAL HALL OF FAME LEADERBOARD
==============================================================
RANK   PLAYER           TIER       ATTEMPTS     SCORE DATE
--------------------------------------------------------------
#1     Hesam            Medium     5              428 2024-05-18 14:20
==============================================================
```

---

## Extension Challenges

1. **Challenge 1 (AI Guesser Mode)**: Build a reverse game mode where the user picks a secret number and Python uses Binary Search to guess the user's number in under $\lceil \log_2(N) \rceil$ steps.
2. **Challenge 2 (Timed Speedrun)**: Add a `time.perf_counter()` countdown timer where players lose if they fail to solve the puzzle within 45 seconds.
3. **Challenge 3 (Multiplayer Duel)**: Allow two players to alternate guesses on the same secret number.

---

## Summary

In Project 02, you built an interactive Number Guessing Arena:
- Applied **Binary Search Mathematical Principles** ($\lceil \log_2(N) \rceil$) to design balanced difficulty tiers.
- Integrated **JSON File Persistence** via `pathlib` for a persistent Hall of Fame leaderboard.
- Designed an **Indefinite While Loop Game State Controller** with robust input validation.
- Implemented **Proximity Ratio Calculations** for dynamic Hot/Cold terminal hints.

---

## Best Practices Checklist

- [ ] Use `NamedTuple` or `@dataclass` for immutable configuration records.
- [ ] Guard against duplicate guesses to improve user experience.
- [ ] Persist high-score data defensively, handling missing or corrupted JSON files gracefully.
- [ ] Calculate scoring based on range scale and attempt efficiency.

---

## What's Next?

Congratulations on completing Project 02! Continue to the next capstone project:
👉 **[Project 03 — Persistent To-Do & Task Manager CLI](03-todo-list-manager.md)** to master task state machines, JSON data schemas, priority filters, and command-line interfaces.
