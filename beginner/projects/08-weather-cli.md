# Project 08 — Terminal Weather & City Forecast Client in Python

## Introduction

Welcome to the grand finale of **Level 1: Beginner Python Curriculum**!

In modern software development, integrating with third-party web services and RESTful APIs is an essential daily skill. In this final capstone project, you will build a production-grade **Terminal Weather & City Forecast Client (`weather_cli.py`)**.

This project implements an **HTTP REST Client** using Python's standard library **`urllib.request`**, connects to live weather data endpoints (such as Open-Meteo and wttr.in), parses nested JSON payloads using **Structural Pattern Matching (`match/case`)**, manages a local **TTL (Time-To-Live) Cache** to prevent API rate-limit throttling, converts temperature units (Celsius $\leftrightarrow$ Fahrenheit $\leftrightarrow$ Kelvin), and renders beautiful **ASCII Weather Dashboards**.

This project unifies concepts from across the entire Beginner Curriculum:
- **Module 2 & 3**: Data Types, Operators, and Mathematical Unit Conversions
- **Module 4**: String Formatting, Alignment, and ASCII Graphic Layouts
- **Module 5**: Control Flow and Python 3.10+ Pattern Matching
- **Module 6**: Dictionaries, Lists, and Collection Utilities
- **Module 7**: Modular Functions, Type Annotations, and Scope
- **Module 9**: Standard Library (`urllib.request`, `urllib.parse`, `json`, `datetime`)
- **Module 10**: Persistent JSON File Caching and Context Managers
- **Module 11**: Multi-Tiered Exception Handling and Network Resilience

---

## Prerequisites

Before beginning this project, ensure you have:
- Mastered [Working with CSV & JSON Data](../file-handling/working-with-csv-json.md).
- Mastered [Try, Except, Else & Finally](../exceptions/try-except-finally.md).
- Mastered [Structural Pattern Matching](../control-flow/match-case.md).

---

## Core Concept & Architecture

```
                            WEATHER CLI DATAFLOW & ARCHITECTURE

       ┌────────────────────────────────────────────────────────┐
       │             [ USER ENTERS CITY / COMMAND ]             │
       │   weather London | forecast Tokyo | cache | units      │
       └──────────────────────────┬─────────────────────────────┘
                                  │
                                  ▼
                 ┌───────────────────────────────┐
                 │     Local TTLCacheManager     │
                 │   • Is query < 15 mins old?   │
                 └───────┬───────────────┬───────┘
                         │ (Cache Hit)   │ (Cache Miss / Expired)
                         ▼               ▼
                   [ Use Cache ]   ┌───────────────────────────────┐
                         │         │      Live HTTP REST Client    │
                         │         │   • Geocoding Coordinates     │
                         │         │   • Fetch Current + Forecast  │
                         │         └───────────────┬───────────────┘
                         │                         │
                         └───────────────┬─────────┘
                                         │
                                         ▼
                         ┌───────────────────────────────┐
                         │      ASCII Weather Renderer   │
                         │   • Dynamic Weather Glyphs    │
                         │   • Temperature Unit Converter│
                         │   • 3-Day Forecast Cards      │
                         └───────────────────────────────┘
```

---

## Complete Production Source Code

```python
"""
Terminal Weather & City Forecast Client
Author: Hesam Pourabbasain
Curriculum: Python Journey - Beginner Capstone Project 08
"""

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# =====================================================================
# 1. DOMAIN DATA MODELS & ASCII ART
# =====================================================================

WEATHER_ASCII_ART = {
    "SUNNY": [
        r"    \   /    ",
        r"     .-.     ",
        r"  ― (   ) ―  ",
        r"     `-’     ",
        r"    /   \    ",
    ],
    "CLOUDY": [
        r"             ",
        r"     .--.    ",
        r"  .-(    ).  ",
        r" (___.__)__) ",
        r"             ",
    ],
    "RAINY": [
        r"     .-.     ",
        r"    (   ).   ",
        r"   (___(__)  ",
        r"    ‘ ‘ ‘ ‘  ",
        r"   ‘ ‘ ‘ ‘   ",
    ],
    "SNOWY": [
        r"     .-.     ",
        r"    (   ).   ",
        r"   (___(__)  ",
        r"    * * * *  ",
        r"   * * * *   ",
    ],
    "THUNDER": [
        r"     .-.     ",
        r"    (   ).   ",
        r"   (___(__)  ",
        r"    ⚡ / ⚡ / ",
        r"      /   /  ",
    ]
}

