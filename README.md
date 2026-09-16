# LLD Arena Practice

Build a complete, polished, responsive full-stack web application called "LLD Arena".

TAGLINE:
"Practice. Design. Get Feedback. Improve."

PRODUCT PURPOSE:
LLD Arena is a Low-Level Design practice platform for software engineering students and developers. The learner chooses an LLD problem, studies its requirements, creates a design solution, submits it, receives structured and explainable feedback, reviews previous attempts, and can try again.

IMPORTANT:
This is a focused 2-day engineering assignment MVP. Do NOT build an LMS, social network, complex admin panel, microservices architecture, Kubernetes infrastructure, or unnecessary features.

The core experience must be:
Choose Problem → Practice → Submit → Evaluate → Feedback → Review → Try Again.

TECH STACK:
- React
- TypeScript
- Tailwind CSS
- Modern component-based architecture
- Use Supabase for persistence/authentication if backend persistence is required
- Keep the architecture simple and maintainable
- Use clean separation between UI, domain logic, evaluation logic, and persistence

DESIGN STYLE:
Create a modern developer-focused interface similar in quality to professional coding/interview platforms.

Visual direction:
- Clean and minimal
- Professional dark/light interface
- Excellent spacing and typography
- Subtle cards and borders
- Clear visual hierarchy
- Responsive on desktop and tablet
- Avoid excessive gradients, animations, and unnecessary decoration
- Use accessible buttons, forms, labels, and error states
- Add loading, empty, success, and failure states

==================================================
CORE PAGES
==================================================

1. DASHBOARD

Create a dashboard showing:

- Welcome message
- Problems attempted
- Problems completed
- Average score
- Recent attempts
- Recommended problems

Example:

Welcome back!

12 Problems Attempted
8 Completed
7.8/10 Average Score

Recent Attempts:
- Parking Lot — 7.5/10
- Vending Machine — 8.0/10
- Elevator — 6.5/10

Recommended:
Parking Lot
Medium
15–20 min
[Practice]

Add a "Continue Practice" section if there is an unfinished attempt.

==================================================
2. PROBLEM LIBRARY
==================================================

Create a problem listing page.

Include 5 LLD problems:

1. Parking Lot
Difficulty: Medium
Estimated time: 20 min

2. Vending Machine
Difficulty: Easy
Estimated time: 15 min

3. Elevator System
Difficulty: Medium
Estimated time: 20 min

4. Library Management System
Difficulty: Medium
Estimated time: 20 min

5. Tic-Tac-Toe
Difficulty: Easy
Estimated time: 15 min

Each problem card should show:
- Title
- Difficulty
- Estimated time
- Short description
- Practice button

Allow filtering by difficulty.

==================================================
3. PROBLEM DETAILS
==================================================

When a learner selects a problem, show:

- Problem title
- Difficulty
- Estimated time
- Problem statement
- Functional requirements
- Important constraints
- Expected behaviours
- Hints section

Example for Parking Lot:

Functional requirements:
- Multiple vehicle types can enter.
- Parking spots can support different vehicle types.
- A vehicle can be parked and removed.
- The system should calculate parking fees.
- The system should handle unavailable parking spaces.

Do NOT show a complete reference solution before submission.

Provide:
[Start Practice]

==================================================
4. PRACTICE WORKSPACE
==================================================

This is the most important screen.

Create a clean two-column workspace.

LEFT:
Show problem requirements and constraints.

RIGHT:
Create a structured LLD submission form.

The learner should provide:

A. Classes

For every class:
- Class name
- Responsibility
- Methods

Allow:
[+ Add Class]

B. Interfaces

For every interface:
- Interface name
- Responsibility
- Methods

Allow:
[+ Add Interface]

C. Relationships

Allow learner to describe relationships such as:
- inheritance
- composition
- aggregation
- dependency
- association

Fields:
- From
- Relationship type
- To
- Reason

D. Design Explanation

Large textarea:
"Explain your design decisions, assumptions, and why you chose these abstractions."

E. Edge Cases

Textarea:
"List important edge cases your design handles."

F. Optional Design Notes

Textarea.

Add:
[Save Draft]
[Submit Design]

Autosave if practical.

Do NOT build a complex drag-and-drop UML editor. A structured form is intentional because this is a focused MVP.

==================================================
5. SUBMISSION FLOW
==================================================

When the learner clicks Submit Design:

