# Academic Revision Platform — Feature Specification

Version: 0.1, 12 November 2026. Status: detailed product draft for discussion; no application implementation or backend/model selection yet.

Reference site: https://2103.marcus-ma.com/

Behavioural evidence: [Reference-site audit](reference-site-audit.md).

## 1. Product definition

A personal revision website that turns the student's real course materials and questions into exam-relevant practice, gives evidence-backed feedback, and schedules future practice around demonstrated weaknesses and upcoming exams. The first modules are NUS ST2132 and CS2100. Initial content is imported real questions; AI-generated practice comes later. Personal use is the first release, with ownership and sharing boundaries designed from the beginning.

The defining study loop is: choose a realistic task, attempt it independently, receive a justified mark and useful correction, revisit the underlying weakness, and test it again after a delay. A good MCQ score must not stand in for evidence that the student can produce a proof, solve a statistical problem, write MIPS, or design a circuit.

### 1.1 Confirmed requirements

- ST2132 finals involve roughly four to five multipart proof/applied written questions, including hypothesis testing, maximum likelihood estimation, and Fisher information.
- CS2100 involves short applied answers, MIPS coding, circuit design, and MCQs.
- Start with real imported questions. Add AI-generated questions after the import, practice, and marking workflows are useful.
- Sources may include sample questions, Canvas quizzes, past papers, tutorials, recitations, lecture notes, and textbooks.
- Use source retrieval to support marking; feedback must connect to the module's materials.
- Host the frontend on Cloudflare Pages. Consider growth to other students without charging for access.
- Develop the feature specification first; assess backend and LLM requirements in the next stage.

### 1.2 Product principles

- **Match the exam.** Practice formats, marking, and time allocation follow each module's actual assessment.
- **Show evidence.** Explain what earned or lost marks and point to supporting course material.
- **Preserve student work.** Save drafts, original submissions, and marking history.
- **Expose uncertainty.** Pending, ambiguous, unsupported, and unreadable are distinct from incorrect.
- **Measure skills separately.** Recognition, recall, application, derivation, proof, coding, and design have different evidence.
- **Keep setup tractable.** A student can start with one small question set and add sources incrementally.

### 1.3 Scope boundaries

This draft specifies observable product behaviour and acceptance criteria. It does not choose a frontend framework, database, vector store, model provider, embedding model, parsing service, or agent framework. Cloudflare Pages is the frontend hosting constraint; live marking, private storage, authentication, and background imports require services beyond static page hosting. Their placement and cost will be evaluated next.

The clean-room approach means implementing general behaviours independently, with original code, UI, wording, and question content supplied for this project. The reference site's application code, assets, question bank, and private prompts are not implementation inputs.

## 2. What the reference site contributes

The audit distinguishes **observed** interface/results, behaviours **described** by the site, and **unverified** internals. The following are product inspirations, not claims about its backend.

| Evidence ID | Reference behaviour                                                     | Direction for this product                                                                   |
| ----------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| R01         | Navigation, account menu, studying indicator                            | Keep predictable navigation and account access; presence is optional later                   |
| R02         | Today dashboard, exam countdown, daily work, mastery map, weakest areas | Add a cross-module daily plan and evidence by skill                                          |
| R03         | Question drill, reasons, session counts, resumable session              | Generalise to complete multipart written problems and coding/design tasks                    |
| R04         | Timed, one-pass CS2103T mock with delayed feedback                      | Make timing, navigation, selection, and scoring configurable per exam                        |
| R05         | Topic hierarchy, mastery filters, manual known state                    | Use module-specific topics and skills; distinguish self-report from demonstrated performance |
| R06         | Typed abbreviation flashcards and repeat review                         | Generalise to definitions, conditions, formulas, instructions, and terminology               |
| R07         | Explain a topic from memory, checked against textbook                   | Offer source-grounded explanation practice without replacing applied work                    |
| R08         | Retained mistakes, misconceptions, corrections, textbook excerpts       | Preserve full evidence and provide a recovery queue and marking challenges                   |
| R09         | Searchable topic-linked notes, pin/edit/delete                          | Add question and source links; notes stay personal                                           |
| R10         | Study time, coverage date, other-exam days, forecasts                   | Budget total time across modules, make infeasible plans explicit                             |

The reference has inconsistent visible copy about whether MCQ explanations are required. This product must define that policy explicitly. Its recall estimates are not evidence of a particular scheduling algorithm or validated predictive accuracy. Broad importing, ST2132-style proofs, MIPS assessment, and circuit design were not observed on the reference site.

## 3. Information architecture and ownership

### 3.1 Main destinations

- **Today:** combined study queue, exam dates, resume actions, time budget, recent results.
- **Modules:** module dashboard, topic/skill coverage, exam profiles, study settings.
- **Practice:** daily review, targeted question selection, explanation practice, flashcards.
- **Papers:** intact past papers, section practice, timed mocks, attempt history.
- **Review:** mistakes, misconceptions, disputed marks, source-backed feedback.
- **Library:** source files, imported question sets, extraction review, readiness/errors.
- **Notes:** personal searchable notes linked to modules/topics/questions/sources.
- **Settings:** account, data export/deletion, study budget, usage, future sharing controls.