@dataclass
class WeatherObservation:
    city: str
    country: str
    temp_c: float
    humidity: int
    wind_kmh: float
    condition: str
    forecast_days: list[dict]
    timestamp: float

# =====================================================================
# 2. LOCAL TTL CACHE MANAGER
# =====================================================================

class WeatherCacheManager:
    """Caches API queries locally in JSON format to prevent excessive network calls."""

    def __init__(self, cache_file: Path = Path("weather_cache.json"), ttl_seconds: int = 900):
        self.cache_file = cache_file
        self.ttl = ttl_seconds
        self._cache = self._load()

    def _load(self) -> dict:
        if not self.cache_file.exists():
            return {}
        try:
            with open(self.cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (OSError, json.JSONDecodeError):
            return {}

    def get_cached(self, city: str) -> dict | None:
        key = city.strip().lower()
        if key in self._cache:
            entry = self._cache[key]
            if (time.time() - entry["timestamp"]) < self.ttl:
                return entry["data"]
        return None

    def store(self, city: str, data: dict):
        key = city.strip().lower()
        self._cache[key] = {
            "timestamp": time.time(),
            "data": data
        }
        try:
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(self._cache, f, indent=2)
        except OSError:
            pass

# =====================================================================
# 3. HTTP REST API CLIENT & FALLBACK ENGINE
# =====================================================================

class WeatherAPIClient:
    GEO_URL = "https://geocoding-api.open-meteo.com/v1/search"
    WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

    def __init__(self):
        self.cache = WeatherCacheManager()

    def fetch_weather(self, city_name: str) -> WeatherObservation:
        # Check Local Cache First
        cached_data = self.cache.get_cached(city_name)
        if cached_data:
            return self._deserialize_observation(cached_data)

        # Query Live Public Open-Meteo REST API
        try:
            obs = self._query_live_api(city_name)
            # Store in Cache
            self.cache.store(city_name, self._serialize_observation(obs))
            return obs
        except (urllib.error.URLError, TimeoutError, KeyError) as net_err:
            print(f"⚠️ [NETWORK FALLBACK] Live network query failed ({net_err}). Engaging offline simulation...")
            return self._simulate_fallback(city_name)

    def _query_live_api(self, city_name: str) -> WeatherObservation:
        # 1. Geocode City -> (Latitude, Longitude)
        geo_params = urllib.parse.urlencode({"name": city_name, "count": 1, "language": "en", "format": "json"})
        req = urllib.request.Request(f"{self.GEO_URL}?{geo_params}", headers={"User-Agent": "PythonJourneyWeather/1.0"})
        
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            geo_payload = json.loads(resp.read().decode("utf-8"))

        if not geo_payload.get("results"):
            raise ValueError(f"City '{city_name}' could not be located in global geocoding index.")

        top_match = geo_payload["results"][0]
        lat, lon = top_match["latitude"], top_match["longitude"]
        resolved_city = top_match["name"]
        country = top_match.get("country", "Unknown")

        # 2. Fetch Weather Metrics
        weather_params = urllib.parse.urlencode({
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min",
            "timezone": "auto"
        })
        w_req = urllib.request.Request(f"{self.WEATHER_URL}?{weather_params}", headers={"User-Agent": "PythonJourneyWeather/1.0"})

        with urllib.request.urlopen(w_req, timeout=5.0) as w_resp:
            w_payload = json.loads(w_resp.read().decode("utf-8"))

        current = w_payload["current"]
        daily = w_payload["daily"]

        # Parse WMO Weather Code
        wmo_code = current.get("weather_code", 0)
        condition = self._interpret_wmo_code(wmo_code)

        # Build 3-day forecast
        forecast_days = []
        for i in range(min(3, len(daily["time"]))):
            forecast_days.append({
                "date": daily["time"][i],
                "max_c": daily["temperature_2m_max"][i],
                "min_c": daily["temperature_2m_min"][i],
                "condition": self._interpret_wmo_code(daily["weather_code"][i])
            })

        return WeatherObservation(
            city=resolved_city,
            country=country,
            temp_c=current["temperature_2m"],
            humidity=current["relative_humidity_2m"],
            wind_kmh=current["wind_speed_10m"],
            condition=condition,
            forecast_days=forecast_days,
            timestamp=time.time()
        )

    @staticmethod
    def _interpret_wmo_code(code: int) -> str:
        """Decode WMO Weather Interpretation Codes using Pattern Matching."""
        match code:
            case 0 | 1: return "SUNNY"
            case 2 | 3 | 45 | 48: return "CLOUDY"
            case 51 | 53 | 55 | 61 | 63 | 65 | 80 | 81 | 82: return "RAINY"
            case 71 | 73 | 75 | 77 | 85 | 86: return "SNOWY"
            case 95 | 96 | 99: return "THUNDER"
            case _: return "CLOUDY"

    @staticmethod
    def _simulate_fallback(city_name: str) -> WeatherObservation:
        """Offline simulation when Internet connection is down."""
        return WeatherObservation(
            city=city_name.strip().title(),
            country="Simulation Sandbox",
            temp_c=22.5,
            humidity=55,
            wind_kmh=14.2,
            condition="SUNNY",
            forecast_days=[
                {"date": "Tomorrow", "max_c": 24.0, "min_c": 16.0, "condition": "SUNNY"},
                {"date": "Day After", "max_c": 21.0, "min_c": 15.0, "condition": "RAINY"},
                {"date": "In 3 Days", "max_c": 19.0, "min_c": 13.0, "condition": "CLOUDY"},
            ],
            timestamp=time.time()
        )

    @staticmethod
    def _serialize_observation(obs: WeatherObservation) -> dict:
        return {
            "city": obs.city,
            "country": obs.country,
            "temp_c": obs.temp_c,
            "humidity": obs.humidity,
            "wind_kmh": obs.wind_kmh,
            "condition": obs.condition,
            "forecast_days": obs.forecast_days,
            "timestamp": obs.timestamp
        }

    @staticmethod
    def _deserialize_observation(d: dict) -> WeatherObservation:
        return WeatherObservation(
            city=d["city"],
            country=d["country"],
            temp_c=d["temp_c"],
            humidity=d["humidity"],
            wind_kmh=d["wind_kmh"],
            condition=d["condition"],
            forecast_days=d["forecast_days"],
            timestamp=d["timestamp"]
        )

# =====================================================================
# 4. ASCII WEATHER DASHBOARD RENDERER
# =====================================================================

class ASCIIWeatherRenderer:
    @staticmethod
    def format_temp(temp_c: float, unit: str) -> str:
        match unit.upper():
            case "F": return f"{(temp_c * 9/5) + 32:.1f}°F"
            case "K": return f"{temp_c + 273.15:.1f} K"
            case _:   return f"{temp_c:.1f}°C"

    @classmethod
    def render_dashboard(cls, obs: WeatherObservation, unit: str = "C"):
        art_lines = WEATHER_ASCII_ART.get(obs.condition, WEATHER_ASCII_ART["CLOUDY"])
        temp_str = cls.format_temp(obs.temp_c, unit)

        print("\n" + "=" * 68)
        print(f"       📍 WEATHER REPORT: {obs.city.upper()}, {obs.country.upper()}")
        print("=" * 68)

        # Merge ASCII Art with Telemetry Stats
        info_lines = [
            f"  Condition  : {obs.condition}",
            f"  Temperature: {temp_str}",
            f"  Humidity   : {obs.humidity}%",
            f"  Wind Speed : {obs.wind_kmh:.1f} km/h",
            f"  Cached At  : {datetime.fromtimestamp(obs.timestamp, tz=timezone.utc).strftime('%H:%M:%S UTC')}"
        ]

        for art, info in zip(art_lines, info_lines):
            print(f"  {art:<18} │ {info}")

        print("-" * 68)
        print("  📅 3-DAY EXTENDED FORECAST:")
        print("-" * 68)
        for f in obs.forecast_days:
            max_t = cls.format_temp(f["max_c"], unit)
            min_t = cls.format_temp(f["min_c"], unit)
            print(f"   • {f['date']:<12} : {f['condition']:<10} │ High: {max_t:>8} │ Low: {min_t:>8}")
        print("=" * 68 + "\n")

# =====================================================================
# 5. INTERACTIVE CLI SHELL
# =====================================================================

class WeatherCLI:
    def __init__(self):
        self.client = WeatherAPIClient()
        self.active_unit = "C"

    def print_banner(self):
        print("=" * 68)
        print("           🌦️ TERMINAL WEATHER & FORECAST CLIENT")
        print("=" * 68)
        print("  Commands:")
        print("    weather <city>           (Get current weather & forecast)")
        print("    units <C | F | K>        (Change temperature unit)")
        print("    exit | quit | q          (Exit)")
        print("=" * 68)

    def run(self):
        self.print_banner()

        while True:
            try:
                raw_input = input(f"weather [{self.active_unit}] > ").strip()
                if not raw_input:
                    continue

                tokens = raw_input.split()
                cmd = tokens[0].lower()

                match cmd:
                    case "exit" | "quit" | "q":
                        print("👋 Weather terminal session closed. Stay safe!")
                        break

                    case "units":
                        if len(tokens) < 2 or tokens[1].upper() not in ("C", "F", "K"):
                            print("❌ Usage: units <C | F | K>")
                            continue
                        self.active_unit = tokens[1].upper()
                        print(f"🌡️ Temperature unit changed to: °{self.active_unit}")

                    case "weather" | "get":
                        if len(tokens) < 2:
                            print("❌ Usage: weather <city_name>")
                            continue
                        city = " ".join(tokens[1:])
                        print(f"🔍 Contacting satellite network for '{city}'...")
                        obs = self.client.fetch_weather(city)
                        ASCIIWeatherRenderer.render_dashboard(obs, unit=self.active_unit)

                    case _:
                        # If user typed just city name directly (e.g., "London")
                        city = raw_input
                        print(f"🔍 Contacting satellite network for '{city}'...")
                        obs = self.client.fetch_weather(city)
                        ASCIIWeatherRenderer.render_dashboard(obs, unit=self.active_unit)

            except ValueError as val_err:
                print(f"⚠️ [LOOKUP ERROR] {val_err}")
            except KeyboardInterrupt:
                print("\n\nSession terminated by user.")
                break

# =====================================================================
# 6. ENTRY POINT
# =====================================================================

if __name__ == "__main__":
    app = WeatherCLI()
    app.run()
```

---

## Code Explanation & Architecture

1. **Standard Library `urllib.request` Integration**: Queries live REST APIs (`Open-Meteo Geocoding and Forecast API`) using pure Python standard library modules without requiring `pip install requests`.
2. **Structural Pattern Matching**: Uses `match/case` to map integer WMO weather codes (0-99) to clean semantic categories (`SUNNY`, `RAINY`, `THUNDER`).
3. **Local TTL File Cache**: `WeatherCacheManager` caches API results for 15 minutes (`ttl_seconds=900`) in `weather_cache.json`, preventing redundant network calls and respecting third-party rate limits.
4. **Resilient Offline Fallback**: If the user has no internet connection, the client seamlessly catches `urllib.error.URLError` and renders simulated sandbox telemetry without crashing.
5. **ASCII Terminal Dashboard**: Visualizes weather condition glyphs side-by-side with telemetry statistics using formatted fixed-width column strings.

---

## Example Demonstration Run

```text
====================================================================
           🌦️ TERMINAL WEATHER & FORECAST CLIENT
====================================================================
  Commands:
    weather <city>           (Get current weather & forecast)
    units <C | F | K>        (Change temperature unit)
    exit | quit | q          (Exit)
====================================================================

weather [C] > Tokyo
🔍 Contacting satellite network for 'Tokyo'...

====================================================================
       📍 WEATHER REPORT: TOKYO, JAPAN
====================================================================
      \   /          │   Condition  : SUNNY
       .-.           │   Temperature: 21.4°C
    ― (   ) ―        │   Humidity   : 48%
       `-’           │   Wind Speed : 12.6 km/h
      /   \          │   Cached At  : 14:30:15 UTC
--------------------------------------------------------------------
  📅 3-DAY EXTENDED FORECAST:
--------------------------------------------------------------------
   • 2024-05-19   : SUNNY      │ High:    24.2°C │ Low:    16.1°C
   • 2024-05-20   : CLOUDY     │ High:    22.0°C │ Low:    15.5°C
   • 2024-05-21   : RAINY      │ High:    19.8°C │ Low:    14.0°C
====================================================================

weather [C] > units F
🌡️ Temperature unit changed to: °F

weather [F] > London
🔍 Contacting satellite network for 'London'...

====================================================================
       📍 WEATHER REPORT: LONDON, UNITED KINGDOM
====================================================================
       .-.           │   Condition  : RAINY
      (   ).         │   Temperature: 62.6°F
     (___(__)        │   Humidity   : 78%
      ‘ ‘ ‘ ‘        │   Wind Speed : 18.2 km/h
     ‘ ‘ ‘ ‘         │   Cached At  : 14:31:02 UTC
--------------------------------------------------------------------
  📅 3-DAY EXTENDED FORECAST:
--------------------------------------------------------------------
   • 2024-05-19   : RAINY      │ High:     66.2°F │ Low:     51.8°F
   • 2024-05-20   : CLOUDY     │ High:     64.4°F │ Low:     50.0°F
   • 2024-05-21   : SUNNY      │ High:     69.8°F │ Low:     53.6°F
====================================================================
```

---

## Extension Challenges

1. **Challenge 1 (Hourly Forecast Graphs)**: Render a 24-hour temperature trend graph using Unicode sparkline blocks (` ▂▃▄▅▆▇█`).
2. **Challenge 2 (Favorite Cities Registry)**: Add a `pin <city>` command that saves favorite cities to a persistent watchlist.
3. **Challenge 3 (Weather Alert Notifications)**: Trigger terminal bell alerts (`\a`) if wind speed exceeds 50 km/h or severe thunder is forecasted.

---

## Summary

In Project 08, you completed the final capstone of the Beginner Curriculum:
- Ingested live REST API data using standard library **`urllib.request` and `json`**.
- Implemented **Structural Pattern Matching (`match/case`)** to decode meteorological codes.
- Engineered a **Local TTL Cache** to optimize bandwidth and network latency.
- Rendered **ASCII Weather Art Dashboards** with multi-unit temperature conversions.

---

## Best Practices Checklist

- [ ] Use `urllib.parse.urlencode` to construct URL query strings safely.
- [ ] Set explicit network socket timeouts (`timeout=5.0`) on all HTTP requests.
- [ ] Cache API queries locally with TTL expiration to prevent rate-limit throttling.
- [ ] Provide graceful offline fallbacks when network connections fail.

---

## 🏆 LEVEL 1: BEGINNER CURRICULUM COMPLETE!

Congratulations! You have completed all 12 modules and 8 capstone projects of **Level 1: Beginner Python Curriculum**.

You now possess deep, production-level foundations across:
1. Python Fundamentals & Virtual Environments
2. Dynamic Typing, Data Types & Mutability
3. Operators & Truthiness
4. Strings & Unicode Architecture
5. Control Flow & Pattern Matching
6. Built-in Collections (Lists, Tuples, Dicts, Sets)
7. Functions, Parameters, Closures & Scoping
8. List, Dict & Set Comprehensions
9. Modules, Packages & Standard Library
10. File Handling, Context Managers & Pathlib
11. Exception Hierarchies & Translation
12. End-to-End Object-Oriented Software Architecture

### What's Next?
You are now ready to advance to **Level 2: Intermediate Python Curriculum**:
👉 **[Level 2: Intermediate Python Curriculum Overview](../../intermediate/README.md)**
