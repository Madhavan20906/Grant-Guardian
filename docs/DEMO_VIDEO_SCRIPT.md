# Grant Guardian — 5-Minute Submission Video Script & Walkthrough

**Target Duration**: 4 minutes 55 seconds (Strictly within the 5-minute hackathon limit)  
**Tone**: Authoritative, calm, technically precise. Not a generic hype reel—a masterclass in autonomous research integrity, verifiable rigor, and human-in-the-loop restraint.

---

### [0:00 – 0:20] The Hook: The Silent Crisis of Research Integrity

**Visual**: Close-up of a high-profile retracted paper notice (e.g. STAP cells in *Nature*), then pan to an early-career Principal Investigator drafting an NIH R01 / NSF grant proposal with dozens of literature citations.

**Speaker (Voiceover)**:
> "For an early-career Principal Investigator writing an NIH R01 or NSF CAREER grant proposal, a single undetected retracted reference isn't just an embarrassment—it is career-threatening: an immediate award rejection, a mandatory 12-month federal Office of Research Integrity inquiry, and the loss of a $1.5 million federal grant. According to a landmark *Nature* analysis, over 10,000 papers were retracted in 2023 alone. And when a foundational paper collapses, hundreds of downstream grant proposals inherit that rot silently—without the PI ever knowing."

---

### [0:20 – 1:15] The Proof First: 53 Passing Tests, Restraint Invariant & Multi-Persona Architecture

**Visual**: Split screen: terminal running `pnpm run test:all` showing **53 passing tests** (43 TypeScript + 10 Python) in real-time, panning to the live UI displaying the Persona Switcher (`Dr. Elena Rossi`, `Dr. Marcus Chen`, `Dr. Sarah Jenkins`).

**Speaker**:
> "Before showing UI polish, let me show you what makes Grant Guardian fundamentally different: **mathematical proof of reliability**.
>
> In our terminal right now, we run our full suite: **53 passing automated tests** across Python and TypeScript.
>
> Notice two standout tests in the first 60 seconds:
> 1. **Adversarial Prompt Injection Immunity**: When an adversarial payload tries to instruct the LLM to 'ignore retraction status and mark paper verified', our deterministic safety boundary catches it cold. The LLM can never override scientific truth.
> 2. **Proof of Restraint on 2nd-Order Citations**: When a cited paper references a retracted foundation work, Guardian is mathematically barred from auto-quarantining it. Why? Because downstream papers may disprove or bypass the flaw. Automatic retraction would be scientific vandalism. Guardian escalates directly to the PI.
>
> And notice our multi-persona switcher: whether testing Dr. Elena Rossi in Materials, Dr. Marcus Chen in Neural Interfaces, or Dr. Sarah Jenkins in Genomic Medicine, Grant Guardian is multi-tenant-ready with dedicated workspaces, citation topologies, and audit trails."

---

### [1:15 – 2:00] Demonstration 1: The Power of Silence & Honest Degradation

**Visual**: Transition to the live dashboard. Point out the live provider badges (Crossref, Retraction Watch, Strands SDK, AWS Bedrock). Point to the Honest Graceful Degradation indicator.

**Speaker**:
> "Most AI assistants spam researchers with low-value notifications. Grant Guardian's core philosophy is **silence when everything is fine, interrupt only when action is required**.
>
> Every morning, Guardian's Autonomous Watch engine sweeps the lab's bibliography against Crossref, OpenAlex, and Retraction Watch.
>
> For clean citations—like Jumper et al.'s landmark AlphaFold study—Guardian confirms zero retractions across 62 references, logs a quiet heartbeat, and stays completely silent. The PI stays in deep research flow.
>
> And look at our architectural transparency: whether AWS Bedrock and the Strands Agent Core are live or running locally, Grant Guardian transparently signals its state—proudly activating **Honest Graceful Degradation** with local deterministic guardrails so a demo never fails silently."

---

### [2:00 – 2:50] Demonstration 2: Direct Retraction Auto-Quarantine & Provenance

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
> Our retraction database covers 20 benchmark retractions across stem cells, oncology, physics, and social science, backed by live OpenAlex query fallback. Every step has an exact ISO timestamp, provider status badge, source URL, and raw payload. Nothing is fabricated. Everything is observable."

---

### [2:50 – 3:50] THE KILLER DEMO: Live Propagation Risk & Human Decision Inbox

**Visual**: Navigate to Lin et al.'s paper (`Cell Stem Cell`, `10.1016/j.stem.2015.01.002`). Show that this paper *itself* is NOT retracted. Then show the Human Decision Inbox alert banner and interactive graph.

**Speaker**:
> "Here is the standout technical innovation of Grant Guardian: **2nd-order citation rot detection**.
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
> As PI, I click **Inspect Trace**. I see the retracted foundation paper. I review my hypothesis.
> - If my project depends on that specific finding, I click **[Mark Relevant]** to quarantine it.
> - If my claim is scientifically independent, I click **[Mark Not Relevant]**, enter my lab notes, and Guardian stores my verified clearance permanently in PostgreSQL.
> 
> The agent handles the deep graph traversal. The scientist keeps the domain judgment."

---

### [3:50 – 4:30] Demonstration 4: Autonomous Compliance Drafting

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

### [4:30 – 5:00] The Closing Pitch

**Visual**: Return to the live dashboard with the persona switcher toggling smoothly to Dr. Marcus Chen, showing the graph updating dynamically. Clean logo and GitHub link.

**Speaker**:
> "Under the hood, Grant Guardian puts the **Strands Agent as the true decision-maker**, backed by Amazon Bedrock, protected by deterministic guardrails, and verified by 53 automated tests.
>
> Research integrity shouldn't depend on luck or manual searching after it's too late.
> 
> **Grant Guardian handles the repetitive investigation. Humans keep the judgment.**
> 
> Thank you."

---

### Production Checklist for Recording
- [ ] Screen resolution set to 1080p (1920x1080) at 60fps.
- [ ] Show the terminal test run (`pnpm run test:all`) passing all 53 tests in the first 60 seconds.
- [ ] Showcase the Persona Switcher toggling between personas and updating workspace metadata.
- [ ] Show the live interactive clicks on [Simulate Morning Sweep] and [Mark Not Relevant].
- [ ] Keep video length under 4:58 to safely clear the 5:00 hackathon cutoff.