Module context must remain visible throughout practice and feedback. Browser Back, direct links, and returning after a refresh must have predictable behaviour.

### 3.2 Product objects

| Object                             | Meaning and required relationships                                                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Module offering                    | Code/name, academic year/semester, owner, syllabus version, topics, sources, exam profiles; the same code in another semester is a separate offering |
| Topic / learning outcome / skill   | Hierarchical topic plus specific capability, such as deriving an MLE or translating a loop to MIPS                                                   |
| Exam profile                       | A versioned set of sections, time/marks, allowed resources, navigation rules, question types, and coverage rules                                     |
| Source revision                    | Original material, provenance, scope, permission, extraction state, page/slide/section anchors, superseded versions                                  |
| Question family / question version | Shared problem identity and concrete version; prompt, parts, marks, rubric, answers, assets, sources, tags                                           |
| Paper / question set               | Ordered questions, shared instructions, year/session, total marks/time, answer-release policy                                                        |
| Session / attempt                  | Selected content versions, mode, timing rules, drafts, submissions, assistance used, completion state                                                |
| Marking result                     | Criterion-level assessment, evidence, uncertainty, checker coverage, rubric/source versions, revision history                                        |
| Learning evidence                  | Skill/topic performance, exposure, independent versus assisted attempts, review dates, confidence self-report                                        |
| Misconception / note               | Learner-owned record linked to supporting attempts or selected learning context                                                                      |

Question families include multipart dependencies and later generated variants so repeated exposure is not mistaken for transfer. This is a conceptual model, not a database schema.

### 3.3 Ownership now, sharing later

For the personal release, all imported materials, questions, responses, notes, and progress are private to the owner. Each object has an owner and explicit access scope from the beginning. Future sharing applies to selected module content; it never silently publishes attempts, Canvas credentials, notes, or marks.

Future roles: module owner, invited content editor, learner, and site operator. Editors manage shared content; learners maintain independent progress. Source access and question access are checked separately, including when a citation is opened. Modules copied into another semester retain provenance while obtaining independent versions.

## 4. Detailed functional requirements

Priority vocabulary: **P0** = usable personal release; **P1** = expansion after the core loop works; **P2** = later enhancement. These are product priorities, not implementation estimates.

### F01 — Module setup and syllabus (P0)

Create ST2132 and CS2100 offerings with semester, exam date/time/timezone, topic structure, examinable scope, and preferred notation/conventions. Set a single total study-time budget and optional per-module priorities. Setup can be completed with unknown exam details explicitly marked as provisional.

Import or manually enter topics and learning outcomes. Suggested tags require review. Optional/non-examinable material remains searchable when selected but does not enter the exam queue by default. Allow revising scope without deleting historical attempts.

**Acceptance:** an ST2132 question cannot acquire a CS2100 rubric or citation through a context switch. An excluded topic does not appear in a normal exam-aligned session.

### F02 — Exam profiles (P0)

An exam profile records duration, sections, total marks, compulsory/optional questions, multipart structure, allowed question types, topic/skill distribution, navigation/backtracking, answer-release timing, permitted references/tools, and any partial/negative/capped scoring rules. User confirmation is needed for inferred rules before the profile is used as an exam simulation.

Create separate profiles for learning practice, a real past paper, and a generated mock. Support multiple assessments in a module rather than a single hardcoded final. Preserve shared passages, diagrams, tables, data, and instructions throughout a multipart question.

**Acceptance:** a mock can only be labelled as matching a profile if its type, mark, and section constraints are satisfied. Missing coverage produces an explicit shortfall, not silent replacement of written questions with MCQs.

### F03 — Material library and source versions (P0)

Add lecture notes, textbooks, tutorials/recitations, papers, and solutions through file upload or pasted text. Record module, source type, title, semester/edition, whether it contains solutions, examinable scope, and visibility. Initial files should cover text PDFs and images; additional office/export formats follow the representative samples selected for ingestion. Authenticated URL ingestion is not implied by accepting a URL.

Each import shows queued, extracting, needs review, ready, or failed; long imports may finish after the user leaves the page. Display a preview with page/slide references, extraction warnings, and image/equation/table rendering. Let the owner correct text, formulas, labels, and anchors. Replacing a file creates a revision; it does not silently change past feedback.

Keep original scans alongside extracted content. Flag low-quality OCR, missing pages, unreadable diagrams, and mathematical symbols likely to be corrupted. A source can be available for reading while unsuitable for automatic marking.

**Acceptance:** a broken fraction or missing circuit label is surfaced before the affected question is eligible for automatic marking. A citation opens the exact authorised revision and location used by the marker.

### F04 — Question import and review (P0)

Import questions independently of reference material. Preserve original wording, choices, diagrams, tables, numbering, part/subpart nesting, common assumptions, marks, units, and paper instructions. Attach answer keys and rubrics separately so practice views can hide them.

Support manual entry/paste and reviewed extraction from supplied files. The workflow is: preview extraction → repair structure and assets → map topics/skills → review answers/rubric → publish to the private bank. Batch operations may publish straightforward items while leaving ambiguous ones in review.

