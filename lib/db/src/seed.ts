export const demoUser = { id: 1, name: "Elena Rossi", email: "elena.rossi@example.org", role: "PI" };

export const demoCitations = [
  {
    id: 1,
    userId: 1,
    title: "Stimulus-triggered fate conversion of somatic cells into pluripotency",
    authors: "Obokata et al.",
    venue: "Nature",
    year: 2014,
    doi: "10.1038/nature13358",
    status: "retracted",
    risk: "high",
    detail: "Retraction Watch flagged a direct retraction notice (Retracted July 2, 2014 due to image duplication). Do not cite.",
    metadata: {
      graph: { rootDoi: "10.1038/nature13358", referencedDois: ["10.1038/nature02000"], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "crossref", status: "success", label: "Crossref Metadata Lookup", detail: "Metadata retrieved. Article indexed in Nature (2014).", durationMs: 142 },
        { step: "retraction_watch", status: "flagged", label: "Retraction Watch Database", detail: "MATCH CONFIRMED: Retracted on 2014-07-02 (Image Manipulation & Unreliable Data).", durationMs: 88 },
        { step: "citation_graph", status: "success", label: "Semantic Scholar Graph (1-Hop)", detail: "Traversed 18 references. No downstream propagation dependencies.", durationMs: 210 },
        { step: "decision", status: "danger", label: "Guardian Safety Policy", detail: "Direct retraction signal confirmed. Flagged automatically; citation quarantined.", durationMs: 15 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    userId: 1,
    title: "Downstream applications of stimulus-triggered pluripotency in tissue engineering",
    authors: "Lin et al.",
    venue: "Cell Stem Cell",
    year: 2015,
    doi: "10.1016/j.stem.2015.01.002",
    status: "propagation",
    risk: "medium",
    detail: "Crossref citation graph traversal found 1-hop reference to retracted paper 10.1038/nature13358. Effect on your claim is context-dependent; routed for human judgment.",
    metadata: {
      graph: { rootDoi: "10.1016/j.stem.2015.01.002", referencedDois: ["10.1038/nature13358", "10.1038/nature03819"], retractedReferencedDois: ["10.1038/nature13358"], depth: 1 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "crossref", status: "success", label: "Crossref Metadata Lookup", detail: "Metadata retrieved. Article indexed in Cell Stem Cell (2015).", durationMs: 120 },
        { step: "retraction_watch", status: "success", label: "Retraction Watch Database", detail: "Direct DOI check clear. No direct retraction notice recorded for this paper.", durationMs: 76 },
        { step: "citation_graph", status: "warning", label: "Semantic Scholar Graph (1-Hop)", detail: "Found 1 reference to retracted DOI 10.1038/nature13358 in section 3.2.", durationMs: 315 },
        { step: "decision", status: "warning", label: "Guardian Safety Policy", detail: "Ambiguous 2nd-order propagation risk detected. Guardian will not auto-decide; escalated to human researcher.", durationMs: 18 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    userId: 1,
    title: "Deep learning for protein structure prediction",
    authors: "Jumper et al.",
    venue: "Nature",
    year: 2021,
    doi: "10.1038/s41586-021-03819-2",
    status: "clear",
    risk: "low",
    detail: "All provider checks cleared. Zero retractions or propagation risks found.",
    metadata: {
      graph: { rootDoi: "10.1038/s41586-021-03819-2", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "crossref", status: "success", label: "Crossref Metadata Lookup", detail: "Metadata verified. Publisher: Nature Portfolio.", durationMs: 105 },
        { step: "retraction_watch", status: "success", label: "Retraction Watch Database", detail: "Clean. No retractions or expressions of concern.", durationMs: 64 },
        { step: "citation_graph", status: "success", label: "Semantic Scholar Graph (1-Hop)", detail: "Graph traversed 62 references. All clean.", durationMs: 198 },
        { step: "decision", status: "success", label: "Guardian Safety Policy", detail: "Status: Clear pass. Citation safe to cite.", durationMs: 12 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    userId: 1,
    title: "The social contagion of suicide",
    authors: "Cheng et al.",
    venue: "PLoS ONE",
    year: 2018,
    doi: "10.1371/journal.pone.0208326",
    status: "corrected",
    risk: "medium",
    detail: "Crossref reported an official publisher correction notice published on 2019-03-14 regarding dataset sample size adjustments.",
    metadata: {
      graph: { rootDoi: "10.1371/journal.pone.0208326", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "crossref", status: "warning", label: "Crossref Metadata Lookup", detail: "Publisher Correction Notice linked (2019-03-14).", durationMs: 130 },
        { step: "retraction_watch", status: "success", label: "Retraction Watch Database", detail: "No retraction notice. Only correction logged.", durationMs: 70 },
        { step: "citation_graph", status: "success", label: "Semantic Scholar Graph (1-Hop)", detail: "Reference graph clear.", durationMs: 180 },
        { step: "decision", status: "warning", label: "Guardian Safety Policy", detail: "Correction flagged for PI awareness. Paper remains valid with updated errata.", durationMs: 14 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 5,
    userId: 1,
    title: "The effects of remote work on productivity",
    authors: "Bloom et al.",
    venue: "Quarterly Journal of Economics",
    year: 2015,
    doi: "10.1093/qje/qju032",
    status: "clear",
    risk: "low",
    detail: "Verified clear across Crossref and Retraction Watch datasets.",
    metadata: {
      graph: { rootDoi: "10.1093/qje/qju032", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "crossref", status: "success", label: "Crossref Metadata Lookup", detail: "Clean record.", durationMs: 95 },
        { step: "retraction_watch", status: "success", label: "Retraction Watch Database", detail: "Clean record.", durationMs: 60 },
        { step: "citation_graph", status: "success", label: "Semantic Scholar Graph (1-Hop)", detail: "Clean reference graph.", durationMs: 160 },
        { step: "decision", status: "success", label: "Guardian Safety Policy", detail: "Cleared.", durationMs: 10 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const demoDeadlines = [
  { id: 1, userId: 1, type: "IRB renewal", title: "Human Subjects Protocol 24-118", dueDate: new Date(Date.now() + 11 * 86400000), progress: 72, status: "due_soon" },
  { id: 2, userId: 1, type: "Funding report", title: "NSF CAREER annual progress report", dueDate: new Date(Date.now() + 52 * 86400000), progress: 38, status: "on_track" },
  { id: 3, userId: 1, type: "Data management", title: "NIH Data Management & Sharing update", dueDate: new Date(Date.now() + 3 * 86400000), progress: 12, status: "attention" },
];

export const demoActivities = [
  { id: 1, userId: 1, kind: "flagged", title: "Retraction signal caught: STAP Stem Cell Study", description: "Retraction Watch identified direct retraction notice for 10.1038/nature13358 (Obokata et al. 2014). Paper quarantined.", tone: "danger", createdAt: new Date() },
  { id: 2, userId: 1, kind: "escalation", title: "Propagation risk routed to PI: Lin et al. (2015)", description: "Semantic Scholar 1-hop graph found reference to retracted DOI 10.1038/nature13358. Escalated for human claim evaluation.", tone: "warning", createdAt: new Date() },
  { id: 3, userId: 1, kind: "scan", title: "Guardian full desk sweep completed", description: "Scanned 5 citations using Crossref, Retraction Watch, and Semantic Scholar graph traversal. Strands Agent trace recorded.", tone: "neutral", createdAt: new Date() },
];

export async function ensureSeedData() {
  try {
    const [existing] = await db.select().from(users).where(eq(users.email, "elena.rossi@example.org")).limit(1);
    if (existing) return existing.id;
    const [user] = await db.insert(users).values({ name: "Elena Rossi", email: "elena.rossi@example.org", role: "PI" }).returning();
    await db.insert(preferences).values({ userId: user.id });
    await db.insert(citations).values(demoCitations);
    await db.insert(deadlines).values(demoDeadlines);
    await db.insert(activities).values(demoActivities);
    return user.id;
  } catch (_error) {
    return 1;
  }
}