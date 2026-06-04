# ICT Budgeting Application — Full Overview
> **Purpose of this document:** This is a complete reference for an LLM to understand the ICT Budgeting Application before designing screens. It covers the application concept, all user roles, the full cycle lifecycle, and precise workflow states for both ADGE (already implemented) and DGE (to be implemented next).

---

## 1. Application Concept

### What is this application?
The **ICT Budgeting Application** is a government workflow platform used by the **Department of Government Enablement (DGE)** of the Abu Dhabi Government to manage annual ICT (Information and Communication Technology) budget planning across all government entities.

### Key Entities
| Entity | Full Name | Role in App |
|--------|-----------|-------------|
| **DGE** | Department of Government Enablement | The governing body. Reviews, evaluates, and approves/rejects ICT projects submitted by government entities. |
| **ADGE** | Abu Dhabi Government Entities | Any government department/entity that submits ICT projects for budget approval. They are the "applicants." |

### The Annual Cycle
This entire process runs on a **yearly cycle** — e.g., *"ICT Budget Planning 2025"* or *"ICT Budget Planning 2026"*. Every year a new cycle is created by the DGE Admin, and all entities go through the same stages within that cycle.

---

## 2. User Roles

### ADGE Side (Entity/Applicant Side)
| Role | Also Called | Responsibility |
|------|-------------|---------------|
| **Respondent** | Data Entry Officer | Creates and enters project data. Primary data entry person. |
| **Reviewer** | — | Reviews projects submitted by Respondent. Can edit and raise clarifications. |
| **Approver** | Digital Lead | Final ADGE authority. Approves projects and submits to DGE. |

### DGE Side (Governing Body)
| Role | Responsibility |
|------|---------------|
| **Admin** | Creates and manages cycles. Adds ADGEs to cycles. |
| **Strategy Team** | Governs the entire process. Reviews strategic alignment of all projects. Does quality checks. Manages timelines. Has full visibility at all times. |
| **SME Reviewer** | Subject Matter Expert teams. Review and recommend/not-recommend projects based on their domain expertise. Each SME team is tied to specific Strategic Priorities. |
| **Strategy Director** | Final DGE authority. Does final approval of all reviewed projects and publishes results. |

> **Important Privacy Rule:** ADGE users **never see individual DGE user names**. Any action or communication from DGE side is shown to ADGE as coming from **"DGE Team"** only.

---

## 3. Cycle Stages

The cycle moves through 4 major stages in sequence:

```
Planning  →  Under DGE Review  →  Allocation  →  Utilization
```

Each stage has its own set of actors, actions, and workflow states. A project carries different data fields at each stage, particularly budget fields against GL Codes (explained in Section 5).

---

## 4. Full Workflow — Stage by Stage

---

### STAGE 1: PLANNING

> **Who is active:** ADGE Respondent, Reviewer, Approver
> **Goal:** ADGE entities enter their ICT projects and get them approved internally before submitting to DGE.

#### 4.1 Cycle Creation by Admin (DGE)
- Admin creates the ICT Budget Cycle, adds participating ADGEs, and publishes the cycle.
- On publish, an **email notification** is sent to all ADGE entities informing them to begin entering their projects.

---

#### 4.2 Project Entry by Respondent

**Respondent can:**
- Create new projects (drafts)
- Edit projects that are assigned/owned by the Respondent context
- Submit one project at a time to Reviewer
- Multi-select and submit multiple projects to Reviewer at once
- Create as many projects as needed

**Workflow state when Respondent creates:**
```
dga_status_for_adge = 1  (Draft)
statuscode = 1           (Draft)
owner = Respondent context
actor_lookup = dga_respondent_systemuser
```

**Workflow state when Respondent submits to Reviewer:**
```
dga_status_for_adge = 2          (Under Reviewer Review)
statuscode = 776140001           (Under Reviewer Review)
owner → moves to Reviewer context
actor_lookup = dga_respondent_systemuser (stamped)
→ Notification created for Reviewer
```

> **Supporting Documents:** Respondent must attach supporting documents before final submit logic completes.

---

#### 4.3 Review by ADGE Reviewer

**Reviewer sees these states in their queue:**
- `To Review` — submitted by Respondent or returned from clarification
- `Reviewed` — marked as reviewed by Reviewer (Reviewer Review Completed)
- `Sent to Approver` — forwarded to Approver
- `Clarification` — clarification raised by Reviewer, pending Respondent response

**Reviewer can:**
- View all projects (but cannot edit projects still with Respondent)
- Edit project details and modify requested budget
- Mark individual projects as Reviewed
- Raise clarification on any project (even already-reviewed ones)
- Submit all reviewed projects to Approver

