# PYQ Pathfinder

PYQ Pathfinder is a UPSC Indian Forest Service and Civil Services exam tutor for the Botany and Agriculture optionals. It is offline-first, and its AI runs in a hybrid set-up: on the device where it can, in the cloud where it must. It is an entry for #BuildHybridAI 2026 (Firebase AI Logic).

**Live:** https://pyq-pathfinder.sites.tab.bot/

**Team:** Akshay Wagh, team lead and IFoS aspirant. Built by **Tab, an AI assistant**, which wrote the code, built the dataset and wrote the MCQs. Akshay set the goal and reviews the work.

## What it does
- **Pattern map.** 5,794 previous-year question parts (IFoS and CSE Mains, 2001 to 2025) in 49 themes, ranked by marks.
  - In Botany, 6 of 20 themes carry 54% of the marks.
  - A coverage table lists every paper we have, names the gaps (IFoS Agriculture 2003, 2007 and 2008; Botany 2008), and flags the one partly reconstructed year.
- **Adaptive tutor.** 50 MCQs at levels 1 to 6, Botany and Agriculture.
  - Each MCQ is tied to the years its theme was asked.
  - Each key comes with the source it was checked against.
- **Write & check an answer.** First a local check with no AI (word count against the marks, key terms), then an AI examiner grade.
- **Hybrid AI with Firebase AI Logic** (web SDK 13.1.0, Gemini Developer API):
  - Explanations and outlines use `InferenceMode.PREFER_ON_DEVICE`, so Gemini Nano runs in Chrome when it is available.
  - Answer grading uses `InferenceMode.PREFER_IN_CLOUD`.
  - Each reply's badge comes from `response.inferenceSource`.
  - Offline grading requests queue in `localStorage` and run on reconnect.
  - App Check (reCAPTCHA) protects the cloud calls.
- **Offline-first.** A network-first service worker caches the app and the full question bank.

## Repo layout
- `site/`: the app. Plain HTML, CSS and JS; no build step.
  - `script.js`: tutor, map, search and AI routing.
  - `firebase-config.js`: the public Firebase web config and App Check site key.
  - `data/pyq.json`: the question bank as rows: exam, subject, paper, year, question no., marks, text, theme, sub-topic, reconstructed flag.
  - `data/pareto.json`: per-subject theme ranking, coverage and notes.
  - `data/mcq.json`: the MCQs, each with `asked` years and an `explain` naming its source.
- `test/site.test.js`: data-integrity and page tests. Run `node --test test/`.
- `PLAN.md`, `SUBMISSION_DRAFT.md`, `feedback_v*_*.md`: the plan, the Devpost draft, and verbatim reviewer feedback from each round.

## How the data was built
1. **Sources.** UPSC question PDFs via the Wayback Machine, iasexamportal.com, civilserviceindia.com, easybiologyclass.com, examrace.com (via the Wayback Machine) and careerindia.com. Scanned papers were OCR'd and spot-checked.
2. Every question part was split out with its marks.
3. **Classification.** Each part was classified into 49 themes (20 Botany, 29 Agriculture) and sub-topics. Botany 2014 to 2024 came from a hand-coded classification.
4. **Ranking.** Themes are ranked by total marks. The Pareto line marks the smallest set of themes carrying half of the subject's marks.
5. **Agriculture MCQ keys.** Each key was checked automatically: the key phrase must appear in the fetched text of the page cited in its explanation, and all 20 pass. Botany keys follow the IFoS 2014 to 2024 Botany paper notes. An independent human review of every key is still to do.

## Licence
MIT
