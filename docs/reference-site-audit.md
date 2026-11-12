# Reference-site feature audit

Reference: https://2103.marcus-ma.com/

Inspection date: 12 November 2026

Method: authenticated exploration through the T3 Code browser, using rendered pages and existing answer history. Narrow and desktop layouts were inspected. This is a behavioural inventory, not an accessibility certification or an implementation audit.

## Evidence boundaries

- **Observed** means the interface or existing saved result was visible during inspection.
- **Described** means the site says the behaviour exists, but its full lifecycle was not exercised.
- **Unverified** means this inspection cannot establish it. Absence from inspected pages does not prove absence from the whole product.
- No application source code, prompts, question-bank export, database, or internal algorithms were inspected or copied. The accompanying specification uses original wording and generalised behaviours.
- No new quiz answers, explanation submissions, flashcard ratings, notes, or study-plan changes were saved. Opening `/drill` created a resumable eight-item session; it remains unanswered. A flashcard round was opened and an answer revealed without submitting a rating. The browser was returned to Today and left available for the user.
- Existing personal notes, account identifiers, answer prose, and other students' identities are deliberately omitted from this record.

## R01 — Global navigation and account

**Observed:** Today (`/`), Drill (`/drill`), Mock exam (`/mock`), Topics (`/topics`), Flashcards (`/cards`), Explain (`/explain`), Mistakes (`/mistakes`), and Notes (`/notes`). Desktop uses a horizontal navigation bar; the narrow view has a Menu button. The header contains a quick-note action, account menu, and live studying indicator. Desktop also shows the final-exam date, time, and countdown. The account menu exposes Study plan (`/plan`) and Sign out. A GitHub OAuth sign-in redirect was visible in browser navigation diagnostics.

**Unverified:** other sign-in providers, account deletion/export, privacy controls for presence, exact presence refresh behaviour, and multi-module switching.

## R02 — Today dashboard

**Observed:** date and exam countdown; start/resume session action; remaining new items and time estimate; dismissible introductory explanation; first-pass coverage progress and target date; daily new-item target; planned daily time; last-session summary; weekly lucky-guess count; abbreviation-card counts; weakest areas with predicted recall and drill links; quick-note entry and recent note.

The mastery map groups topics by teaching week and colours them by subject area. Its legend distinguishes mastered, learning, at risk, unseen, lucky guesses, and groups without official questions. Topic blocks link to drills; groups lacking questions link to Explain. A Today column lists planned topic groups. Narrow layouts arrange the map differently from desktop.

**Described:** one session contains the day's work and can be stopped and resumed; missed questions and lucky guesses produce related questions later in the same session and reviews on later days; reviews prioritise exam-day risk.

**Unverified:** the numerical recall model, scheduler implementation, whether all planned coverage guarantees can be met, and the statistical validity of its forecasts.

## R03 — Drill

**Observed:** opening Drill creates or opens a session-specific URL. The question view has item progress, a topic identifier, prompt text, diagram imagery, True/False controls, a reason text area, Submit, keyboard guidance, session outcome counts, remaining items including retests, and End session early. Existing history also shows questions with multiple selectable answers. A later visit to Today displayed Resume session.

Session counters distinguish Right, Reason incomplete, Lucky guess, and Wrong. Existing marked-response views show the original question, selected answer, correctness, follow-up question, written reason, personalised feedback, a misconception statement where applicable, a general explanation, and supporting textbook excerpts with subsection identifiers.

**Important discrepancy:** introductory copy says a correct pick with a wrong or missing reason is a lucky guess and not known. The inspected current drill form instead labels the explanation optional and says to leave it blank if the student knows it. Existing historical responses include both a no-reason lucky guess and messages referring to a student being sure. These may reflect different modes or versions. No new attempt was submitted, so current scoring policy is not established.

**Unverified:** full current submit/feedback flow, other drill question types, confidence controls in other states, retry behaviour, exact targeted-drill selection, early-end summary, and cross-device persistence.

## R04 — Mock exam

**Observed setup; subsequent behaviours described by the site:** a CS2103T Part 2 simulation with 32 questions in 70 minutes. Questions are randomised, one-pass, and cannot be revisited after submission. A continuously running timer does not pause on navigation and closes the paper at zero. Each pick has a written follow-up. Reasons are marked, while the stated score counts picks, with 30 correct giving full marks. Topic mix is about 45% UML and the remainder spread across other areas; items seen within seven days are avoided. Feedback is withheld until the end, and mock items enter the review schedule.

