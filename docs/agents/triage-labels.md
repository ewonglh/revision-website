# Triage labels

| Canonical role  | Tracker label   | Meaning                                              |
| --------------- | --------------- | ---------------------------------------------------- |
| needs-triage    | needs-triage    | Evaluate and refine the issue                        |
| needs-info      | needs-info      | Waiting for specific missing information             |
| ready-for-agent | ready-for-agent | Bounded, fully specified work an agent can implement |
| ready-for-human | ready-for-human | Work requiring human execution or judgment           |
| wontfix         | wontfix         | Rejected; close with an explanation                  |

Every tracked issue carries exactly one of these state labels and one category label: bug or enhancement. Phase, area, and epic labels are additive. Remove the previous triage state when applying a new one. Native GitHub open/closed state and assignments are separate from triage readiness.

Triage notes and briefs produced using the triage skill begin with its required AI-generated disclaimer. High-level stage epics stay needs-triage until decomposed; a child's readiness does not change the parent's state automatically.