Detect exact duplicates and suggest probable duplicates for review. Do not merge different assumptions, datasets, solutions, or versions automatically. Store question provenance separately from solution provenance, and distinguish official supplied keys, user-entered keys, and AI-proposed solutions. Questions without trusted answers remain usable in an explicitly unverified or self-marking mode.

For P0, manually entering a rubric or reviewing an AI-proposed rubric is acceptable. Unreviewed proposed solutions must not become authoritative simply because they were generated from a real question.

**Acceptance:** importing one four-part ST2132 problem produces one intact problem with four linked parts, not four unrelated prompts. Importing an MCQ preserves whether it is single-choice or multiple-select and its scoring policy.

### F05 — Canvas content intake (P0 manual; P1 direct connector)

The P0 outcome is that Canvas-origin questions can enter the same reviewed import workflow using supplied text, screenshots, or an available export. Preserve quiz title, question numbering, options, feedback, and provenance where present. Do not assume a student can export a complete bank or retrieve hidden answer keys.

P1 adds authorised API import where the institution and account permit it. Show what is accessible, preview the import, handle pagination/attachments and supported quiz formats, and report inaccessible material. Import is read-only: no quiz attempts are submitted and no grades or course content are changed. Repeat import detects revisions and duplicates.

If a coding-agent browser is used for one-off acquisition, the user signs in and the agent collects the specifically authorised visible material into a reviewable import. This is distinct from promising a continuously operating Canvas integration. Do not collect session cookies or unrelated course/user data into module content.

**Acceptance:** missing answer keys are labelled missing; import never fabricates them as official. An unsupported quiz format fails clearly while preserving any successfully imported items.

### F06 — Today and the study plan (P0)

Show upcoming exams, a combined daily plan, per-module workload, remaining reviews, new problem exposure, time estimates, and resume actions. A single budget covers both modules; two 60-minute module plans must not silently become a 120-minute day.

The student can set normal availability, light/unavailable days, priorities, and a first-pass target. Estimates account for task duration: a multipart proof problem is not the same unit of work as a flashcard. Show coverage of distinct problems, learning outcomes, and tested skills separately. When total coverage is infeasible, explain the shortfall and offer prioritisation or more time.

Plans adapt after missed days, new content, changed exam dates, and observed performance. A student can always select extra practice. No automatic timer cuts short a practice proof simply because the estimated time has passed. Ending early saves completed work and remaining work without inventing failed attempts.

**Acceptance:** selecting a 30-minute day produces an estimated mix within that budget, or an explicit overrun for an indivisible long problem. A missed day produces a revised feasible plan rather than unbounded backlog accumulation.

### F07 — Practice modes and answer capture (P0)

Offer daily adaptive review, targeted topic/skill/type practice, intact question-set/paper practice, and an untimed free-choice mode. Before starting, show estimated time, formats, feedback policy, and whether hints or sources are allowed.

For multipart questions, keep shared context visible, allow inspecting earlier work, and autosave each part. Let the student submit a complete problem or receive part-level feedback according to mode. Viewing early feedback marks subsequent dependent parts as assisted; it cannot count as an independent exam attempt.

Support plain text with mathematical notation/LaTeX preview, code input retaining indentation, MCQ controls, and uploaded photos/images for handwritten mathematics or circuits. Require confirmation of uncertain transcription or diagram interpretation before relying on it for marking. Provide self-marking/manual review when an answer cannot be interpreted safely.

Show saving/saved/offline-unsynced status. Refresh/reconnect restores drafts; submissions retain immutable original answers. Explicitly submitting a blank answer is distinct from skipping it or losing a connection. Large equations and diagrams support zoom without shrinking all question text.

**Acceptance:** a learner can complete an ST2132 multipart problem and a CS2100 MIPS problem without flattening the response into an MCQ. A lost connection during marking preserves the submitted work and supports resuming status.

### F08 — Marking and feedback (P0)

Use a trusted supplied key for objective choice scoring. For written work, assess explicit rubric criteria with marks, identified claims/steps, reasons, and source support. Return correct/partly correct/incorrect where supported, plus needs review when a justified assessment is unavailable. Do not map all failures of the marking system to zero marks.

Feedback contains: submitted answer, mark/maximum when justified, criterion breakdown, strengths, specific errors/omissions, correction, concise model solution when available, relevant source excerpts, marking status, and checker coverage. The student can ask a focused follow-up or challenge a mark with a reason; a revised mark preserves the original result and explains the change.

Distinguish exam score, reasoning quality, self-reported confidence, and learning evidence. A wrong pick with a sound explanation can indicate an accidental selection, but it remains wrong under an exam policy that scores picks. Missing reasoning is not automatically a misconception.

**Acceptance:** the sum of criterion marks equals the reported score; unassessed criteria are identified. Retrying a pending marking request does not submit another attempt, charge for duplicate work intentionally, or advance review state twice.

### F09 — Review and misconceptions (P0)

Maintain a searchable/filterable record of mistakes, incomplete reasoning, unsupported correct guesses, unresolved marks, and self-reported uncertainty. Each item links to the original question, answer, feedback, sources, and later attempts. Group recurring misunderstandings by module, skill, and supporting evidence.

