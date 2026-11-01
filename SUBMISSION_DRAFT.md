# Devpost submission draft: PYQ Pathfinder (#BuildHybridAI 2026), v2

**Status: draft only, not submitted.** Submissions open 9 Nov 2026, and the final rules and requirements are published that day. This is version 2 (1 Nov 2026), revised after round-1 feedback from two AI reviewers (Fo and Hark).

**Project name:** PYQ Pathfinder

**Elevator pitch (≤200 chars):** A UPSC exam tutor that shows where 25 years of marks went, drills those themes offline, and runs AI on the device first, with Firebase cloud only for heavy grading.

## Inspiration
Akshay Wagh, our team lead, is preparing for the UPSC Indian Forest Service Mains, which run from 22 to 27 Nov 2026. His optional subjects are Botany and Agriculture. Each has 25 years of previous-year questions, and no one tells you which few themes carry most of the marks.

Akshay asked his AI assistant, Tab, to build the tool he wanted: something that shows where the marks are, drills exactly those themes, and keeps working on a weak hostel connection.

## What it does
- **Pattern map.** 5,794 previous-year question parts from IFoS and CSE Mains, 2001 to 2025, are classified into 49 themes and ranked by marks.
  - In Botany, 6 of 20 themes carry 54% of all marks.
  - A coverage table shows every paper and year we have, and names the gaps: IFoS Agriculture 2003, 2007 and 2008; Botany 2008. It also names the one partly reconstructed year.
- **Adaptive tutor.** 50 multiple-choice questions across Botany and Agriculture, at levels 1 to 6.
  - Each question is tied to the real exam years its theme was asked.
  - Each answer key is checked against a cited source page, which is shown under the answer.
  - A right answer moves you up a level. A wrong answer brings that theme back sooner.
  - A readiness score weights each theme by its share of the marks.
- **Write and check an answer.** Open any past question and write an answer.
  - The device checks it first, with no AI: word count against the marks, and which key terms you used.
  - An AI examiner then grades it out of the marks and lists gaps.
- **Hybrid AI, labelled.** Every AI reply carries a badge: "Ran on device · Gemini Nano" or "Ran in cloud · Gemini via Firebase".
  - Quick explanations and outlines use Firebase AI Logic in PREFER_ON_DEVICE mode, so they are private, free and work offline where Chrome has Gemini Nano.
  - Answer grading uses PREFER_IN_CLOUD.
  - When you are offline with no on-device model, a grading request waits in a queue and runs when you reconnect.
- **Offline-first.** After one visit, the app and the full question bank work with no network.

## How we built it
- **Data.** Tab collected the papers from UPSC PDFs (via the Wayback Machine), iasexamportal.com, civilserviceindia.com and others. In Python, Tab extracted and classified every question into themes and sub-topics, then computed marks-weighted rankings.
- **Answer keys.** Botany keys are tied to the IFoS 2014–2024 Botany paper. Agriculture keys were each checked automatically against the fetched text of the page they cite.
- **App.** Plain HTML, CSS and JavaScript, with a network-first service worker.
- **Hybrid AI.** Firebase AI Logic's web SDK (13.1.0) with the Gemini Developer API backend:
  - `getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE })` for explanations;
  - a second model in `PREFER_IN_CLOUD` mode for grading;
  - `response.inferenceSource` drives the badge.
- **Testing.** We verified the cloud path live from a Chrome with no on-device model: it answered with `in_cloud`.

## Challenges we ran into
- Old papers exist only as scans. They needed OCR plus manual checks, and some years are missing; the app says which.
- Keeping AI honest for exam prep. The model may never override a verified key, so prompts pass the key in, and the interface separates checked text from unchecked AI text.
- Picking where each task runs. Short explanations run on the device; long-answer grading goes to the cloud.

## Accomplishments that we're proud of
- A study plan backed by every question UPSC actually asked, with its gaps disclosed.
- A tutor that keeps working with zero data.

## What we learned
Hybrid only matters when users can see it. Labelling each reply with where it ran made the trade-off concrete: private and instant on the device, deeper in the cloud.

## What's next for PYQ Pathfinder
- More verified questions: Forestry, plus a 250-question Agriculture bank.
- Spaced repetition.
- A Hindi and Marathi interface.
- Firebase App Check, before any public launch.
- A small trial with other IFoS aspirants.

## Built with
javascript, html5, css3, service-worker, pwa, firebase, firebase-ai-logic, gemini, gemini-nano, chrome-built-in-ai, python, pandas

## Try it out
https://pyq-pathfinder.sites.tab.bot/
Code: GitHub link to be added.

## Video
To record: a demo of about 2.5 minutes, uploaded to YouTube by Akshay. Tab can prepare the script and the screen recording.

## Team and AI disclosure
Team lead and entrant: Akshay Wagh (India). This project was built by Tab, an AI assistant, for Akshay Wagh. Tab wrote the code, built the dataset and wrote the MCQs. Akshay set the goal and reviews the work.

Note on timing: the hackathon may require work done during the submission period (from 9 Nov). The Firebase-specific work will be extended after 9 Nov and dated in the repo history.
