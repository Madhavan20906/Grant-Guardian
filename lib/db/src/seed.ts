import { eq } from "drizzle-orm";
import { db } from "./index";
import { activities, citations, deadlines, preferences, users } from "./schema";

export const demoUser = { id: 1, name: "Elena Rossi", email: "elena.rossi@example.org", role: "PI" };

export interface PersonaProfile {
  id: number;
  slug: string;
  name: string;
  email: string;
  role: string;
  title: string;
  lab: string;
  institution: string;
  proposalName: string;
  initials: string;
  focus: string;
}

export const demoPersonas: PersonaProfile[] = [
  {
    id: 1,
    slug: "elena",
    name: "Elena Rossi",
    email: "elena.rossi@example.org",
    role: "PI",
    title: "Dr. Elena Rossi",
    lab: "Materials Science & Biomaterials Lab",
    institution: "Institute for Bioengineering",
    proposalName: "NSF CAREER Proposal (Biomaterials)",
    initials: "ER",
    focus: "Tissue Engineering & Regenerative Scaffolds",
  },
  {
    id: 2,
    slug: "marcus",
    name: "Marcus Chen",
    email: "marcus.chen@example.org",
    role: "PI",
    title: "Dr. Marcus Chen",
    lab: "Computational Oncology & Genomics Lab",
    institution: "Comprehensive Cancer Center",
    proposalName: "NIH R01 Proposal (Computational Oncology)",
    initials: "MC",
    focus: "Cancer Biomarkers & Clinical Microarrays",
  },
  {
    id: 3,
    slug: "sarah",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@example.org",
    role: "Assoc. Prof",
    title: "Dr. Sarah Jenkins",
    lab: "Neurobiology & Molecular Therapeutics Lab",
    institution: "School of Medicine & Health Sciences",
    proposalName: "NIH R21 Proposal (Translational Neuro)",
    initials: "SJ",
    focus: "Translational Medicine & COVID-19 Therapeutics",
  },
  {
    id: 4,
    slug: "new-lab",
    name: "New Researcher (Blank Lab)",
    email: "new.pi@example.org",
    role: "PI",
    title: "First-Time PI (Blank State)",
    lab: "Your Laboratory / New Proposal",
    institution: "Your Research Institution",
    proposalName: "Custom Grant Proposal",
    initials: "PI",
    focus: "Custom Grant Literature & Deadlines",
  },
];

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
    detail: "Retraction Watch flagged a direct retraction notice (Retracted July 2, 2014 due to image duplication). Direct retraction isolated from active drafts.",
    metadata: {
      graph: { rootDoi: "10.1038/nature13358", referencedDois: ["10.1038/nature02000"], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Direct citation registered in active lab workspace bibliography.", durationMs: 12 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "Metadata retrieved. Indexed in Nature (2014). Crossref publisher status: Verified.", durationMs: 142 },
        { step: "retraction_watch", status: "flagged", label: "Step 3 — Query Retraction Watch", detail: "MATCH CONFIRMED: Retracted on 2014-07-02 (Image Manipulation & Data Fabrication).", durationMs: 88 },
        { step: "relationship", status: "flagged", label: "Step 4 — Verify Relationship", detail: "Publisher notice confirmed. Paper is primary target of formal retraction decree.", durationMs: 45 },
        { step: "propagation", status: "neutral", label: "Step 5 — Assess Propagation", detail: "No downstream propagation analysis needed for direct primary retraction.", durationMs: 10 },
        { step: "safety_policy", status: "danger", label: "Step 6 — Apply Safety Policy", detail: "Autonomous Quarantine Triggered: Direct retraction signal permits automatic isolation.", durationMs: 15 },
        { step: "decision", status: "danger", label: "Step 7 — Action Enforced", detail: "Quarantined permanently from grant drafts. Audit record logged.", durationMs: 5 }
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
    detail: "Multi-hop graph traversal found 2nd-order reliance on retracted paper 10.1038/nature13358. Autonomous quarantine prohibited; routed for PI judgment.",
    metadata: {
      graph: {
        rootDoi: "10.1016/j.stem.2015.01.002",
        referencedDois: ["10.1038/nature13358", "10.1038/nature03819"],
        retractedReferencedDois: ["10.1038/nature13358"],
        depth: 2,
        cascade: {
          project: "Active NSF Proposal (Tissue Scaffolds)",
          intermediatePaper: "Lin et al., Cell Stem Cell 2015 (10.1016/j.stem.2015.01.002)",
          retractedPaper: "Obokata et al., Nature 2014 (10.1038/nature13358)",
          retractionReason: "Image manipulation & unreliable pluripotency protocol"
        }
      },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Dependency mapped: Lab grant cites Lin et al. (2015) for tissue scaffold protocol.", durationMs: 18 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "Metadata retrieved. Article indexed in Cell Stem Cell (2015). Direct record is clean.", durationMs: 120 },
        { step: "retraction_watch", status: "success", label: "Step 3 — Query Retraction Watch", detail: "Direct check: Clean. Lin et al. itself has NEVER been retracted or issued errata.", durationMs: 76 },
        { step: "relationship", status: "warning", label: "Step 4 — Verify Relationship", detail: "Semantic Scholar 1-hop graph traversed 44 references. Found reference to 10.1038/nature13358 in section 3.2.", durationMs: 315 },
        { step: "propagation", status: "warning", label: "Step 5 — Assess Propagation", detail: "Potential 2nd-order impact: Foundational premise relies on retracted STAP protocol.", durationMs: 82 },
        { step: "safety_policy", status: "warning", label: "Step 6 — Apply Safety Policy", detail: "Autonomous quarantine NOT permitted. Scientific validity depends on researcher claim.", durationMs: 18 },
        { step: "decision", status: "warning", label: "Step 7 — Human Escalation", detail: "Escalated to Human Decision Inbox. Principal Investigator review required.", durationMs: 12 }
      ]
    },
    judgment: "pending",
    judgmentNotes: null,
    judgmentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    userId: 1,
    title: "Deep learning for protein structure prediction with AlphaFold",
    authors: "Jumper et al.",
    venue: "Nature",
    year: 2021,
    doi: "10.1038/s41586-021-03819-2",
    status: "clear",
    risk: "low",
    detail: "Verified clean across Crossref and Retraction Watch. Graph traversal across 62 references revealed zero retractions.",
    metadata: {
      graph: { rootDoi: "10.1038/s41586-021-03819-2", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Direct reference verified in protein design bibliography.", durationMs: 10 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "Metadata verified. Publisher: Nature Portfolio (2021).", durationMs: 105 },
        { step: "retraction_watch", status: "success", label: "Step 3 — Query Retraction Watch", detail: "Clean. No retractions, expressions of concern, or errata.", durationMs: 64 },
        { step: "relationship", status: "success", label: "Step 4 — Verify Relationship", detail: "Crossref publication relations: 0 corrections, 0 retractions.", durationMs: 40 },
        { step: "propagation", status: "success", label: "Step 5 — Assess Propagation", detail: "Semantic Scholar graph traversed 62 references. 0 retractions found.", durationMs: 198 },
        { step: "safety_policy", status: "success", label: "Step 6 — Apply Safety Policy", detail: "Deterministic check satisfied. No human interrupt needed.", durationMs: 12 },
        { step: "decision", status: "success", label: "Step 7 — Silent Pass", detail: "Citation cleared. System remains silent.", durationMs: 8 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    userId: 1,
    title: "The social contagion of suicide: A network study",
    authors: "Cheng et al.",
    venue: "PLoS ONE",
    year: 2018,
    doi: "10.1371/journal.pone.0208326",
    status: "corrected",
    risk: "medium",
    detail: "Crossref reported an official publisher correction notice published on 2019-03-14 regarding dataset sample size adjustments. Paper remains valid.",
    metadata: {
      graph: { rootDoi: "10.1371/journal.pone.0208326", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Citation indexed in behavioral metrics section.", durationMs: 15 },
        { step: "crossref", status: "warning", label: "Step 2 — Check Crossref", detail: "Publisher Correction Notice linked (2019-03-14): is-corrected-by.", durationMs: 130 },
        { step: "retraction_watch", status: "success", label: "Step 3 — Query Retraction Watch", detail: "No retraction notice. Only publisher erratum logged.", durationMs: 70 },
        { step: "relationship", status: "warning", label: "Step 4 — Verify Relationship", detail: "Erratum verified: Sample size calculation corrected; findings unchanged.", durationMs: 50 },
        { step: "propagation", status: "success", label: "Step 5 — Assess Propagation", detail: "Reference graph clear of retracted works.", durationMs: 180 },
        { step: "safety_policy", status: "warning", label: "Step 6 — Apply Safety Policy", detail: "Restraint Invariant: Publisher Erratum is NEVER classified as retraction.", durationMs: 14 },
        { step: "decision", status: "warning", label: "Step 7 — Erratum Flagged", detail: "Flagged for researcher awareness. Safe to cite with erratum noted.", durationMs: 10 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 5,
    userId: 1,
    title: "Does working from home work? Evidence from a Chinese experiment",
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
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Reference active in lab operations bibliography.", durationMs: 8 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "Clean record. Oxford University Press.", durationMs: 95 },
        { step: "retraction_watch", status: "success", label: "Step 3 — Query Retraction Watch", detail: "Clean record.", durationMs: 60 },
        { step: "relationship", status: "success", label: "Step 4 — Verify Relationship", detail: "No publisher corrections or concerns.", durationMs: 30 },
        { step: "propagation", status: "success", label: "Step 5 — Assess Propagation", detail: "Clean reference graph.", durationMs: 160 },
        { step: "safety_policy", status: "success", label: "Step 6 — Apply Safety Policy", detail: "Cleared without interruption.", durationMs: 10 },
        { step: "decision", status: "success", label: "Step 7 — Silent Pass", detail: "Cleared.", durationMs: 6 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 6,
    userId: 1,
    title: "Electric field effect in atomically thin carbon films",
    authors: "Novoselov et al.",
    venue: "Science",
    year: 2004,
    doi: "10.1126/science.1102896",
    status: "clear",
    risk: "low",
    detail: "Foundational graphene discovery verified. All provider databases confirm clean status.",
    metadata: {
      graph: { rootDoi: "10.1126/science.1102896", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Foundational materials reference.", durationMs: 10 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "Science (AAAS). Fully verified DOI.", durationMs: 110 },
        { step: "retraction_watch", status: "success", label: "Step 3 — Query Retraction Watch", detail: "Zero retraction notices recorded.", durationMs: 55 },
        { step: "relationship", status: "success", label: "Step 4 — Verify Relationship", detail: "No errata or publisher updates.", durationMs: 35 },
        { step: "propagation", status: "success", label: "Step 5 — Assess Propagation", detail: "32 referenced works inspected. 0 retractions.", durationMs: 175 },
        { step: "safety_policy", status: "success", label: "Step 6 — Apply Safety Policy", detail: "Clear pass.", durationMs: 10 },
        { step: "decision", status: "success", label: "Step 7 — Silent Pass", detail: "Verified clean.", durationMs: 5 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 7,
    userId: 1,
    title: "A programmable dual-RNA-guided DNA endonuclease in adaptive bacterial immunity",
    authors: "Jinek, Doudna, Charpentier et al.",
    venue: "Science",
    year: 2012,
    doi: "10.1126/science.1225829",
    status: "clear",
    risk: "low",
    detail: "Seminal CRISPR-Cas9 mechanism verified across Crossref, Retraction Watch, and citation tree.",
    metadata: {
      graph: { rootDoi: "10.1126/science.1225829", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Gene editing core reference.", durationMs: 12 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "Metadata valid. Science (AAAS).", durationMs: 115 },
        { step: "retraction_watch", status: "success", label: "Step 3 — Query Retraction Watch", detail: "Verified clean.", durationMs: 65 },
        { step: "relationship", status: "success", label: "Step 4 — Verify Relationship", detail: "Relations clean.", durationMs: 40 },
        { step: "propagation", status: "success", label: "Step 5 — Assess Propagation", detail: "51 references inspected. All clean.", durationMs: 190 },
        { step: "safety_policy", status: "success", label: "Step 6 — Apply Safety Policy", detail: "Policy clearance confirmed.", durationMs: 11 },
        { step: "decision", status: "success", label: "Step 7 — Silent Pass", detail: "Safe to cite.", durationMs: 6 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 8,
    userId: 1,
    title: "Tough adhesives for diverse wet surfaces",
    authors: "Li, Celiz, Yang, Langer, Mooney et al.",
    venue: "Science",
    year: 2017,
    doi: "10.1126/science.aah6362",
    status: "clear",
    risk: "low",
    detail: "Bioadhesive hydrogel technology verified clear across all providers.",
    metadata: {
      graph: { rootDoi: "10.1126/science.aah6362", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Bioadhesive interface reference.", durationMs: 9 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "Indexed in Science.", durationMs: 102 },
        { step: "retraction_watch", status: "success", label: "Step 3 — Query Retraction Watch", detail: "Clean signal.", durationMs: 58 },
        { step: "relationship", status: "success", label: "Step 4 — Verify Relationship", detail: "No issues found.", durationMs: 32 },
        { step: "propagation", status: "success", label: "Step 5 — Assess Propagation", detail: "38 references verified.", durationMs: 165 },
        { step: "safety_policy", status: "success", label: "Step 6 — Apply Safety Policy", detail: "Verified clear.", durationMs: 9 },
        { step: "decision", status: "success", label: "Step 7 — Silent Pass", detail: "Silent pass.", durationMs: 4 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 9,
    userId: 1,
    title: "Laser additive manufacturing of metallic components: materials, processes and mechanisms",
    authors: "Sing, An, Yeong, Wiria et al.",
    venue: "International Materials Reviews",
    year: 2016,
    doi: "10.1080/09506608.2015.1116649",
    status: "clear",
    risk: "low",
    detail: "Additive manufacturing review verified. Provider registers clean.",
    metadata: {
      graph: { rootDoi: "10.1080/09506608.2015.1116649", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "3D manufacturing reference.", durationMs: 11 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "Taylor & Francis indexing verified.", durationMs: 118 },
        { step: "retraction_watch", status: "success", label: "Step 3 — Query Retraction Watch", detail: "Clean signal.", durationMs: 62 },
        { step: "relationship", status: "success", label: "Step 4 — Verify Relationship", detail: "Clean relations.", durationMs: 38 },
        { step: "propagation", status: "success", label: "Step 5 — Assess Propagation", detail: "102 references traversed clean.", durationMs: 220 },
        { step: "safety_policy", status: "success", label: "Step 6 — Apply Safety Policy", detail: "Clear pass.", durationMs: 12 },
        { step: "decision", status: "success", label: "Step 7 — Silent Pass", detail: "Verified clean.", durationMs: 5 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 10,
    userId: 1,
    title: "Nanoparticle therapeutics: an emerging reality",
    authors: "Davis, Chen, Shin et al.",
    venue: "Nature Reviews Drug Discovery",
    year: 2008,
    doi: "10.1038/nrd2614",
    status: "clear",
    risk: "low",
    detail: "Nanotechnology therapeutics reference verified clean across all databases.",
    metadata: {
      graph: { rootDoi: "10.1038/nrd2614", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Nanomedicine delivery reference.", durationMs: 10 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "Nature Reviews Drug Discovery.", durationMs: 108 },
        { step: "retraction_watch", status: "success", label: "Step 3 — Query Retraction Watch", detail: "Clean signal.", durationMs: 56 },
        { step: "relationship", status: "success", label: "Step 4 — Verify Relationship", detail: "No errata recorded.", durationMs: 34 },
        { step: "propagation", status: "success", label: "Step 5 — Assess Propagation", detail: "75 references clean.", durationMs: 185 },
        { step: "safety_policy", status: "success", label: "Step 6 — Apply Safety Policy", detail: "Clear pass.", durationMs: 10 },
        { step: "decision", status: "success", label: "Step 7 — Silent Pass", detail: "Verified clean.", durationMs: 5 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 11,
    userId: 1,
    title: "Microengineered physiological biomimicry: Organs-on-Chips",
    authors: "Huh, Torisawa, Hamilton, Kim, Ingber et al.",
    venue: "Lab on a Chip",
    year: 2012,
    doi: "10.1039/c2lc40089h",
    status: "clear",
    risk: "low",
    detail: "Organ-on-a-chip biomimicry platform verified. Clean provider signals.",
    metadata: {
      graph: { rootDoi: "10.1039/c2lc40089h", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Microfluidic platform reference.", durationMs: 12 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "Royal Society of Chemistry indexing.", durationMs: 112 },
        { step: "retraction_watch", status: "success", label: "Step 3 — Query Retraction Watch", detail: "Clean signal.", durationMs: 59 },
        { step: "relationship", status: "success", label: "Step 4 — Verify Relationship", detail: "No corrections logged.", durationMs: 36 },
        { step: "propagation", status: "success", label: "Step 5 — Assess Propagation", detail: "48 references clean.", durationMs: 170 },
        { step: "safety_policy", status: "success", label: "Step 6 — Apply Safety Policy", detail: "Clear pass.", durationMs: 11 },
        { step: "decision", status: "success", label: "Step 7 — Silent Pass", detail: "Verified clean.", durationMs: 5 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 12,
    userId: 1,
    title: "Biodegradable polymers as biomaterials",
    authors: "Nair & Laurencin",
    venue: "Progress in Polymer Science",
    year: 2007,
    doi: "10.1016/j.progpolymsci.2007.05.017",
    status: "clear",
    risk: "low",
    detail: "Biopolymer degradability standard verified. Clean across all registers.",
    metadata: {
      graph: { rootDoi: "10.1016/j.progpolymsci.2007.05.017", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Polymer biocompatibility reference.", durationMs: 10 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "Elsevier indexing verified.", durationMs: 114 },
        { step: "retraction_watch", status: "success", label: "Step 3 — Query Retraction Watch", detail: "Clean signal.", durationMs: 61 },
        { step: "relationship", status: "success", label: "Step 4 — Verify Relationship", detail: "No errata recorded.", durationMs: 35 },
        { step: "propagation", status: "success", label: "Step 5 — Assess Propagation", detail: "120 references clean.", durationMs: 230 },
        { step: "safety_policy", status: "success", label: "Step 6 — Apply Safety Policy", detail: "Policy clearance confirmed.", durationMs: 10 },
        { step: "decision", status: "success", label: "Step 7 — Silent Pass", detail: "Safe to cite.", durationMs: 5 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // User 2: Dr. Marcus Chen (Computational Oncology & Genomics Lab)
  {
    id: 201,
    userId: 2,
    title: "Genomic signatures to guide chemotherapy selection in cancer",
    authors: "Potti et al.",
    venue: "Science",
    year: 2006,
    doi: "10.1126/science.1129064",
    status: "retracted",
    risk: "high",
    detail: "Retraction notice issued following Duke University investigation: microarray predictor data and computational models were irreproducible. Direct retraction isolated.",
    metadata: {
      graph: { rootDoi: "10.1126/science.1129064", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Active citation in chemotherapy sensitivity proposal.", durationMs: 11 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "Science (AAAS). Retraction notice indexed.", durationMs: 125 },
        { step: "retraction_watch", status: "flagged", label: "Step 3 — Query Retraction Watch", detail: "MATCH CONFIRMED: Retracted (Irreproducible Microarrays & Data Inconsistencies).", durationMs: 70 },
        { step: "safety_policy", status: "danger", label: "Step 6 — Apply Safety Policy", detail: "Direct retraction signal confirmed; quarantined automatically.", durationMs: 12 },
        { step: "decision", status: "danger", label: "Step 7 — Action Enforced", detail: "Quarantined permanently from oncology grant drafts.", durationMs: 5 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 202,
    userId: 2,
    title: "Validation of gene signatures for lung cancer recurrence",
    authors: "Baggerly, Coombes et al.",
    venue: "NEJM",
    year: 2008,
    doi: "10.1056/nejmoa0806455",
    status: "propagation",
    risk: "medium",
    detail: "Multi-hop graph traversal identified 2nd-order foundation dependency on retracted cancer signature paper 10.1126/science.1129064. Routed for PI judgment.",
    metadata: {
      graph: {
        rootDoi: "10.1056/nejmoa0806455",
        referencedDois: ["10.1126/science.1129064"],
        retractedReferencedDois: ["10.1126/science.1129064"],
        depth: 1,
      },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Referenced in predictive oncology model.", durationMs: 14 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "NEJM article verified. Direct record indexed.", durationMs: 110 },
        { step: "retraction_watch", status: "success", label: "Step 3 — Query Retraction Watch", detail: "Direct check: Clean. Article itself is not primary retraction target.", durationMs: 65 },
        { step: "propagation", status: "warning", label: "Step 5 — Assess Propagation", detail: "References retracted signature paper 10.1126/science.1129064.", durationMs: 95 },
        { step: "decision", status: "warning", label: "Step 7 — Human Escalation", detail: "Escalated to Human Decision Inbox. PI domain review required.", durationMs: 10 }
      ]
    },
    judgment: "pending",
    judgmentNotes: null,
    judgmentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 203,
    userId: 2,
    title: "Deep learning for protein structure prediction with AlphaFold",
    authors: "Jumper et al.",
    venue: "Nature",
    year: 2021,
    doi: "10.1038/s41586-021-03819-2",
    status: "clear",
    risk: "low",
    detail: "Verified clean across Crossref and Retraction Watch.",
    metadata: {
      graph: { rootDoi: "10.1038/s41586-021-03819-2", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 204,
    userId: 2,
    title: "Nanoparticle therapeutics: an emerging reality",
    authors: "Davis, Chen, Shin et al.",
    venue: "Nature Reviews Drug Discovery",
    year: 2008,
    doi: "10.1038/nrd2614",
    status: "clear",
    risk: "low",
    detail: "Targeted delivery reference verified clean.",
    metadata: {
      graph: { rootDoi: "10.1038/nrd2614", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // User 3: Dr. Sarah Jenkins (Neurobiology & Molecular Therapeutics Lab)
  {
    id: 301,
    userId: 3,
    title: "Hydroxychloroquine or chloroquine with or without a macrolide for treatment of COVID-19",
    authors: "Mehra et al.",
    venue: "The Lancet",
    year: 2020,
    doi: "10.1016/S0140-6736(20)31180-6",
    status: "retracted",
    risk: "high",
    detail: "Retracted due to unverified Surgisphere multinational registry data. Quarantined from active clinical trial drafts.",
    metadata: {
      graph: { rootDoi: "10.1016/S0140-6736(20)31180-6", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Clinical trial background reference.", durationMs: 10 },
        { step: "crossref", status: "flagged", label: "Step 2 — Check Crossref", detail: "The Lancet. Title prefix: RETRACTED.", durationMs: 135 },
        { step: "retraction_watch", status: "flagged", label: "Step 3 — Query Retraction Watch", detail: "MATCH CONFIRMED: Retracted (Surgisphere Unverified Registry Data).", durationMs: 78 },
        { step: "safety_policy", status: "danger", label: "Step 6 — Apply Safety Policy", detail: "Quarantined automatically.", durationMs: 10 },
        { step: "decision", status: "danger", label: "Step 7 — Action Enforced", detail: "Quarantined permanently from grant bibliography.", durationMs: 4 }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 302,
    userId: 3,
    title: "Cardiovascular Disease, Drug Therapy, and Mortality in Covid-19",
    authors: "Mehra, Desai, Anand et al.",
    venue: "NEJM",
    year: 2020,
    doi: "10.1056/NEJMoa2007621",
    status: "propagation",
    risk: "medium",
    detail: "Multi-hop graph traversal flagged 2nd-order reliance on retracted Surgisphere database. Routed for PI judgment.",
    metadata: {
      graph: {
        rootDoi: "10.1056/NEJMoa2007621",
        referencedDois: ["10.1016/S0140-6736(20)31180-6"],
        retractedReferencedDois: ["10.1016/S0140-6736(20)31180-6"],
        depth: 1,
      },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
      trace: [
        { step: "dependency", status: "success", label: "Step 1 — Identify Dependency", detail: "Translational reference mapped.", durationMs: 12 },
        { step: "crossref", status: "success", label: "Step 2 — Check Crossref", detail: "NEJM article verified.", durationMs: 115 },
        { step: "propagation", status: "warning", label: "Step 5 — Assess Propagation", detail: "Contains citation to retracted dataset 10.1016/S0140-6736(20)31180-6.", durationMs: 80 },
        { step: "decision", status: "warning", label: "Step 7 — Human Escalation", detail: "Escalated to Human Decision Inbox.", durationMs: 9 }
      ]
    },
    judgment: "pending",
    judgmentNotes: null,
    judgmentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 303,
    userId: 3,
    title: "A programmable dual-RNA-guided DNA endonuclease in adaptive bacterial immunity",
    authors: "Jinek, Doudna, Charpentier et al.",
    venue: "Science",
    year: 2012,
    doi: "10.1126/science.1225829",
    status: "clear",
    risk: "low",
    detail: "CRISPR-Cas9 mechanism verified clear across all providers.",
    metadata: {
      graph: { rootDoi: "10.1126/science.1225829", referencedDois: [], retractedReferencedDois: [], depth: 0 },
      providers: { crossref: true, retractionWatch: true, semanticScholar: true },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const demoDeadlines = [
  // User 1: Dr. Elena Rossi
  { id: 1, userId: 1, type: "IRB renewal", title: "Human Subjects Protocol 24-118", dueDate: new Date(Date.now() + 11 * 86400000), progress: 72, status: "due_soon" as const, owner: "Dr. Elena Rossi" },
  { id: 2, userId: 1, type: "Funding report", title: "NSF CAREER annual progress report", dueDate: new Date(Date.now() + 52 * 86400000), progress: 38, status: "on_track" as const, owner: "Dr. Elena Rossi" },
  { id: 3, userId: 1, type: "Data management", title: "NIH Data Management & Sharing update", dueDate: new Date(Date.now() + 3 * 86400000), progress: 12, status: "attention" as const, owner: "Dr. Elena Rossi" },
  // User 2: Dr. Marcus Chen
  { id: 201, userId: 2, type: "Grant renewal", title: "NIH R01 Clinical Proteomics Core renewal", dueDate: new Date(Date.now() + 8 * 86400000), progress: 68, status: "due_soon" as const, owner: "Dr. Marcus Chen" },
  { id: 202, userId: 2, type: "Funding report", title: "DoD CDMRP Breast Cancer Research progress report", dueDate: new Date(Date.now() + 45 * 86400000), progress: 42, status: "on_track" as const, owner: "Dr. Marcus Chen" },
  { id: 203, userId: 2, type: "Data governance", title: "NIH Genomic Data Sharing (GDS) certification", dueDate: new Date(Date.now() + 4 * 86400000), progress: 15, status: "attention" as const, owner: "Dr. Marcus Chen" },
  // User 3: Dr. Sarah Jenkins
  { id: 301, userId: 3, type: "Regulatory filing", title: "FDA Investigational New Drug (IND) Annual Safety Update", dueDate: new Date(Date.now() + 6 * 86400000), progress: 55, status: "due_soon" as const, owner: "Dr. Sarah Jenkins" },
  { id: 302, userId: 3, type: "Funding report", title: "NIH R21 Translational Neurotherapeutics milestone report", dueDate: new Date(Date.now() + 58 * 86400000), progress: 30, status: "on_track" as const, owner: "Dr. Sarah Jenkins" },
  { id: 303, userId: 3, type: "Ethics review", title: "IACUC Triennial Animal Care & Use Protocol Renewal", dueDate: new Date(Date.now() + 2 * 86400000), progress: 18, status: "attention" as const, owner: "Dr. Sarah Jenkins" },
];

export const demoActivities = [
  // User 1
  { id: 1, userId: 1, kind: "flagged", title: "Retraction signal caught: STAP Stem Cell Study", description: "Retraction Watch identified direct retraction notice for 10.1038/nature13358 (Obokata et al. 2014). Paper quarantined.", tone: "danger", createdAt: new Date() },
  { id: 2, userId: 1, kind: "escalation", title: "Propagation risk routed to PI: Lin et al. (2015)", description: "Semantic Scholar 1-hop graph found reference to retracted DOI 10.1038/nature13358. Escalated for human claim evaluation.", tone: "warning", createdAt: new Date(Date.now() - 3600000) },
  { id: 3, userId: 1, kind: "scan", title: "Autonomous multi-agent desk sweep completed", description: "Dynamically routed 5 citations across 3 branching paths: 1 direct retraction pruned early, 1 propagation cascade escalated, 3 verified clean with graph crawling. Durable session updated.", tone: "neutral", createdAt: new Date(Date.now() - 7200000) },
  { id: 4, userId: 1, kind: "clear", title: "Cleared sweep: 6 foundational citations verified", description: "Crossref and Retraction Watch confirm clean status across CRISPR and graphene foundational citations.", tone: "success", createdAt: new Date(Date.now() - 10800000) },
  // User 2
  { id: 201, userId: 2, kind: "flagged", title: "Retraction caught: Cancer Genomic Signatures", description: "Retraction Watch confirmed direct retraction for 10.1126/science.1129064 (Potti et al. 2006). Quarantined from oncology grant drafts.", tone: "danger", createdAt: new Date() },
  { id: 202, userId: 2, kind: "escalation", title: "Propagation risk routed to PI: Baggerly et al. (2008)", description: "Citation graph identified 2nd-order reference to retracted signature paper. Escalated to Dr. Chen.", tone: "warning", createdAt: new Date(Date.now() - 3600000) },
  { id: 203, userId: 2, kind: "scan", title: "Oncology bibliography sweep completed", description: "Autonomous sweep across 4 oncology citations completed without interruption.", tone: "neutral", createdAt: new Date(Date.now() - 7200000) },
  { id: 204, userId: 2, kind: "clear", title: "Cleared sweep: Proteomics citations verified clean", description: "All direct DOIs verified without retraction signals.", tone: "success", createdAt: new Date(Date.now() - 10800000) },
  // User 3
  { id: 301, userId: 3, kind: "flagged", title: "Retraction caught: Hydroxychloroquine COVID-19 Registry", description: "Retraction Watch confirmed direct retraction for 10.1016/S0140-6736(20)31180-6 (Mehra et al. 2020). Paper quarantined.", tone: "danger", createdAt: new Date() },
  { id: 302, userId: 3, kind: "escalation", title: "Propagation risk routed to PI: Cardiovascular COVID-19", description: "Citation graph detected foundation dependency on retracted Surgisphere database. Escalated for domain review.", tone: "warning", createdAt: new Date(Date.now() - 3600000) },
  { id: 303, userId: 3, kind: "scan", title: "Neurotherapeutics literature sweep completed", description: "Autonomous sweep completed across 3 tracked citations.", tone: "neutral", createdAt: new Date(Date.now() - 7200000) },
  { id: 304, userId: 3, kind: "clear", title: "Cleared sweep: Neurotherapeutics references verified", description: "All direct DOIs verified without retraction signals.", tone: "success", createdAt: new Date(Date.now() - 10800000) },
];

export async function ensureSeedData() {
  try {
    for (const persona of demoPersonas) {
      const [existing] = await db.select().from(users).where(eq(users.email, persona.email)).limit(1);
      if (!existing) {
        const [user] = await db.insert(users).values({
          name: persona.name,
          email: persona.email,
          role: persona.role,
          title: persona.title,
          labName: persona.lab,
          institution: persona.institution,
          focus: persona.focus,
          proposalName: persona.proposalName,
          initials: persona.initials,
          tenantSlug: persona.slug,
        }).returning();
        await db.insert(preferences).values({ userId: user.id });
      }
    }
    const existingCitations = await db.select().from(citations).limit(1);
    if (existingCitations.length === 0) {
      await db.insert(citations).values(demoCitations);
      await db.insert(deadlines).values(demoDeadlines);
      await db.insert(activities).values(demoActivities);
    }
    return 1;
  } catch (_error) {
    return 1;
  }
}