Record a misconception only when an answer supports a specific incorrect belief. A blank answer, time expiry, missing fact, typo, and unreadable image have different diagnoses. The learner can correct or dismiss an inferred misconception; the original evidence remains.

Recovery may require multiple independent correct demonstrations across different days or question families. An immediate retry after seeing the answer is learning activity, not proof that the weakness has been resolved. A later recurrence reopens the issue.

**Acceptance:** correcting a MLE arithmetic slip does not automatically resolve a misunderstanding of likelihood assumptions. An AI marking failure does not create a misconception or a review penalty.

### F10 — Mastery, review scheduling, and progress (P0 baseline; P1 calibrated forecasts)

Show unseen, learning, demonstrated, and needs-review states with supporting attempts and dates. Track performance by both topic and skill/type: MCQs about hypothesis tests do not demonstrate ability to construct the test; reading MIPS does not demonstrate writing MIPS; interpreting a truth table does not demonstrate circuit design.

Schedule retrieval over time, prioritising unresolved weaknesses, exam relevance, overdue work, undercovered skills, and new exposure within the time budget. Interleave topics when useful and retain complete problems when their parts depend on each other. Exact scheduling algorithm and thresholds are a backend-stage decision.

Self-reported known states and self-marked work are visible but separate from verified performance. Assisted, repeated, first-attempt, and delayed independent results must be distinguishable. Explanations and flashcards contribute evidence to their own relevant skills.

P0 uses honest evidence-based status and coverage. Numerical recall/exam-score forecasts are P1 and must be evaluated before display; do not reproduce confident percentages from sparse data. If introduced, show what is being predicted, evidence quantity, assumptions, and uncertainty.

**Acceptance:** repeated success on one memorised MCQ cannot label an entire multipart proof topic mastered. A first-time module shows insufficient evidence rather than fabricated recall probabilities.

### F11 — Papers and timed mock exams (P0)

Run a supplied past paper intact, practise selected sections, or assemble a mock from published imported questions using an exam profile. Preserve marks, order where required, optional-question choices, multipart context, and section instructions. Generated mocks initially mean assembly of real questions, not AI-written questions.

Show duration, permitted tools, navigation rules, pause policy, and feedback timing before the start. Timed attempts use a persistent deadline; refreshing or navigating away does not reset it. Permit backtracking only when the profile permits it. Show progress, unanswered parts, and flagged questions when allowed.

At deadline, retain saved answers and clearly distinguish unanswered, timed out, and unsynced content. Results can appear incrementally while written marking completes. Scores must disclose pending/provisional components and coverage of checking. Learning reviews begin after the attempt rather than leaking feedback during it.

Let the user reserve selected past papers for unseen exam practice. Ordinary drills, search snippets, hints, generated variants, and marking references must not expose reserved solutions before the reserved attempt's feedback release. If content has already been seen, disclose that the paper is no longer fully unseen.

**Acceptance:** a written-paper profile does not silently fall back to all-MCQ. A mock with a pending proof mark never presents its partial score as the final score.

### F12 — Explain, flashcards, and personal notes (P0 basic)

Explain practice asks the student to reconstruct a selected concept from memory and checks core ideas and confusions against scoped sources. It can recommend a weak outcome, but must not replace required applied practice in the daily mix.

Flashcards support definitions, terminology, formula conditions, instruction semantics, and short recall. Allow typed answers, reveal, and self-rating, with self-rated versus checked outcomes distinguished. Preserve conditions and notation; avoid teaching a formula detached from when it is valid.

Notes support create/edit/delete, search, pinning, module/topic/question/source links, and a quick-note action during study. Show saved state, and require a deliberate deletion action with undo or confirmation. Notes are personal and do not become authoritative marking sources unless the owner explicitly designates reviewed material.

**Acceptance:** a note made while reviewing a circuit problem returns to that problem. Deleting a note does not delete its linked question or past answer.

### F13 — Generated practice (P1)

Generate new variants or original practice from selected published sources and learning outcomes after real-question workflows are reliable. Request format, topic/skill, difficulty, marks/time, and desired novelty. Generated questions carry provenance, generation status, a proposed solution, and rubric.

New content passes answerability, source support, ambiguity, scoring, and duplicate/near-duplicate checks before normal scheduling. The owner can review/edit/reject it. A changed number must not break a statistical model, create an impossible circuit, or make a MIPS task unsatisfiable.

Label generated variants and link their family; success on a close variant provides weaker novelty evidence than solving an independent problem. Preserve reserved-paper boundaries. Do not describe a generated item as an official exam question or infer topic likelihood from a tiny set of past papers.

**Acceptance:** an invalid generated answer key prevents publication. Repeated exposure to sibling variants is visible in progress interpretation.

### F14 — Sharing and public operation (P1 invited; P2 public)

Invite students to explicitly published module content while keeping responses, notes, progress, and personal sources separate. Share only materials for which the owner intends and is permitted to provide access. A learner may attach private supplementary sources without publishing them to the group.

