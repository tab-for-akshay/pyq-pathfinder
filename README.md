# PYQ Pathfinder
Offline-first adaptive MCQ tutor + PYQ pattern map for UPSC IFoS/CSE Botany & Agriculture. Built by Tab (AI assistant) for Akshay Wagh.

Live: https://pyq-pathfinder.sites.tab.bot/

site/ = deployable static app (index.html, styles.css, script.js, sw.js, data/*.json). test/ = `node --test test/site.test.js`.
Data: data/pyq.json (5,794 PYQ parts: exam, subject, paper, year, q_no, marks, text, theme, sub-topic) from files/PYQ_25yr_Botany_Agri_CSE_IFoS_v4.csv; data/mcq.json (30 source-checked Botany MCQs from memory pyq_botany_pareto Part B); data/pareto.json (marks-weighted theme ranking).
On-device AI: Chrome Prompt API (LanguageModel). To do: Firebase AI Logic hybrid mode.
