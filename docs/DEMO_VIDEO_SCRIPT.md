# Grant Guardian — 5-Minute Submission Video Script & Walkthrough

**Target Duration**: 4 minutes 55 seconds (Strictly within the 5-minute hackathon limit)  
**Tone**: Authoritative, calm, technically precise. Not a generic hype reel—a masterclass in autonomous research integrity and human-in-the-loop restraint.

---

### [0:00 – 0:20] The Hook: The Silent Crisis of Research Integrity

**Visual**: Close-up of a high-profile retracted paper notice (e.g. STAP cells in *Nature*), then pan to an early-career Principal Investigator drafting an NIH R01 / NSF grant proposal with dozens of literature citations.

**Speaker (Voiceover)**:
> "For an early-career Principal Investigator writing an NIH R01 or NSF CAREER grant proposal, a single undetected retracted reference isn't just an embarrassment—it is career-threatening: an immediate award rejection, a mandatory 12-month federal Office of Research Integrity inquiry, and the loss of a $1.5 million federal grant. According to a landmark *Nature* analysis, over 10,000 papers were retracted in 2023 alone. And when a foundational paper collapses, hundreds of downstream grant proposals inherit that rot silently—without the PI ever knowing."

---

### [0:20 – 0:35] Introducing Grant Guardian

**Visual**: Screen transitions to the Grant Guardian PI Executive Desk (`Dr. Elena Rossi / Materials Lab`). Clean, modern status board with live provider badges: Crossref, Retraction Watch, Strands SDK, AWS Bedrock.

**Speaker**:
> "This is Grant Guardian—an autonomous research integrity and compliance agent built on AWS Bedrock and the Strands Agent framework. Guardian is built specifically for early-career PIs and laboratory directors. It runs silently in the background, continuously watching two critical risks: citation rot and compliance drift. The Strands Agent drives multi-step tool investigation; ambiguous scientific decisions are surfaced to the researcher."

---

### [0:35 – 1:30] Demonstration 1: The Power of Silence (Autonomous Watch Mode)

**Visual**: Click on the Autonomous Watch Mode banner. Show the morning sweep summary.

**Speaker**:
> "Most AI assistants spam you with notifications. Grant Guardian's core philosophy is **silence when everything is fine, interrupt only when action is required**.
>
> Watch: Guardian wakes up every morning and performs an autonomous sweep across Dr. Rossi's reference register. It queries Crossref, verifies retraction sources, and checks upcoming compliance deadlines.
>
> For clean citations—like Jumper et al.'s AlphaFold study—Guardian checks the literature, confirms no retraction or errata notices, and stays completely quiet. A quiet heartbeat log is recorded. Zero distractions. The researcher stays in flow."

---

### [1:30 – 2:30] Demonstration 2: Direct Retraction Auto-Quarantine & Provenance

**Visual**: Navigate to the Citation Health register. Click on the Obokata STAP paper (`10.1038/nature13358`). Open the Source Inspection drawer.

**Speaker**:
> "Now, what happens when a paper in your bibliography is actually compromised?
> 
> Here, Guardian flagged Obokata et al.'s STAP cell paper in Nature. Notice what happened automatically:
> 1. Guardian quarantined the citation, isolating it from active grant drafts.
> 2. It generated a complete, observable **Trace Audit Sequence**.
> 
> Let's inspect the drawer. Look at the exact sequence:
> - Crossref resolved the DOI and verified publisher errata relations in 142ms.
> - Retraction Watch confirmed the direct retraction: image manipulation and data fabrication.
> - Guardian's deterministic safety policy quarantined the paper automatically.
> 
> Every step has an exact ISO timestamp, provider status badge, source URL, and raw payload. Nothing is fabricated. Everything is observable."

---

#### [2:30 – 3:30] THE KILLER DEMO: Live Propagation Risk & Human Decision Inbox