Support content reports, corrections, version history, and removal from future use. Site operators need usage visibility, import/marking failure diagnostics, configurable limits, and a way to suspend new expensive jobs when the operating budget is exhausted. Already saved work remains accessible.

Public signup comes after invited-user isolation and content lifecycle checks. Presence, leaderboards, social features, and notifications are optional; none is necessary for a useful revision loop. No payment or subscription workflow is planned.

**Acceptance:** another learner cannot retrieve private answers or private source excerpts through search, marking, shared links, or exports. Publishing a question does not automatically publish all of its owner's library.

## 5. Module-specific assessment requirements

The exam descriptions below come from the user's current account. Exact semester instructions, marking conventions, and scope need confirmation from supplied papers/materials before creating authoritative exam profiles.

### 5.1 ST2132

Default emphasis: whole multipart problems, proofs/derivations, and applied statistical reasoning. A full-paper template supports approximately four to five multipart questions; exact count, marks, duration, permitted references, and choice rules remain configurable.

Initial skills include deriving likelihoods/log-likelihoods and MLEs, checking support and parameter constraints, computing Fisher information under the course's conventions, constructing and interpreting hypothesis tests, and writing justified proofs. The taxonomy will be refined from the actual syllabus.

For marking:

- Preserve notation, assumptions, distribution parametrisation, sample size, and parameter domain.
- Assess reasoning steps and conclusions separately. A correct number with an invalid derivation may earn less than a sound method with a minor arithmetic slip, according to the rubric.
- Accept valid alternative derivations and equivalent expressions. Do not require the model solution's exact wording or route.
- Check boundary cases and regularity/support assumptions when relevant; do not assume an interior stationary point is automatically the MLE.
- For tests, distinguish hypotheses, statistic, null distribution, rejection rule/p-value, assumptions, and conclusion at the stated level where required by the question.
- For Fisher information, distinguish per-observation and whole-sample quantities, expected versus observed information, and the course's sign/parameter conventions when relevant.
- Honour explicitly configured follow-through marks across dependent parts; do not repeatedly penalise the same carried numerical error unless the rubric requires it.
- Label proof assessment as AI-reviewed unless a dedicated verifier actually covers the claim. Retrieval supports definitions and assumptions; it does not establish that a novel proof is logically valid.

**Example target experience:** the student attempts all parts of an imported estimation-and-testing problem with saved working. Feedback awards criterion-level marks, identifies an omitted parameter constraint, shows the relevant course definition, and schedules the weak skill for later practice without pretending the entire topic is unknown.

### 5.2 CS2100

Default emphasis: short applied answers, MCQs, MIPS programming, and circuit design. Capture the module's exact ISA subset, register/calling conventions, supported instructions/pseudoinstructions, word width, signedness/overflow assumptions, memory model, and circuit notation when supplied.

For marking:

- MCQs use the imported key and declared single/multiple-select scoring policy.
- Applied answers assess reasoning and intermediate representations, not keyword presence alone.
- MIPS answers preserve code formatting and are assessed for the required behaviour and conventions. Accept semantically valid alternative implementations.
- Distinguish a code explanation/review, syntax/assembly check, and actual execution against tests. Only claim checks that ran; test passing is still not a proof for all inputs.
- For P0, reviewed rubrics and AI code review are acceptable with explicit provisional status. Automatic assembly/simulation is an optional later checker unless selected as essential after sample-question review.
- Circuit tasks accept an uploaded drawing plus the student's description or confirmed extracted structure. Identify unreadable labels/connections before grading. A missing wire in extraction is not evidence of a student error.
- Evaluate relevant truth tables, Boolean expressions, required behaviour, and design constraints when representable. Equivalent circuits must not fail solely because their drawing differs from the sample answer.
- If circuit equivalence or timing cannot be checked reliably, return a partial assessment or manual-review path and state what remains unchecked.

**Example target experience:** the student submits MIPS for an imported loop-translation problem and receives rubric feedback on behaviour, register use, and addressing, with a clear statement that no simulator ran. For a circuit problem, they confirm the interpreted connections before any structural claim is marked.

### 5.3 Assessment-type contract

| Format                             | Response experience and scope                                              | Marking basis                                                         | Essential limitation or rule                              |
| ---------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| Single-choice / True–False         | Select one answer; optional or required reason by practice policy          | Trusted key; separate reasoning assessment                            | Exam pick score and reasoning are separate                |
| Multiple-select                    | Select a set; policy displayed                                             | Exact-set or explicit rubric/partial-credit policy                    | Never infer partial credit from the number of options     |
| Short applied answer               | Text, equations, intermediate steps                                        | Criteria plus accepted alternatives                                   | Equivalent reasoning earns credit                         |
| Multipart statistics / calculation | Part-level working, math preview or confirmed handwriting                  | Method, assumptions, values/units/conclusion as applicable            | Follow-through and double-penalty rules explicit          |
| Proof / derivation                 | Structured written argument, mathematical notation                         | Logical obligations and rubric; source definitions                    | A citation does not prove a step is valid                 |
| MIPS code                          | Formatted code and optional reasoning                                      | Behaviour and convention rubric; actual checker evidence if available | AI review and execution labelled separately               |
| Circuit design                     | Drawing/image and confirmed interpretation; expression/table when suitable | Functional/design criteria and verified checks                        | Unreadable/unchecked structure stays unresolved           |
| Essay (P1)                         | Extended text, word count, outline/draft support                           | Thesis, evidence, argument, accuracy, structure by module rubric      | More than one defensible answer; no generic keyword score |

