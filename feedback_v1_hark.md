Feedback v1 on pyq-pathfinder from Hark (hark.com, account akshay.wagh@mail.tab.bot) · saved 2026-11-01T16:04:16.311Z · 119 s
Verbatim reply (unchecked):

Bluntly, the idea is strong but the build doesn't match the pitch. The live site has no Firebase AI Logic and no cloud fallback, only Chrome's built-in Prompt API. That's the headline criterion, and right now the write-up overclaims it.

[Summary card]
PYQ Pathfinder: Judge's-Eye Review
Scores (I judged UX from the page's code and markup, not a visual run)
Hybrid inference: 2/10. It uses Chrome's LanguageModel only, with no Firebase SDK, no App Check and no cloud path. Off Chrome, the AI just disappears.
Real-world impact: 7/10. The pain is real and the audience is large and underserved, and offline-first suits it.
Technical quality: 5/10. The data pipeline and offline PWA are solid, but the tutor is thin and the cache only updates if you bump its version.
Design/UX: 5/10. It's clean and honest about what's unchecked, but you run out of practice in minutes.
Presentation: 3/10. There's no video yet, the write-up overstates, and the AI-built framing distracts.

Biggest weaknesses

The claimed hybrid (Gemini Nano plus cloud fallback through Firebase) isn't in the code. A judge who opens DevTools will see it.

The tutor has 30 MCQs, all Botany, five per level, and none for Agriculture. Readiness is weighted only by Botany's marks.

The data overclaims. "Every question UPSC actually asked" sits beside gaps: IFoS Agriculture 2003, 2007 and 2008, and Botany 2008. The CSE Agriculture 2008 rows are paraphrased topics of unclear origin, and the MCQ keys cite Wikipedia.

Nothing explains why the work is split between device and cloud, so the hybrid value is invisible.

Framing: an AI wrote it and the human "reviews", with the inspiration in the third person. Also check the Nov 9 rules on projects started before submissions open.

Week-long improvements

Wire up the Firebase AI Logic web SDK in PREFER_ON_DEVICE mode, with Gemini Flash as the cloud fallback and App Check enforced. Label every response "On device" or "Cloud".

Give the cloud a job the device can't do. Have it grade a typed or photographed written answer against marks and word limit. Do the quick explanations on-device, queue grading while offline, and send it when you're back online.

Grow the pool to about 250 MCQs: at least 20 per top theme, Agriculture included. Then weight readiness by each subject's own Pareto.

Add a coverage table by exam and year, flag paraphrased rows, and change the claim to "5,794 question parts, 2001 to 2025, gaps listed".

Make a 2.5-minute video:

Start in airplane mode and show the Pareto insight.
Answer a question, then use Explain on the device.
Switch to a phone without Nano to show the cloud fallback and its label.
Grade an answer, then go offline again.
Rewrite the inspiration in your own first-person voice.

What would win
A genuinely hybrid tutor: instant, private drilling on the device, examiner-grade answer feedback in the cloud, and a demo where flipping the network on and off visibly changes where the AI runs, not whether it works.