**Mark as Reviewed state:**
```
dga_status_for_adge = 12         (Reviewer Review Completed)
statuscode = 576610001           (Reviewer Review Completed)
```

**Submit to Approver state:**
```
dga_status_for_adge = 3          (Under Approver Review)
statuscode = 776140002           (Under Approver Review)
owner → moves to Approver context
actor_lookup = dga_reviewer_systemuser (stamped)
→ Notification created for Approver
```

**Raise Clarification (Reviewer → Respondent):**
```
dga_status_for_adge = 5          (Clarification Required)
statuscode = 776140010           (Clarification Required)
owner → returns to Respondent context
actor_lookup = dga_reviewer_systemuser (stamped)
→ Notification created for Respondent
→ Clarification record created in dga_ict_clarification
```

> While under Reviewer review, projects are visible to Approver and Respondent but **no edits** can be made by them.

---

#### 4.4 Respondent Responds to Clarification

- Respondent is notified that a clarification requires response (can be raised by Reviewer or Approver)
- Respondent can make changes to the project while responding
- Respondent submits response → project goes **back to whoever raised the clarification**

**Clarification handoff logic:**
- If **Reviewer raised it** → first Respondent reply sends record back to Reviewer
- If **Approver raised it** → first Respondent reply sends record back to Approver

**Clarification reply state (going back to Reviewer):**
```
dga_status_for_adge = 2          (Under Reviewer Review)
statuscode = 776140001
owner → Reviewer context
→ Reviewer notified
```

> Clarification files and reply files are stored in `dga_ict_clarification` and shown in threaded view.

---

#### 4.5 Approval by ADGE Approver (Digital Lead)

**Approver sees these states in their queue:**
- `Pending Approval` — submitted by Reviewer
- `Approved` — approved by Approver
- `Clarification` — clarification raised, pending Respondent
- `Submitted to DGE` — already sent to DGE

**Approver can:**
- Review each project
- Approve projects one-by-one from the project screen
- Approve multiple projects at once from the projects list
- Edit project details
- Raise clarification (returns project to Respondent, same clarification flow)
- View progress: how many are with Respondent, how many with Reviewer, how many pending his approval
- Submit ALL projects to DGE once **all projects are in Approved state**

**Approve state:**
```
dga_status_for_adge = 4          (Approved by Approver)
statuscode = 776140003           (Approved by Approver)
actor_lookup = dga_approver_systemuser (stamped)
```

**Raise Clarification (Approver → Respondent):**
```
dga_status_for_adge = 5          (Clarification Required)
statuscode = 776140010
owner → Respondent context
actor_lookup = dga_approver_systemuser (stamped)
→ Respondent notified
→ Clarification record created in dga_ict_clarification
```

**Submit to DGE:**
- The "Submit to DGE" button is **only enabled** when ALL projects are in `Approved by Approver` state
- If not all approved, system shows blocking message e.g.: *"22 projects still under review by [Reviewer Name] and 12 projects need your approval"*
- Once submitted:
```
dga_status_for_adge = 6          (Submitted to DGE)
statuscode = 776140004           (Submitted to DGE / Under Strategic Alignment Review)
→ Strategy Team notified
→ Record shared via dga_WebApiForPortal
```

**Post-DGE Shortcut Flow:**
Once the first project in the cycle has been submitted to DGE, later projects in the same cycle can follow a **shorter path** — Reviewer items can move more directly to Approver, and Approver can submit directly to DGE. This is reflected in queue labels and submission behavior.

---

### STAGE 2: UNDER DGE REVIEW

> **Who is active:** Strategy Team, SME Reviewer Teams, Strategy Director (all DGE)
> **Goal:** DGE evaluates all ADGE-submitted projects for strategic alignment, SME recommendation, quality check, and final approval.

---

#### 4.6 Strategic Alignment Review by Strategy Team

**Trigger:** Approver from ADGE submits to DGE → Strategy Team is notified and ADGE is highlighted on their **ADGE Tracker**.

**What Strategy Team does:**
Strategy Team reviews all submitted projects from all ADGEs to verify that each project has the **correct Strategic Priority** and **Strategic Priority Classification** selected. Projects are assigned to SME Teams based on these two fields — so it's critical they are accurate before routing.

**Key challenge:** Strategy Team typically reviews **thousands of projects in a few days**. They need:
- A high-efficiency screen to quickly scan all projects
- Filters by Entity Short Code, Strategic Priority, etc.
- Ability to update Strategic Priority and Classification inline (without opening each project)
- AI flagging of projects that appear to have an incorrect Strategic Priority or Classification