The setup explicitly says the 20-minute hand-drawn UML Part 1 is not simulated. The mock was not started; expiry, navigation enforcement, scoring formula details, results, and history were not exercised.

## R05 — Topics and mastery

**Observed:** weekly topic-group catalogue, question counts, status filters, recall estimates for the exam date, count of days answered correctly, expandable subsection outlines, Mark as known, Explain, and Drill actions. Optional sections are listed but identified as outside testing scope.

**Described:** mastery requires correct performance on spaced-out days and at least 90% predicted exam-day recall. At risk can result from low recall or a latest miss/lucky guess. A later miss or lucky guess reverses a manual known designation.

**Unverified:** exact evidence thresholds, spaced-day intervals, per-question aggregation, and the full interaction between manual and measured knowledge.

## R06 — Flashcards

**Observed:** abbreviation-focused deck with due, new, learned, and total counts; Start round (20); expandable complete abbreviation list; a card's week, abbreviation, text entry, Show answer, contextual definition, topic reference, Knew it / Didn't controls, progress, and End round.

**Described:** typed answers are checked automatically; misses return a few cards later until learned. Scheduling intervals and equivalence checking were not exercised.

## R07 — Explain it back

**Observed:** topic selector, selected topic and subsection outline, free-text response field, and Check my explanation, initially disabled until enough text is supplied. The prompt asks the student to explain what the concept is, why it exists, how it is used, and common confusions.

**Described:** explanations are checked against the current semester's textbook. The page initially selected a weak topic; the selection policy is unverified. No explanation was submitted, so the output format, history, marking latency, and effect on mastery remain unverified.

## R08 — Mistakes and misconceptions

**Observed:** persistent answer history with All, Not fixed yet, Lucky guesses, and Wrong filters. Records include question/topic/date, original reason when supplied, corrective feedback, Show answer expansion, and fixed/unfixed status. A lucky-guess record offers I knew it. Its effect was not tested.

An open-misconception section shows a natural-language description, occurrence count, topic, drill action, and progress such as 0 of 3 or 2 of 3 correct since detection. Resolved counts are also shown. An expanded prior answer displayed personalised feedback, a noted misconception, a general Why explanation, and From the textbook excerpts with subsection references.

**Described:** later correct performance marks a mistake fixed while preserving its history. The UI suggests a three-correct recovery threshold for misconceptions, but exact resolution rules were not verified.

**Unverified:** misconception extraction/deduplication, whether citations use retrieval or preattached evidence, model/provider, marking prompts, regrade behaviour, and the effect of manual I knew it.

## R09 — Notes

**Observed:** New note, text editor, Save note, searchable note list, topic and timestamp metadata, existing-note editor, Pin to top, and Delete. The dashboard also exposes quick-note creation and the latest note.

**Described:** `/` opens quick notes globally; notes made during drilling link to that topic. Persistence behaviour while editing an existing note, pin order, deletion confirmation, and export were not exercised.

## R10 — Study plan

**Observed:** current daily-time and first-pass-completion summary; seen-question count; first-try correctness; per-question time including reading; recent daily study time; self-assessed starting level; calendar for other exams; preset and custom daily-minute budgets; comparisons of completion date and estimated exam-day recall; alternative target-date selection; Save plan and Undo changes when the form changes.

**Described:** other-exam days get no new questions and at most eight reviews. Estimates simulate days through the same scheduler used for drills, using actual answer history more strongly than self-assessment. Completing the daily plan does not prohibit extra practice.

The time options did not produce strictly increasing predicted scores in the inspected example. This is a reason to investigate forecast assumptions, not proof of a defect. The plan was inspected without saving changes.

## Scope conclusions

The visible product is a focused, single-module revision system built around retrieval practice, explanation checking, source-backed feedback, and adaptive review. Multiple modules, broad resource ingestion, Canvas integration, arbitrary exam blueprints, essay scoring, general written applied questions, handwriting marking, and content publishing were not observed. They are extensions proposed in `feature-spec.md`, not claims about the reference site's hidden capabilities.