Validate:
- At least one class
- Responsibilities are not empty
- Design explanation is not empty
- No invalid empty entities

If validation fails, show clear inline errors.

If valid:

1. Save the submission.
2. Create an attempt.
3. Set status to SUBMITTED.
4. Start evaluation.
5. Show evaluation state.

Statuses:

DRAFT
SUBMITTED
EVALUATING
COMPLETED
FAILED

Show a clear evaluation screen:

"Your design has been submitted."

"Evaluating your design..."

If evaluation fails:

"Evaluation could not be completed."

[Retry Evaluation]

Never lose the user's submitted solution if evaluation fails.

==================================================
6. EVALUATION SYSTEM
==================================================

Design the evaluation system so that deterministic evaluation and AI evaluation are separate.

Create a conceptual evaluator abstraction:

Evaluator
├── RuleBasedEvaluator
└── AIEvaluator

The practice flow should depend on the evaluator abstraction rather than directly depending on one implementation.

The system must be easy to extend later with:
- HumanEvaluator
- Another AI provider
- CodeEvaluator

Do not over-engineer this.

==================================================
7. DETERMINISTIC EVALUATION
==================================================

Implement simple rule-based checks such as:

- Required fields exist
- At least one class exists
- Every class has a responsibility
- Classes do not have duplicate names
- Interfaces have methods
- Relationships reference existing entities
- Design explanation exists
- Edge cases are provided

These checks should generate useful warnings where possible.

==================================================
8. AI EVALUATION
==================================================

If an AI API/environment variable is available, use it for judgment-heavy feedback.

Do NOT simply ask:

"Is this design good? Give a score."

Use a fixed rubric.

Evaluate:

1. Requirement Understanding
2. Class Responsibilities
3. Encapsulation & Interfaces
4. Coupling & Cohesion
5. Extensibility
6. Design Patterns / Abstractions
7. Edge Cases & Testability
8. Design Explanation

Each criterion should contain:

- score from 1–10
- evidence from the learner's submission
- concern
- actionable suggestion
- confidence

Example structured result:

{
  "criterion": "Class Responsibilities",
  "score": 7,
  "evidence": "ParkingLot handles both parking allocation and fee calculation.",
  "concern": "This creates multiple responsibilities.",
  "suggestion": "Consider introducing a pricing strategy or separate pricing service.",
  "confidence": 0.86
}

The AI feedback must be educational and explain WHY something could be improved.

Do not treat one reference solution as the only correct answer. Multiple valid LLD designs should be accepted.

==================================================
9. FEEDBACK PAGE
==================================================

After evaluation, show a polished feedback page.

Top section:

Overall Score: 7.5/10

Then criterion cards:

Requirement Understanding    8/10
Responsibilities              7/10
Encapsulation                 8/10
Coupling & Cohesion           7/10
Extensibility                 8/10
Patterns                      6/10
Edge Cases                    7/10
Explanation                   8/10

Then sections:

WHAT YOU DID WELL

Show 2–3 specific positive observations.

WHAT COULD BE IMPROVED

Show 2–3 specific problems backed by evidence.

SUGGESTED IMPROVEMENTS

Give actionable suggestions.

DESIGN INSIGHTS

Explain relevant LLD concepts such as:
- Single Responsibility
- Interface Segregation
- composition vs inheritance
- strategy pattern
- dependency inversion
Only show concepts relevant to the submission.

IMPORTANT:
Feedback should reference the learner's actual submitted classes/responsibilities instead of generic advice.

==================================================
10. TRY AGAIN / IMPROVE DESIGN
==================================================

Add:

[Improve This Design]

This should open the learner's previous submission as a new editable attempt.

After resubmission, show comparison:

Previous Score: 6.5
New Score: 8.0
Improvement: +1.5

Show:
- Improved areas
- Areas that still need work
- New issues introduced, if any

This feature is important because the product is designed around repeated practice.

==================================================
11. ATTEMPT HISTORY
==================================================

Create a History page.

Show all attempts:

Problem
Date
Status
Score
Action

Example:

Parking Lot
Sep 15, 2026
Completed
7.5/10
[View]

Vending Machine
Sep 14, 2026
Completed
8.0/10
[View]

Elevator
Sep 13, 2026
Failed
—
[Retry]

When viewing an old attempt, show:
- Original submission
- Evaluation
- Feedback
- Score
- Retry/Improve button

==================================================
12. DATA MODEL
==================================================

Use a clean domain model.