**AI Use Case — Strategic Alignment:**
AI analyzes each project's Entity Short Code, Project Name, Project Description, Strategic Priority, and Classification and **flags projects where the selection seems misaligned**. This reduces manual scanning burden significantly.

**Screen should clearly show three buckets:**
1. Projects submitted by ADGEs — not yet reviewed by Strategy Team
2. Projects reviewed by Strategy Team — not yet assigned to SME Reviewers
3. Projects already assigned/forwarded to SME Reviewers

**Strategy Team can also:**
- Raise clarification from ADGE at this stage (3-day SLA for ADGE to respond)
- Request additional documents from ADGE
- Update Strategic Priority and Classification of any project

**Once all projects of an ADGE are reviewed and aligned**, they are forwarded to the relevant SME Teams.

---

#### 4.7 SME Reviewer Review

**Assignment logic:** Projects are assigned to SME Reviewer Teams based on Strategic Priority + Strategic Priority Classification. Each SME Team owns a domain.

**SME Reviewer can:**
- See count of projects assigned to them (notification is a count, not per-project)
- View project details: description, budgets, documents attached
- Recommend or Not Recommend a project
  - Adding a comment is **mandatory** if marking as Not Recommended
- Request Strategy Team to change Strategic Priority/Classification if they believe the project is misassigned (with suggested values)
- Raise clarification with ADGE (3-day SLA for ADGE to respond)
- Track their own review progress (how many reviewed vs. total, with deadline)

**AI Use Case — SME Review Assistant:**
For each project, AI provides:
- **Document Summary:** Reads all attached documents and summarizes key insights
- **Recommendation Suggestion:** Suggests Recommended/Not Recommended with AI-generated reasoning
- **Risk & Concern Highlights:** Flags concerns, gaps, or risks in the project
- **Budget Alignment Check:** Compares requested budget against similar historical projects and suggests a realistic range
- This functions as a **decision-support tool** — SME still makes the final call

**SME Clarification SLA:**
- ADGE has **3 days** to respond to a clarification raised by SME
- After 3 days, SME can proceed to next action without waiting

**SME requests Strategic Priority change:**
- SME raises a request to Strategy Team with suggested Strategic Priority/Classification
- Strategy Team reviews, approves/disapproves the request, and updates accordingly

**After SME Reviewer completes review (Recommended or Not Recommended):**
→ Project is assigned to **Strategy Team for Quality Check**

---

#### 4.8 Strategy Team Quality Check

**Strategy Team can:**
- Approve a project as "Quality Checked" (one-by-one or bulk)
- Raise clarification with the SME Reviewer who reviewed the project (assigned to same SME Reviewer Team)
- Once Quality Checked → project is assigned to Strategy Director for Final Review

**SME Reviewer responds to Quality Check clarification:**
- SME Reviewer Team is notified of clarification from Strategy Team or Strategy Director
- SME has SLA time to respond
- After responding, project goes back to the user who raised clarification

---

#### 4.9 ADGE Responding to DGE Clarifications

**Rule:** ANY DGE user (Strategy Team, SME Reviewer, Strategy Director) can raise a clarification with ADGE at any point during Under DGE Review, Allocation, or Utilization stages.

**When DGE raises clarification with ADGE:**
- Approver, Reviewer, and Respondent of that ADGE are all notified
- They see it as coming from "**DGE Team**" (individual DGE name is never shown)
- **Any ADGE user** can respond to that clarification
- Response can include file attachments
- When ADGE responds → the specific DGE user who raised it is notified of the response
- **3-day SLA timer** is visible on every clarification

---

#### 4.10 Final Approval by Strategy Director

**Strategy Director can:**
- View all projects at all times (same visibility as Strategy Team)
- Is notified when a project is Quality Checked by Strategy Team
- Approve any project individually or bulk-approve from the projects grid
- Once ALL projects are approved → Strategy Director can **Publish Results**

**Publish Results:**
- All ADGEs are notified that DGE Review results are published
- Cycle stage automatically moves to **Allocation**

---

### STAGE 3: ALLOCATION

> **Who is active:** ADGE Respondent, Approver (and Strategy Team for governance/extensions)
> **Goal:** ADGEs allocate actual budgets to their approved/reviewed projects.

---

#### 4.11 Respondent Adds Allocation

**Trigger:** DGE publishes results → Respondent and Approver of all ADGEs are notified that Allocation phase has begun.

