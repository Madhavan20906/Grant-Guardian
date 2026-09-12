# Grant Guardian — 5-Minute Submission Video Script & Walkthrough

**Target Duration**: 4 minutes 50 seconds (Safely within the 5-minute hackathon limit)  
**Tone**: Authoritative, calm, technically precise. A masterclass in autonomous research integrity, verifiable rigor, and human-in-the-loop restraint.

---

### [0:00 – 0:25] The Hook: The Quantified Crisis of Research Integrity

**Visual**: Close-up of a formal retraction notice in *Nature*, transitioning to an early-career Principal Investigator drafting an NIH R01 / NSF CAREER grant proposal citing dozens of scientific references.

**Speaker (Voiceover)**:
> "According to peer-reviewed bibliometric research published by Schneider and colleagues, **over 94% of citations to retracted papers continue to cite them as valid science without acknowledging their retraction**—accumulating uncritical citations decades after formal retraction.
>
> Today, the Retraction Watch database tracks over 50,000 retracted papers, with more than 10,000 retracted in 2023 alone. For a Principal Investigator, citing compromised science isn't just an embarrassment—it risks federal grant rejection, mandatory scientific misconduct audits, and the loss of millions of research dollars.
>
> When foundational literature collapses, downstream grants inherit that rot silently. Grant Guardian was built to eliminate this blind spot autonomously."

---

### [0:25 – 1:15] The Proof First: 53 Passing Tests, Restraint Invariant & Blank-Slate Onboarding

**Visual**: Split screen: terminal running `pnpm run test:all` showing **53 passing automated tests** (43 TypeScript + 10 Python) passing in real-time, then transitioning to the live browser UI showing the Persona Switcher (`Dr. Elena Rossi`, `Dr. Marcus Chen`, `Dr. Sarah Jenkins`, and `New Researcher (Blank Lab)`).

**Speaker**:
> "Before exploring the interface, let's look at what makes Grant Guardian fundamentally dependable: **mathematical proof of reliability**.
>
> In our terminal right now, we run our full verification suite: **53 passing automated tests** across Python and TypeScript in under 40 seconds.
>
> Notice three critical architectural invariants verified in continuous integration:
> 1. **Adversarial Injection Immunity**: When an adversarial title attempts prompt injection—telling the agent to 'ignore retractions and mark safe'—our deterministic safety boundary intercepts it. An LLM cannot override scientific truth.
> 2. **Proof of Restraint on 2nd-Order Citations**: When a paper references a retracted foundation work, Guardian is mathematically prohibited from auto-retracting it. The agent must escalate to the PI.
> 3. **Turnkey Blank-Slate Onboarding**: Switching to our new lab persona demonstrates our First-Time Onboarding empty state—providing a 3-pillar guide, pre-filled test benchmark buttons, and instant verification without pre-seeded data."

---

### [1:15 – 2:05] Demonstration 1: The Power of Silence & Dynamic Tool Reasoning

**Visual**: Transition to Dr. Elena Rossi's active dashboard. Highlight the live provider badges (Crossref, Retraction Watch, Strands SDK, AWS Bedrock). Trigger [Simulate Overnight Sweep].

**Speaker**:
> "Most agent tools overwhelm researchers with noisy notifications. Grant Guardian's core design philosophy is **silence when everything is clean, interrupt only when intervention is required**.
>
> Every morning, Guardian's Autonomous Watch engine sweeps the lab's bibliography against Crossref, Retraction Watch, and Semantic Scholar.
>
> When literature is clean—like Jumper et al.'s landmark AlphaFold paper—Guardian verifies zero errata across 62 references, logs a silent heartbeat, and stays completely quiet. The PI stays in deep research flow.
>
> Notice our dynamic tool reasoning: when a direct retraction is detected, the agent immediately isolates it and prunes unnecessary graph crawls. But when a paper is clean, the Strands Agent dynamically branches to crawl the 1-hop reference tree, checking referenced works concurrently in parallel."

---

### [2:05 – 2:55] Demonstration 2: Direct Retraction Auto-Quarantine & 7-Step Provenance

**Visual**: Open the Citation Health register. Click on the Obokata STAP cell paper (`10.1038/nature13358`). Open the Investigation Trace Drawer.