Core entities:

User
Problem
Attempt
Submission
Evaluation
Feedback

Conceptually:

User
 └── Attempts

Problem
 └── Attempts

Attempt
 ├── Submission
 └── Evaluation

Evaluation
 └── Feedback

Submission should be flexible enough that a future diagram or code submission can be added without rewriting the entire practice flow.

For example, conceptually:

Submission
- type
- content

Possible future types:
TEXT
DIAGRAM
CODE

For this MVP implement the structured text/design submission only.

==================================================
13. EXTENSIBILITY
==================================================

The design should pass these change tests:

CHANGE TEST A:
Today learners submit structured text.
Later we may support class diagrams.

The domain model should not require rewriting the entire Attempt/Evaluation flow.

CHANGE TEST B:
Today evaluation is AI-based.
Later we may add rule-based evaluation or human review.

The evaluator abstraction should allow this without rewriting the practice workflow.

Document these decisions in DESIGN.md.

==================================================
14. TESTS
==================================================

Add tests for important behavior.

At minimum test:

1. Cannot submit empty design.
2. Duplicate class names are rejected.
3. Class without responsibility is rejected.
4. Invalid relationship references are rejected.
5. Valid submission is accepted.
6. Submission is stored before evaluation.
7. Evaluation failure changes status to FAILED without deleting submission.
8. Completed evaluation stores feedback and score.
9. Retry creates a new attempt based on previous submission.
10. Score comparison correctly calculates improvement.

==================================================
15. DOCUMENTATION
==================================================

Create these files:

README.md
DESIGN.md
RESEARCH.md
AI_USAGE.md

README.md:
- Product overview
- Features
- Tech stack
- Architecture
- Setup instructions
- Environment variables
- How to run
- How evaluation works
- Testing
- Limitations

DESIGN.md:
- Learner journey
- Domain model
- Important classes/interfaces
- Evaluator abstraction
- Submission model
- Evaluation lifecycle
- Change Test A
- Change Test B
- Key trade-offs
- Why structured submission was chosen instead of a UML editor
- Why a monolith was chosen

RESEARCH.md:
Write a concise 1–2 page research note covering:
- Why LLD practice is difficult
- How learners currently practice
- A few existing approaches/tools
- Gaps identified
- Product direction chosen for LLD Arena

Do not fabricate research sources. Keep placeholders or clearly marked references if external research has not been performed.

AI_USAGE.md:
Document 3–5 meaningful AI-assisted decisions.

For each:
- What AI suggested
- What was accepted/rejected
- Why
- Final decision

Include examples such as:
- Evaluator abstraction
- Structured rubric
- Structured submission instead of diagram editor
- Monolith instead of microservices
- Evaluation state handling

Be honest and do not claim decisions were made without AI assistance if AI was actually used.

==================================================
16. ERROR HANDLING
==================================================

Implement:
- API errors
- AI timeout/failure
- Empty states
- Loading states
- Invalid submissions
- Retry evaluation
- Network failure messaging

Never lose a submitted attempt because AI evaluation failed.

==================================================
17. SECURITY / PRACTICALITY
==================================================

Do not expose AI API keys in frontend code.

Use environment variables.

Do not hardcode secrets.

Keep the architecture suitable for a small prototype.

==================================================
18. IMPORTANT PRODUCT PRINCIPLES
==================================================

Prioritize:

1. Working end-to-end practice loop
2. Useful feedback
3. Clear LLD domain design
4. Explainable evaluation
5. Attempt history
6. Retry/improvement loop
7. Simple architecture

Do NOT prioritize:
- social features
- leaderboards
- chat
- payments
- notifications
- complex authentication
- admin dashboards
- microservices
- Kubernetes
- advanced UML drawing
- unnecessary animations

==================================================
FINAL REQUIREMENT
==================================================

Build the application end-to-end with realistic seed data for the 5 LLD problems.

The application should look like a real interview-preparation product, not a generic CRUD dashboard.

Make the main learner journey extremely easy to understand:

Choose Problem
→ Read Requirements
→ Design
→ Submit
→ Evaluate
→ Receive Explainable Feedback
→ Review
→ Improve
→ Try Again

Make the implementation clean enough that I can later export/open the code in VS Code and continue development.

Before finishing, verify that the main flow works without dead buttons or placeholder pages.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://argo-design.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/20451caf-c0ef-4dd1-841f-5f86a5c41cce).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