**ADGE users can see:** Which projects were Recommended and which were Not Recommended by DGE.

**Respondent can:**
- Add allocated budget for any project (Recommended or Not Recommended)
- Submit zero allocation for a project (means: DGE recommended it but ADGE chooses not to allocate — this is a "cancel allocation")
- Create a **new project during Allocation** — with these constraints:
  - Fields like Requested Budget and Recommended Budget are **disabled**
  - These projects are **tagged as "Allocation Stage Project"** to mark they did not go through DGE Review cycle
- Submit each project to Approver after entering allocation

---

#### 4.12 Approver Approves Allocation

**Approver can:**
- Is notified when Respondent submits allocation
- Sees a timer/deadline for submitting Allocation to DGE
- Raise clarification with Respondent if needed
- Approve allocation one-by-one or bulk
- Once all projects are approved → Submit Allocation to DGE

**Auto-advance rule:**
If Approver does NOT submit allocation within the provided time window → the cycle **automatically advances to Utilization stage** for that ADGE — unless the Strategy Team has extended the time.

---

### STAGE 4: UTILIZATION

> **Who is active:** ADGE Respondent
> **Goal:** Track actual budget utilization month by month throughout the year.

**Trigger:** ADGE Approver submits allocation to DGE → cycle stage changes to Utilization for that ADGE.

**Respondent can:**
- Add utilization budget for each project
- Utilization is entered **per month** (monthly breakdown view)
- This is an ongoing activity throughout the year — Respondent keeps updating as the year progresses

---

## 5. Project Structure & GL Code Budgets

### What a Project Contains
Every ICT project entered by an ADGE respondent captures:
- Entity details (which ADGE this belongs to)
- Project Name, Description
- **Strategic Priority** and **Strategic Priority Classification** — critical fields that determine which SME Team the project is assigned to
- Supporting documents (attachments)
- Budget broken down by GL Codes

### GL Code Hierarchy
Budgets are not entered as a single number — they are captured against **GL Codes** which follow this hierarchy:

```
L1 (Level 1)
  └── L2 (Level 2)
        └── L3 (Level 3)
              └── GL Code  ← budget is entered at this level
```

When adding a budget account code, the user navigates: L1 → L2 → L3 → GL Code.

### Budget Fields Per Stage
Each cycle stage **unlocks a new budget field** against each GL Code entry:

| Stage | Budget Field Unlocked |
|-------|----------------------|
| **Planning** | Requested Budget |
| **Under DGE Review** | Recommended Budget (set by DGE/SME) |
| **Allocation** | Allocated Budget |
| **Utilization** | Utilization Amount (monthly breakdown) |

This means at any given time, a project's GL Code row may show up to 4 different budget values depending on how far the cycle has progressed.

---

## 6. Strategy Team — Governance & Monitoring

The Strategy Team has a governance layer that spans **all stages** of the cycle.

### ADGE Tracker
A master dashboard showing all ADGEs with:
- Current stage/status for each ADGE
- Number of projects per ADGE
- Budget summary: Requested / Recommended / Allocated / Utilization
- Pending clarifications flag (if any clarification is awaiting ADGE response)
- **AI-based deadline alerts:** If an ADGE hasn't started working and the deadline is close, AI flags it proactively
- Option to send custom notification to flagged entities ("Hurry up" notifications)

### SME Teams Tracker
- Progress view for each SME Team: total assigned, reviewed so far, pending
- Deadline visibility per team
- Export to Excel

### General Strategy Team Powers (All Stages)
- View all projects at every stage, every time
- Edit anything at any stage
- Manage planning and allocation time windows per cycle
  - Default: Planning = Q3 of prior year, DGE Review = Q4 of prior year, Allocation = Q1 of current year
- Extend planning/allocation phase for all entities or selected entities individually
- Move any ADGE back to a previous stage and extend its time
- Auto-advance rule: if cycle stage time expires, ADGE automatically moves to next stage — unless Strategy Team extends it
- Export any list/grid to Excel (with column selection)

---

## 7. Notifications System

Notifications are stored in `dga_app_notifications`.

| statuscode | Meaning |
|-----------|---------|
| `1` | Open / Unread |
| `576610001` | Read / Closed |