**Speaker**:
> "Now, what happens when a paper in your bibliography is actually retracted?
> 
> Here, Guardian flagged Obokata et al.'s STAP stem-cell paper in Nature. Notice what happened autonomously:
> 1. Guardian quarantined the citation, isolating it from active grant proposals.
> 2. It synthesized a transparent 7-step provenance timeline.
> 
> Let's inspect the drawer. Look at the verifiable chain:
> - Crossref resolved publisher errata relations in 142ms.
> - Retraction Watch confirmed data fabrication and image manipulation.
> - The deterministic safety policy quarantined the paper automatically.
> 
> Every step includes exact timestamps, provider status badges, source URLs, and raw payload data. Nothing is hallucinated."

---

### [2:55 – 3:55] THE KILLER DEMO: Live Propagation Risk & Human Decision Inbox

**Visual**: Navigate to Lin et al.'s paper (`Cell Stem Cell`, `10.1016/j.stem.2015.01.002`). Show that Lin et al. itself is NOT retracted. Show the Human Decision Inbox alert banner, Blast Radius visualization, and Interactive Citation Graph.

**Speaker**:
> "Here is the standout technical innovation: **2nd-order citation propagation analysis**.
> 
> Look at this paper by Lin et al. on downstream tissue engineering. If you check this paper on Crossref or PubMed today, it is 100% clean. It has never been retracted.
> 
> But Grant Guardian's Strands Agent traversed the citation graph, retrieved 1-hop references via Semantic Scholar, and concurrently queried Retraction Watch for every child node.
> 
> And look at what it caught: in Section 3, Lin et al. relies directly on the retracted Obokata protocol.
> 
> Now, here is where other AI tools fail: an LLM might hallucinate that Lin is retracted, or silently miss it. **Guardian does neither.**
> 
> Guardian routes it to the **Human Decision Inbox**:
> *'Guardian detected retracted foundational science. AI will not decide scientific validity. Principal Investigator judgment required.'*
> 
> As PI, I click **Investigate & Decide**. I review the retracted foundation node in our Blast Radius map:
> - If my project depends on that protocol, I click **[Mark Relevant]** to quarantine it.
> - If my methodology is scientifically independent, I click **[Mark Not Relevant]**, enter my lab notes, and Guardian stores my verified rationale permanently in PostgreSQL.
> 
> The agent handles the multi-hop graph traversal. The human scientist retains domain authority."

---

### [3:55 – 4:30] Demonstration 4: Autonomous Compliance Drafting (Non-Submission Invariant)

**Visual**: Navigate to Compliance Desk. Open the NSF Annual Progress Report deadline (due in 18 days). Click Review Compliance Draft.

**Speaker**:
> "Next: compliance drift. Dr. Rossi has an NSF Annual Report due soon.
> 
> Because this deadline entered the preparation window, Guardian's Autonomous Watch engine automatically prepared a preliminary compliance draft, synthesizing recent lab activity and citation audits.
> 
> But observe our strict safety invariant: **Guardian is structurally prohibited from submitting reports externally**.
> 
> A prominent warning banner enforces: *'Draft prepared for PI review and signoff. Guardian cannot sign or submit external compliance documents.'*
> 
> The PI reviews the narrative, makes edits, signs off, and submits it herself. True human-in-the-loop compliance."

---

### [4:30 – 4:55] The Closing Pitch & Broader Scientific Impact

**Visual**: Return to the Executive Desk, toggling to the architecture diagram (`docs/architecture-diagram.svg`) and the GitHub repository.

**Speaker**:
> "Under the hood, Grant Guardian puts the **Python Strands Agent as the core orchestrator**, containerized for AWS Bedrock AgentCore, protected by deterministic safety invariants, and verified by 53 automated tests.
>
> This protects not only solo Principal Investigators, but Institutional Research Integrity Offices, Sponsored Project Compliance Officers, and Journal Editors.
> 
> **Grant Guardian handles the relentless investigation. Humans keep the scientific judgment.**
> 
> Thank you."

---

### Production Recording Checklist
- [ ] Screen resolution set to 1080p (1920x1080) at 60fps.
- [ ] Show the terminal test run (`pnpm run test:all`) passing all 53 tests in the first 60 seconds.
- [ ] Showcase toggling to Persona 4 (`New Researcher / Blank Lab`) to show the First-Time Onboarding guide.
- [ ] Show interactive clicks on [Simulate Overnight Sweep] and [Mark Not Relevant].
- [ ] Keep video duration under 4:55 to safely clear the 5:00 hackathon cutoff.