Essays remain in the extensible question model but are not required for the first two modules' release. A specialised circuit editor, arbitrary handwriting recognition, executable code across many languages, and formal proof verification are P2 unless the first real materials justify advancing them.

## 6. Marking policy and source-grounded assistance

### 6.1 Reasoning policy for objective questions

Learning mode offers an explicit **explain your choice** policy: required, optional, or sampled. The chosen policy is shown before submission. Optional blank explanations mean **reasoning unassessed**, not automatically lucky guess or mastered. A clearly wrong explanation attached to a correct pick is **correct pick, flawed reasoning**. A self-reported guess is recorded as such.

For deep-review sessions, require an explanation for selected important or previously weak concepts. Avoid asking for long justification on every trivial choice. Exam mode follows the paper's rules and preserves the actual pick score regardless of learning diagnosis.

### 6.2 Result and revision semantics

Marking states: submitted → queued → marking → complete, provisional/needs review, or failed/retryable. Readability confirmation may precede marking. Student work remains available in every state. Pending parts do not silently count as zero or successful mastery evidence.

A completed result includes the question and answer version, rubric version, relevant source revisions, criterion decisions and marks, supporting excerpts where applicable, and an intelligible record of checks performed. Regrading creates a new result; it never overwrites the original answer or disguises a changed rubric as a student improvement. Learning state is recalculated from the effective result without double counting.

Manual overrides record the learner's reason and are labelled self-assessed. They may adjust the personal review queue, but do not become trusted calibration examples automatically. Disputing a mark preserves it as disputed; it does not imply that either the student or the marker is correct before review.

### 6.3 Retrieval behaviour (product contract)

The marker must receive the full question, shared context, submitted work, rubric/key, and authorised relevant course evidence. Retrieval is scoped by module offering, semester, selected source revisions, and access permissions. It should anchor on question intent and rubric needs; an incorrect student claim must not steer retrieval into apparently validating that claim.

Approved keys/rubrics govern exam scoring. Module settings define source precedence, such as current course errata versus a textbook edition; there is no universal rule that a textbook always wins. Conflicts and missing evidence produce a visible limitation or review request. Generic model knowledge may aid reasoning, but should not be presented as a statement supported by course notes when it is not.

Citations must identify the source title, revision/edition, page/slide/section, and a relevant excerpt. A citation click opens the source at that location, subject to its solution-release and access policy. Evidence can support a formula, condition, convention, or correction; the student's novel reasoning still requires assessment.

Do not display a source-backed mark merely because a vaguely related paragraph was found. Where evidence is inadequate, say which claim or criterion cannot be established. Do not fabricate quotes, page numbers, official solutions, or confidence percentages.

### 6.4 Boundaries and failure handling

Imported documents and student answers are assessment data; instructions embedded in them cannot change marking policy, reveal hidden solutions, or access another user's content. Reserved-paper solutions remain unavailable until release, including through retrieval, follow-up chat, and source previews. The system may know a hidden key for marking without exposing it to the attempt view.

Expensive jobs have bounded work, retries, and input/output limits. Use cheaper models for suitable extraction/tagging work only after quality evaluation. More consequential marking may require stronger review or deterministic checks; routing is a later design decision. If budget/provider limits are reached, queue, pause, or offer self-marking while preserving the answer. Never convert cost limits into an incorrect grade.

### 6.5 Validation before trusting marks

Build a reviewed benchmark from representative supplied questions and answers: fully correct alternatives, partly correct work, common misconceptions, wrong confident answers, ambiguous notation, unreadable drawings, and adversarial instructions. Evaluate criterion-level agreement, score error, source support, unwarranted certainty, correct-alternative rejection, and appropriate abstention.

Agree acceptable quality thresholds by task before advertising automatic marking as reliable. Proof, MIPS review, circuit interpretation, and MCQ choice scoring need separate evaluations; a high average can hide failure on the difficult formats. Changes to rubrics, model routes, source extraction, or retrieval require relevant regression checks. Model self-reported confidence alone is insufficient evidence of marking reliability.

## 7. Core user journeys

### J01 — Start ST2132 with real material

Create the module offering → add syllabus/exam instructions → upload a tutorial or past paper and separate solutions → review extraction, multipart structure, and rubric → attach relevant lecture/textbook sources → publish privately → attempt one full problem → review criterion-level feedback and evidence → revisit the identified skill later.

### J02 — Practise CS2100 coding and design

Select MIPS writing or circuit design → see task constraints → enter code or upload a drawing → confirm any uncertain interpretation → submit → inspect feedback and the stated checking coverage → challenge an uncertain result or self-mark against a supplied solution → add a contextual note → schedule a delayed independent attempt.

### J03 — Prepare across both modules

Set a total daily budget and exam dates → view a feasible mix of reviews and new tasks → resume unfinished work → complete or stop early → plan recalculates from actual evidence and time → reserve time for intact papers as exam day approaches.