### Key Notification Triggers
| Action | Who Gets Notified |
|--------|------------------|
| Respondent submits to Reviewer | Reviewer |
| Reviewer submits to Approver | Approver |
| Reviewer raises clarification | Respondent |
| Approver raises clarification | Respondent |
| Respondent responds to clarification | Whoever raised it (Reviewer or Approver) |
| Approver submits to DGE | Strategy Team |
| Strategy Team assigns to SME | SME Team (count notification, not per project) |
| SME raises clarification | ADGE (shown as "DGE Team") |
| ADGE responds to DGE clarification | The DGE user who raised it |
| Strategy Director publishes results | All ADGEs |
| Allocation phase begins | ADGE Respondent + Approver |
| Allocation submitted to DGE | Strategy Team |

---

## 8. AI Features (Embedded Across the App)

All AI features use a **standard color coding** so they are visually distinct for users.

| Screen / Context | AI Feature |
|-----------------|-----------|
| Strategic Alignment screen | Flag projects with potentially wrong Strategic Priority/Classification |
| SME Review screen | Document summarization, Recommendation suggestion, Risk highlights, Budget alignment check |
| Strategy Team ADGE Tracker | Deadline-based flagging of entities not yet started |
| All dashboard/home screens | AI-generated summary of current state and what the user needs to do next |
| Planning (Respondent home) | "You have X drafts, Y submitted, deadline is Z" |
| Planning (Reviewer home) | "X submitted to you, you've reviewed Y, Z remaining" |
| Planning (Approver home) | "X with Respondent, Y with Reviewer, Z need your approval, submit deadline is..." |
| Under DGE Review (Strategy Team) | "X projects need strategic alignment review, Y assigned to SME, Z in quality check" |
| SME home | "X projects assigned, Y reviewed, deadline is Z" |

---

## 9. Technical Context (Session & Ownership)

### Session Storage Keys
```
sessionStorage["moduleConfigTeamIDs"]   // Team config IDs
sessionStorage["userTeams"]             // Current user's teams
sessionStorage["userID"]                // Current user ID
sessionStorage["currentRole"]           // Active role
sessionStorage["instanceID"]            // Cycle instance ID
sessionStorage["instanceDetail"]        // Cycle details
sessionStorage["currentCycle"]          // Active cycle
sessionStorage["cycles"]               // All available cycles
```

### Role-specific Account Context
```
respondentAccount / respondentAccountName / respondentModuleConfigId
reviewerAccount / reviewerAccountName / reviewerModuleConfigId
approverAccount / approverAccountName / approverModuleConfigId
```

### Record Ownership
Workflow transitions update:
- `ownerid` — moves between role contexts as project progresses
- Role-specific actor lookups: `dga_respondent_systemuser`, `dga_reviewer_systemuser`, `dga_approver_systemuser`
- Record is shared via `dga_WebApiForPortal` when ownership changes or clarification flow requires previous-role visibility

### Cycle Switching
Every user can **switch cycle** at any time. Switching cycle changes the entire application context — all project lists, trackers, and dashboards show data only for the selected cycle.

---

## 10. General UX Rules

- **Every screen** should show the user an **AI-generated summary** of what is happening and what they need to do next — in simple, clear language
- **Deadline visibility** should be present wherever relevant
- **Progress indicators** (how many done vs. total) should be present for all review/approval flows
- **Bulk actions** must be available wherever individual actions exist
- **Export to Excel** is available on every list/grid, with column selection
- **Clarification threads** show file attachments and are threaded per project
- **SLA timers** (3 days) are visible on every open clarification
- **Cycle stage indicator** is always visible to the user (Planning / Under DGE Review / Allocation / Utilization)
- ADGE users **never see DGE individual user names** — always "DGE Team"
- DGE users can see full details of all entities and all projects at all times

---

## 11. What Has Been Built vs. What Is Next

### ✅ Already Implemented
- Full ADGE-side workflow (Respondent → Reviewer → Approver → Submit to DGE)
- All ADGE workflow states (`dga_status_for_adge` 1–6, 12)
- Clarification flow between ADGE roles
- Notifications for ADGE workflow transitions
- Post-DGE shortcut flow for subsequent projects

### 🔲 To Be Implemented Next (Current Focus)
- **Strategy Team screens:**
  - Strategic Alignment Review screen (with AI flagging)
  - ADGE Tracker dashboard
  - SME Teams Tracker
  - Quality Check workflow
  - Cycle time management (extend/move stages)
- **SME Reviewer screens:**
  - Project review screen with AI decision-support panel
  - Review progress tracker
  - Clarification flow with ADGE and Strategy Team
  - Strategic Priority change request flow
- **Strategy Director screens:**
  - Final approval screen (bulk + individual)
  - Publish Results action
- **DGE-side workflow states** (new `dga_status_for_adge` values to be defined for DGE stages)
- **Allocation stage** screens for ADGE
- **Utilization stage** screens for ADGE
