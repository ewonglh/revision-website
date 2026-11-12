# Revision domain context

## Product

Personal, exam-aligned revision for ST2132 and CS2100. Begin with imported real questions, then add generated practice and invited sharing. The frontend starts as a static scaffold; backend and marking implementation remain open.

The first release prioritises typed answers with provisional AI marks and manual review. Owner evaluation targets: $20/month for DeepSeek through a custom API provider, about 1,000 responses/day and a library below 100 MB with parsed text and retained diagrams. The owner specifies DeepSeek-V4.1-Flash-1017 at official API rates, microdollar billing and 1,000 submitted answers/day. Custom-provider billing passthrough and actual storage/token use remain untested; these targets do not establish affordability or marking reliability.

## Terms

| Term                 | Meaning                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Module offering      | One course in a specific academic year/semester; not just its course code                |
| Exam profile         | Versioned rules for sections, timing, navigation, allowed resources and scoring          |
| Source revision      | A particular authorised version of a document with stable evidence anchors               |
| Question family      | A problem and closely related variants; repeated exposure is not independent transfer    |
| Question version     | The immutable prompt/parts/assets/rubric version used by an attempt                      |
| Part                 | A component of a question that can depend on shared context or earlier work              |
| Attempt              | A learner's saved/submitted work against specific content versions and mode rules        |
| Marking result       | Versioned criterion decisions, marks, evidence, uncertainty and checks performed         |
| Learning evidence    | A result interpreted by skill, independence, exposure and time; separate from exam score |
| Misconception        | A specific incorrect belief supported by an answer; not merely any missing/blank answer  |
| Stage                | A high-level outcome in triage; refined into implementation slices                       |
| Implementation slice | A bounded, demonstrable path through the layers needed for one user outcome              |
| Triage state         | Readiness/decision label; distinct from open/closed, assignment and PR progress          |

## Important boundaries

- A correct MCQ pick does not prove reasoning or applied skill.
- Source retrieval supports evidence; it does not verify a novel proof or execute code.
- AI review, deterministic validation, execution, and formal verification are different capabilities.
- Personal attempts/notes and course-source visibility remain separate from future shared questions.
- The public repository contains original code and safe fixtures, not private course materials.

See the feature spec for product requirements and `docs/adr/` for accepted implementation decisions.

The [issue #2 evaluation dossier](docs/evaluation/README.md) records synthetic baseline evidence and proposed backend/assessment contracts. ADR 0002 is proposed; backend, provider and quality-threshold decisions remain open pending representative materials and review.
