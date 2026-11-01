# PYQ Pathfinder — project plan (#BuildHybridAI 2026)

Hackathon: #BuildHybridAI 2026 (Google, Firebase AI Logic) · https://firebasehybridaihackathon.devpost.com/
Submissions open Mon 9 Nov 2026, close Mon 30 Nov 2026 2:00 PM PT · $10,000 cash · adults, all countries (standard exceptions) · solo or team.
Full rules, judging criteria and submission requirements are published on 9 Nov: re-check them before building further.
Team: Akshay Wagh (team lead, entrant/Representative) + Tab (AI assistant, builder). Registered on Devpost as tab-for-akshay (registration only).

## Problem
UPSC IFoS / CSE aspirants with Botany and Agriculture optionals face 25 years of previous-year questions (5,794 parts across both exams) and no quick way to see which themes actually carry the marks. Most practise blindly, online, on paid apps; many study in hostels and small towns with patchy data.

## Solution
An offline-first web app (PWA) with three parts:
1. Pattern map: every PYQ classified into 49 themes and ranked by marks (Botany: six themes = 54% of marks).
2. Adaptive MCQ tutor: questions anchored to real PYQ years, each answer key checked against a cited source; level goes up one per right answer (1 recall to 6 exam-hard); wrong answers keep the level and bring that theme back sooner; readiness score weighted by each theme's share of marks.
3. Hybrid AI: "Explain deeper" and "Outline an answer" run ON DEVICE (Gemini Nano in Chrome) when available, so they are private, free and work offline; cloud Gemini via Firebase AI Logic as the fallback when the device can't. The verified key is always ground truth; AI text is labelled unchecked.

## Tech
Vanilla HTML/CSS/JS, service worker (offline), localStorage progress, JSON data built in Python from Tab's PYQ dataset. MVP uses Chrome's built-in Prompt API directly. Hackathon build: swap to Firebase AI Logic hybrid inference (getGenerativeModel with mode PREFER_ON_DEVICE, cloud model fallback) — needs a Firebase project on Tab's Google account (free tier).

## MVP status (1 Nov 2026)
Live demo: https://pyq-pathfinder.sites.tab.bot/ · code: /home/user/tab/files/hackathons/pyq-pathfinder/ · tests: 3/3 pass (node --test).
Done: pattern map (Botany + Agriculture), PYQ search across 5,794 questions, adaptive tutor with 30 verified Botany MCQs (levels 1–6, 6 themes), offline caching, on-device AI hooks.
Not yet: Firebase AI Logic wiring (no Firebase project yet); Agriculture and Forestry MCQ pools; demo video; public repo (Tab's GitHub not available yet). The on-device AI path is coded but was not exercised end-to-end (the test browser has no Gemini Nano).

## Plan to submission (Nov 9–30)
- Nov 9: read official rules/criteria; adjust scope. Create Firebase project; wire Firebase AI Logic hybrid mode.
- Nov 10–20: add Agriculture (Paper I/II top themes) and Forestry/GK MCQ pools (each key source-checked); spaced-repetition queue; Hindi UI toggle.
- Nov 21–26: test on Chrome desktop + Android; record 2–3 min demo video; README.
- Nov 28–30 (after Akshay's exams): Akshay reviews, uploads video, and submits as Representative.

## Demo script (video, ~2.5 min)
1. Pattern map: Botany, six gold themes = half the marks; open "most repeated sub-topics".
2. Practice: answer two questions (one wrong), level stays, theme flagged weak; readiness updates.
3. Turn on airplane mode: app still works; tap "Explain deeper": on-device answer appears.
4. PYQ search "photorespiration": 48 hits across 25 years; "Outline an answer" on device.
5. Close: built by Tab, an AI assistant, for Akshay Wagh.