**Visual**: Navigate to Lin et al.'s paper (`Cell Stem Cell`, `10.1016/j.stem.2015.01.002`). Show that this paper *itself* is NOT retracted. Then show the Human Decision Inbox alert banner.
**Speaker**:
> "Here is the standout technical innovation of Grant Guardian.
> 
> Look at this paper by Lin et al. on downstream tissue engineering. If you check this paper on PubMed or Crossref today, it looks 100% clean. It has never been retracted.
> 
> But Guardian's Strands Agent doesn't just check the surface. It traverses the citation graph using Semantic Scholar, retrieves the paper's 1-hop references, and **dynamically queries live Retraction Watch data for every single referenced work**.
> 
> And look at what it discovered: in section 3.2, Lin et al. cited the retracted Obokata paper.
> 
> Now, here is where most AI tools fail: an LLM might hallucinate that Lin's paper is retracted, or silently ignore it. **Guardian does neither.**
> 
> Guardian routes it to the **Human Decision Inbox**:
> *'Guardian cannot determine whether Lin's scientific claim actually depends on the retracted STAP protocol. Principal Investigator judgment required.'*
> 
> As Dr. Rossi, I click **Inspect Trace**. I see the retracted foundation paper. I review my hypothesis.
> - If my project depends on that specific finding, I click **[Mark Relevant]** to quarantine it.
> - If my claim is scientifically independent, I click **[Mark Not Relevant]**, enter my lab notes, and Guardian stores my verified clearance permanently in PostgreSQL (updating our register).
> 
> The agent handles the deep investigation. The scientist keeps the judgment."

---

### [3:30 – 4:15] Demonstration 4: Autonomous Compliance Drafting
**Visual**: Navigate to Compliance Desk. Show the NSF Annual Progress Report deadline (due in 9 days, progress 72%). Show the draft drawer.
**Speaker**:
> "Next: compliance drift. Dr. Rossi has an NSF Annual Report due in 9 days, currently at 72% progress.
> 
> Because this deadline entered the 14-day preparation window, Guardian's Autonomous Watch engine automatically prepared a preliminary draft.
> 
> Look at the draft: it summarizes accomplishments from lab activity, flags risks, and organizes next steps.
> 
> But observe the invariant: **Guardian never submits the report**. A bright banner explicitly enforces: *'Draft generated for PI review and signoff. Guardian cannot sign or submit external compliance documents.'*
> 
> Dr. Rossi reviews, makes final edits, approves the draft, and signs it herself. True human-in-the-loop compliance."

---

### [4:15 – 4:45] Technical Architecture & 53 Automated Tests
**Visual**: Display of the Strands Agent tool orchestration sequence feeding the deterministic guardrail, then terminal showing `pnpm run test:all` passing all 53 tests (43 TypeScript + 10 Python).

**Speaker**:
> "Under the hood, Grant Guardian puts the **Strands Agent as the true decision-maker**:
> 1. The Strands Agent actively executes the multi-step investigation loop across Crossref, Retraction Watch, and Semantic Scholar.
> 2. The TypeScript backend consumes the agent's tool-call trace as verified evidence.
> 3. Our **Deterministic Safety Boundary** enforces the conservative human-in-the-loop invariant.
> 
> We prove this with **53 automated tests**:
> - Real dynamic tool selection branching and Bedrock transcript replay tests in Python.
> - Structural prompt injection immunity and registry outage circuit breakers in TypeScript.
> - Proof of restraint: second-order propagation is mathematically prevented from auto-retracting without human review."

---

### [4:45 – 5:00] The Closing Pitch

**Visual**: Return to the live dashboard with the Autonomous Watch pulsing indicator. Clean logo and GitHub link.

**Speaker**:
> "Research integrity shouldn't depend on luck or manual searching after it's too late.
> 
> **Grant Guardian handles the repetitive investigation. Humans keep the judgment.**
> 
> Thank you."

---

### Production Checklist for Recording
- [ ] Screen resolution set to 1080p (1920x1080) at 60fps.
- [ ] Ensure terminal test run (`pnpm test` and `python agent-service/test_agent_service.py`) runs all tests cleanly.
- [ ] Show the live interactive clicks on [Simulate Morning Sweep] and [Mark Not Relevant].
- [ ] Keep video length under 4:58 to safely clear the 5:00 hackathon cutoff.