### J04 — Take an unseen paper

Reserve a paper → normal practice excludes its protected content → inspect exam rules → start once ready → answer under the configured navigation/timer policy → saved work survives refresh → deadline or explicit submit ends the attempt → feedback releases according to policy → written marks complete without losing objective results → weaknesses enter later review.

### J05 — Add another student later

Owner publishes a selected module set → invites learner → learner sees only authorised content → each student's attempts/progress/notes remain private → corrections produce a new content version → existing attempts remain interpretable.

## 8. Usability, reliability, and operating requirements

### 8.1 Interaction and accessibility

Use a quiet, readable study interface with a persistent module label, clear question/part hierarchy, and one obvious next action. Desktop may place working and reference evidence side by side; narrow screens stack them with question context easy to recover. Avoid inheriting the reference site's dense mastery map as the only way to navigate.

Target WCAG 2.2 AA: keyboard operation, visible unobscured focus, proper labels/headings, accessible error messages, sufficient contrast, and textual status alongside colour. Design primary touch targets around 44 CSS pixels. Respect reduced motion and support zoom/reflow; equations/code may use local horizontal scrolling where necessary, without making the whole page scroll sideways. Images need useful descriptions or an equivalent textual task where feasible.

Answer shortcuts must not fire while typing text/code/math. Mathematical rendering and code controls need usable keyboard/screen-reader behaviour. Provide timer warnings and profile-supported accommodations without implying a high-stakes certified testing environment. These are baseline functional requirements drawn from the UI/UX skill's built-in priority guidance; no visual design system has been selected.

### 8.2 Saving and recovery

Draft saving, import processing, and marking progress are visible. Local unsynced drafts survive an ordinary refresh and show when they cannot reach the server; users can copy/export their work during an outage. Sync conflicts must not silently overwrite a newer answer. Exam attempts use an authoritative persisted deadline and an explicit unsynced-answer policy.

Support retry/resume for interrupted imports and marking without duplicate content, attempts, or learning events. Deleting or retiring a source removes it from future retrieval; attempts keep permissible provenance and show when original evidence is unavailable. The exact deletion/retention policy must be settled before invited sharing.

### 8.3 Cost and service visibility

Provide owner-visible usage for ingestion, storage, marking, and generation; configurable per-job/per-user/project limits; and a budget stop that preserves saved study work. Queued jobs can be cancelled. Users see a useful reason and next action when a service is unavailable, without receiving internal model prompts or infrastructure details.

No claim that operation will fit a free tier is made. The later backend proposal must estimate cost from real page counts, answers, answer lengths, model routes, and concurrency. Establish a monthly owner budget and target pilot audience before public access.

### 8.4 Portability and privacy

Export personal notes, questions where permitted, attempts, marks, and progress in documented portable formats. Account deletion must address personal uploads and derived retrieval data as well as profile records. Future shared content needs explicit ownership/retention rules. Credentials never become source documents, citations, exports, or browser-visible application configuration.

## 9. Delivery phases

### Phase A — Personal revision loop (P0)

Deliver two isolated module offerings; manual/reviewed real-question import; a source library with usable extraction and citations; maths/code/image answer capture; rubric-based written marking with uncertainty and self-marking; keyed MCQs; intact multipart practice; paper/mock runner; review/misconception history; baseline scheduling by topic and skill; personal notes/basic flashcards; private authentication, persistence, and export.

Canvas questions can enter manually. MIPS execution and general circuit equivalence are not prerequisites if provisional review limitations are explicit. No AI-written question generation is necessary. Start with a representative small content set rather than importing an entire textbook before the learning loop is validated.

### Phase B — Better coverage and a small invited group (P1)

Add authorised Canvas API import, reviewed generated practice, essay assessment, richer ingestion formats, improved module-specific checkers where justified, invited content sharing, content corrections, and evaluated progress forecasting. Share only after access isolation, cost limits, and source visibility have been tested.

### Phase C — Broader student use (P2)

Consider public onboarding, moderation/report handling, larger content catalogues, advanced circuit editors/simulators, broader executable code support, improved handwriting/diagram workflows, optional offline practice and notifications, and optional social presence. These are candidate enhancements, not commitments for the personal release.

## 10. Release acceptance scenarios

| ID  | Scenario and pass condition                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | Import a multipart ST2132 problem with diagrams/equations, marks, key and source links; review/correct it; part dependencies and totals survive publication               |
| A02 | Attempt that problem using a valid alternative derivation; rubric review credits the actual reasoning, identifies uncertainty, and does not require model-answer phrasing |
| A03 | Carry one wrong value into a later part; follow-through matches the configured rubric and the same error is not penalised repeatedly by accident                          |
| A04 | Submit a hypothesis test with correct mechanics but an invalid conclusion; feedback identifies the distinct missing criterion and cites relevant module evidence          |
| A05 | Submit MIPS code; output distinguishes review, assembly and execution, and never claims an execution/test result that did not occur                                       |
| A06 | Upload a circuit with an ambiguous wire or label; the system requests confirmation or review instead of assigning a confident wrong/correct mark                          |
| A07 | Submit keyed single-choice and multiple-select answers; scores follow the declared policy; optional blank reasoning remains unassessed                                    |
| A08 | Set one daily budget across ST2132/CS2100; task-duration estimates and skipped days produce an explainable feasible plan or a clearly disclosed shortfall                 |
| A09 | Refresh during writing and retry during delayed marking; drafts/submissions survive and no duplicate attempt, mark, or review event appears                               |
| A10 | Run a timed paper; refresh/navigation cannot reset the deadline; pending written marks cannot be mistaken for a final complete score                                      |
| A11 | Reserve a paper; ordinary questions, hints, retrieval citations, and variants do not reveal its protected solutions before release                                        |
| A12 | Remove or replace a source; future retrieval respects the change and earlier results retain understandable version/provenance information                                 |
| A13 | Regrade a challenged proof or applied answer; old/new results and reasons remain visible and learning evidence updates once                                               |
| A14 | Reach a model/provider/budget limit; answer stays saved, status remains pending/failed/reviewable, and no zero or misconception is fabricated                             |
| A15 | Navigate and submit entirely by keyboard; test a narrow screen and 200% zoom; labels, focus, equations, code and error recovery remain usable                             |
| A16 | Before sharing: a second learner cannot access another learner's private sources, responses, citations, notes or exports through any supported flow                       |

For P0 marking, use reviewed sample answers for ST2132 derivation/proof, hypothesis tests and Fisher information, and CS2100 MCQ, applied answers, MIPS and circuit interpretation. Quantitative marking thresholds will be set from these samples during the backend/LLM evaluation stage. Until those gates pass, the corresponding automatic marks remain provisional.

## 11. Success measures

The personal release succeeds when the owner can import a representative real question set, practise both modules' actual formats, trust the origin and limits of feedback, and return to a manageable review plan without losing work.

Measure first-pass coverage by learning outcome and format; delayed independent performance; unresolved misconceptions; marking challenges/overrides; criterion-level marking agreement; unsupported-feedback rate; import correction effort; failed/lost/duplicate submissions; per-answer/import costs; and time to a usable first question set. Activity streaks and time spent are secondary to independent exam-relevant performance.

## 12. Decisions and next-stage inputs

### 12.1 Settled for this draft

- First modules: ST2132 and CS2100, with the formats described by the user.
- Real imported questions first; generated questions later.
- Personal release first, explicit sharing boundaries from the start.
- Cloudflare Pages frontend; backend/LLM design follows this feature specification.
- Maths/proofs, applied answers, MIPS, circuits, and MCQs are core; essays remain a later format unless another module needs them.
- Source citations, marking uncertainty, versioned attempts, and preserving original responses are core.
- Typed answers first, with provisional AI marks and manual review. The owner can supply lecture notes, tutorials and solutions for both modules, plus visible CS2100 Canvas quiz questions; files and solution provenance still need review.
- Evaluation target: **$20/month for grading calls** through an owner-supplied custom API provider, plus a **separate $100/month for ingesting source files and syllabus content**, a library below 100 MB with extracted text and retained diagrams, and about 1,000 responses/day. The model is DeepSeek-V4.1-Flash-1017 at owner-reported official API rates, billed in microdollars (USD); the daily volume means submitted answers. Custom-provider billing passthrough and actual token/storage volumes remain untested. These specify AI budgets, not a total hosting budget or accepted provider architecture.

### 12.2 Still to confirm from representative material

- Academic year/semester, actual exam durations/marks/navigation, allowed references/calculators, and any official partial-credit rules.
- ST2132 notation/parametrisations and sample marking schemes; CS2100 MIPS subset/conventions and expected circuit answer representation.
- Actual supplied file formats and representative multipart proof/MIPS/circuit coverage; handwritten input is secondary to the confirmed typed-first workflow.
- Available official solutions/rubrics and which sources take precedence when they disagree.
- The human review process and per-format quality gates for the confirmed provisional AI/manual-review workflow, particularly proofs and circuits.
- Custom-provider model identifier, peak/cache rate passthrough, limits/retention, actual tokens per submitted answer including thinking, original/derived sizes, infrastructure budget and later invited-user target. DeepSeek model/version and official-price parity are owner-confirmed.
- Canvas institution/API access and the quiz/export formats actually available to the student's account.

### 12.3 Backend/LLM investigation brief

Use a small representative pack from each module: exam instructions, one question set with solutions if available, and the relevant lecture/textbook excerpts. Include mathematical notation, a multipart dependency, a diagram, a MIPS task, and a circuit task across the pack. This pack should drive evaluation before full-library ingestion.

The next proposal should compare ingestion fidelity and repair effort; job orchestration; source storage and permissions; retrieval quality; rubric/key handling; mathematical/code/circuit checkers; model routing and bounded escalation; draft/attempt/timer consistency; evaluation thresholds; and operating cost. Assess how the chosen services fit a Cloudflare Pages frontend without assuming all processing can run on Pages itself.

The output of that next stage should be a concrete architecture, a data model and API contract, evaluated model/checker options, a cost model at personal and invited-group usage, and an implementation plan tied to the acceptance scenarios above.
