import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Cpu,
  Database,
  GitFork,
  ArrowRight,
  Fingerprint,
  UserCheck,
  FileWarning,
  Sparkles,
  Layers,
  FileCheck,
  ExternalLink,
  BookOpen,
  X,
} from 'lucide-react';
import { WhyThisDecisionPanel, DEFAULT_PROPAGATION_REASONING } from './why-this-decision-panel';
import { ContaminationCascade } from './contamination-cascade';
import { HumanDecisionBoundary, HumanDecisionAction } from './human-decision-boundary';
import { useAuth, formatDisplayName } from '@/context/auth-context';

export interface DemoStep {
  id: number;
  stageTitle: string;
  badge: string;
  badgeTone: 'info' | 'success' | 'warning' | 'danger' | 'purple';
  heading: string;
  subheading: string;
  agentThought: string;
  toolInvoked?: string;
  inputPayload?: Record<string, any>;
  outputPayload?: Record<string, any>;
  discovery: string;
  decisionRule: string;
  nextStepRationale: string;
}

export const DEMO_INVESTIGATION_STEPS: DemoStep[] = [
  {
    id: 1,
    stageTitle: 'Stage 1: Proposal Submission & Pre-Screening',
    badge: '37 CITATIONS INGESTED',
    badgeTone: 'info',
    heading: 'Active Grant Proposal Ingested (37 Citations)',
    subheading: 'NSF CAREER Proposal (Biomaterials & Regenerative Scaffolds)',
    agentThought: 'Scanning extracted bibliography against cached institutional memory and Crossref DOI registries to isolate citations requiring active investigation.',
    discovery: '34 citations verified clean via cached publisher signatures. 3 citations have unresolved publisher notices or multi-hop dependency ambiguities.',
    decisionRule: 'Silent Pass Invariant: 34 clean citations passed silently to eliminate researcher noise. Initiating deep investigation on 3 candidate targets.',
    nextStepRationale: 'Target Investigation #1: Smith & Obokata et al. (Stem cell reprogramming & scaffold viability).',
  },
  {
    id: 2,
    stageTitle: 'Stage 2: Publisher Verification',
    badge: 'TOOL: CROSSREF REST API',
    badgeTone: 'info',
    heading: 'Step 1: Inspect Publisher Metadata & Errata',
    subheading: 'Checking Crossref for official DOI identity, volume, and publisher updates',
    agentThought: 'Querying Crossref REST API for DOI 10.1038/nature13358 to inspect formal update-to links and publisher errata.',
    toolInvoked: 'crossref_doi_verifier',
    inputPayload: { doi: '10.1038/nature13358', check_updates: true },
    outputPayload: {
      status: 'indexed',
      publisher: 'Nature Portfolio',
      is_retracted_by: '10.1038/nature13598',
      update_type: 'retraction_notice',
    },
    discovery: 'Crossref publisher record references an update notice (is-retracted-by: 10.1038/nature13598).',
    decisionRule: 'Publisher flag detected. Agent decides: "Crossref shows notice link; must corroborate with authoritative Retraction Watch register to confirm legal decree and date."',
    nextStepRationale: 'Dispatching retraction_watch_query for authoritative confirmation.',
  },
  {
    id: 3,
    stageTitle: 'Stage 3: Authoritative Retraction Corroboration',
    badge: 'TOOL: RETRACTION WATCH',
    badgeTone: 'danger',
    heading: 'Step 2: Corroborate Against Retraction Watch',
    subheading: 'Querying global retraction database for official reasons and sanctions',
    agentThought: 'Cross-verifying retraction metadata against the licensed Retraction Watch registry to retrieve formal reasons and date.',
    toolInvoked: 'retraction_watch_query',
    inputPayload: { doi: '10.1038/nature13358' },
    outputPayload: {
      retraction_confirmed: true,
      retraction_date: '2014-07-02',
      reasons: ['Data fabrication', 'Image duplication', 'Unreproducible acid-stress protocol'],
      retraction_source: 'Retraction Watch Database',
    },
    discovery: '⚠ RETRACTION CONFIRMED: Retracted July 2, 2014 due to fabricated DNA profiling and duplicated gel figures.',
    decisionRule: 'Direct Retraction Invariant: Direct paper is confirmed invalid. Now check: Did this retracted paper propagate into downstream proposal literature?',
    nextStepRationale: 'Agent decides: "Check citation propagation via Semantic Scholar Graph to identify all papers citing this work."',
  },
  {
    id: 4,
    stageTitle: 'Stage 4: Traversal of Downstream Propagation',
    badge: 'TOOL: SEMANTIC SCHOLAR GRAPH',
    badgeTone: 'warning',
    heading: 'Step 3: Map Citation Propagation Tree',
    subheading: 'Traversing 1-hop downstream citations to detect propagation cascades',
    agentThought: 'Traversing the academic citation graph to see which published studies cited this retracted work after 2014.',
    toolInvoked: 'semantic_scholar_graph',
    inputPayload: { doi: '10.1038/nature13358', direction: 'citing_papers', limit: 25 },
    outputPayload: {
      total_citations: 412,
      relevant_subfield_papers: [
        { doi: '10.1016/j.biomaterials.2016.11.018', title: 'Martinez et al., Biomaterials 2017' },
        { doi: '10.1016/j.stem.2015.01.002', title: 'Lin et al., Cell Stem Cell 2015' },
      ],
    },
    discovery: 'Semantic Scholar identified 412 citing papers. Filtered to 6 related tissue-engineering works, including Lin et al. (2015) and Martinez et al. (2017).',
    decisionRule: 'Citation graph mapped. Agent decides: "Cross-reference downstream papers with the active grant proposal bibliography."',
    nextStepRationale: 'Correlating downstream citing papers with active proposal text.',
  },
  {
    id: 5,
    stageTitle: 'Stage 5: Proposal Contamination Correlation',
    badge: 'PROPOSAL CORRELATION',
    badgeTone: 'danger',
    heading: 'Step 4: Contamination Detected in Proposal Aim 2',
    subheading: 'Correlating external citation trees with internal proposal sections',
    agentThought: 'Comparing the downstream citation cascade against the 37 citations in the researcher\'s active proposal.',
    discovery: '🚨 2 downstream papers appear directly in the proposal: Lin et al. (2015) is cited in Section 3.2 (Aim 2) for its low-pH preconditioning protocol!',
    decisionRule: 'Contamination Invariant: Even though Lin et al. itself was never retracted, its protocol premise relies directly on the fabricated 2014 paper.',
    nextStepRationale: 'Passing synthesized evidence to the Deterministic Safety Policy for risk assessment.',
  },
  {
    id: 6,
    stageTitle: 'Stage 6: Deterministic Safety Policy Assessment',
    badge: 'SAFETY POLICY: HIGH RISK',
    badgeTone: 'danger',
    heading: 'Step 5: Synthesize Evidence & Enforce Safety Policy',
    subheading: 'Evaluating risk posture and verifying human decision boundaries',
    agentThought: 'Evaluating deterministic safety policies against assembled multi-hop evidence. AI auto-deletion is strictly forbidden.',
    discovery: 'Risk Posture: HIGH RISK (Indirect Research Contamination). Proposal Aim 2 is scientifically compromised if based on STAP mechanisms.',
    decisionRule: 'Human Governance Invariant: The agent is forbidden from auto-deleting or altering proposal citations. Scientific validity requires human domain expertise.',
    nextStepRationale: 'Halting autonomous sweep. Escalating structured briefing to the Principal Investigator.',
  },
  {
    id: 7,
    stageTitle: 'Stage 7: Human Decision Gate & Immutable Provenance',
    badge: 'PI DECISION GATE',
    badgeTone: 'purple',
    heading: 'Step 6: Principal Investigator Decision & Audit Log',
    subheading: 'Researcher reviews evidence and selects resolution (Accept, Replace, Quarantine, Dismiss, Escalate)',
    agentThought: 'Investigation concluded. Handing off full provenance trail to the human Principal Investigator.',
    discovery: 'Researcher reviews complete evidence trail: Retraction date (2014), downstream carrier (Lin et al.), and affected proposal section (Aim 2).',
    decisionRule: 'PI Action: Researcher selects "REPLACE" with clean Takahashi & Yamanaka (2019) benchmark protocol. Rationale permanently saved to lab institutional memory.',
    nextStepRationale: 'Audit record signed and committed to immutable institutional memory.',
  },
];

export function InteractiveInvestigationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'reasoning' | 'why' | 'cascade' | 'decision'>('reasoning');

  const { user } = useAuth();
  const displayName = formatDisplayName(user);
  const userProposal = user.proposalName || 'Active Grant Proposal Workspace';
  const userLab = user.labName || 'Research Laboratory';

  const rawStep = DEMO_INVESTIGATION_STEPS[currentStepIndex];
  const currentStep = {
    ...rawStep,
    subheading:
      rawStep.id === 1
        ? `${userProposal} (${userLab})`
        : rawStep.id === 7
        ? `${displayName} reviews evidence and selects resolution (Accept, Replace, Quarantine, Dismiss, Escalate)`
        : rawStep.subheading,
    heading:
      rawStep.id === 7
        ? `Step 6: Principal Investigator (${displayName}) Decision & Audit Log`
        : rawStep.heading,
    agentThought:
      rawStep.id === 5
        ? `Comparing the downstream citation cascade against the citations in ${displayName}'s active proposal: ${userProposal}.`
        : rawStep.id === 7
        ? `Investigation concluded. Handing off full provenance trail to Principal Investigator ${displayName}.`
        : rawStep.agentThought,
    decisionRule:
      rawStep.id === 7
        ? `PI Action: ${displayName} reviews evidence and selects "REPLACE" with clean benchmark protocol. Rationale permanently saved to ${userLab} institutional memory.`
        : rawStep.decisionRule,
  };

  // Auto-play timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= DEMO_INVESTIGATION_STEPS.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3400);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5 backdrop-blur-md animate-fadeIn" data-testid="interactive-investigation-modal">
      <div className="flex flex-col w-full max-w-5xl max-h-[90vh] rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-2xl overflow-hidden text-[hsl(var(--foreground))] ring-1 ring-black/5 dark:ring-white/10">
        {/* Top Control Bar */}
        <div className="border-b border-[hsl(var(--border))] p-4 bg-[hsl(var(--card))] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
              <Sparkles size={16} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                  Interactive Agent Walkthrough
                </span>
                <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  37 Citations Sweep Demo
                </span>
              </div>
              <h2 className="text-[16px] font-extrabold text-[hsl(var(--foreground))]">
                Autonomous Investigation &amp; Contamination Detection
              </h2>
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all shadow-2xs ${
                isPlaying
                  ? 'bg-amber-600 text-white hover:bg-amber-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 font-extrabold'
              }`}
              data-testid="btn-demo-autoplay"
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} className="fill-current" />}
              <span>{isPlaying ? 'Pause Sweep' : 'Auto-Play Sweep'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentStepIndex === 0}
              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-1.5 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/.8)] disabled:opacity-40 transition-colors"
              title="Previous Step"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="font-mono text-[11px] font-bold text-[hsl(var(--muted-foreground))] px-1">
              {currentStepIndex + 1} / {DEMO_INVESTIGATION_STEPS.length}
            </span>

            <button
              type="button"
              onClick={() => setCurrentStepIndex((prev) => Math.min(DEMO_INVESTIGATION_STEPS.length - 1, prev + 1))}
              disabled={currentStepIndex === DEMO_INVESTIGATION_STEPS.length - 1}
              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-1.5 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/.8)] disabled:opacity-40 transition-colors"
              title="Next Step"
            >
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentStepIndex(0);
                setIsPlaying(false);
              }}
              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/.8)] transition-colors"
              title="Reset Demo"
            >
              <RotateCcw size={14} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="ml-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/.8)] transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Progress Step Bar */}
        <div className="grid grid-cols-7 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/.2)]">
          {DEMO_INVESTIGATION_STEPS.map((s, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`py-2 px-1 text-center transition-all border-b-2 font-mono text-[9px] font-bold truncate ${
                  isCurrent
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-black'
                    : isCompleted
                    ? 'border-emerald-500/40 text-emerald-600/70 dark:text-emerald-400/70 bg-emerald-500/5'
                    : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/.3)]'
                }`}
              >
                Step {s.id}: {s.badge.split(':')[0]}
              </button>
            );
          })}
        </div>

        {/* Modal View Tabs */}
        <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-6 pt-3 bg-[hsl(var(--card))]">
          {[
            { id: 'reasoning', label: '1. Autonomous Decision Flow', icon: Cpu },
            { id: 'why', label: '2. "Why this decision?" Panel', icon: Fingerprint },
            { id: 'cascade', label: '3. Citation Contamination Graph', icon: GitFork },
            { id: 'decision', label: '4. Human Decision Boundary', icon: UserCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-[12px] font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                }`}
                data-testid={`modal-tab-${tab.id}`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'reasoning' && (
            <div className="space-y-6">
              {/* Step Banner */}
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.3)] p-5 shadow-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {currentStep.stageTitle}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[hsl(var(--muted-foreground))]">
                    Step {currentStep.id} of {DEMO_INVESTIGATION_STEPS.length}
                  </span>
                </div>
                <h3 className="text-[18px] sm:text-[20px] font-extrabold text-[hsl(var(--foreground))]">
                  {currentStep.heading}
                </h3>
                <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
                  {currentStep.subheading}
                </p>
              </div>

              {/* Visibly Conditional Flow Details */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Left Card: Agent Reasoning & Decision Rule */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                      <Cpu size={13} />
                      Agent Autonomous Reasoning
                    </div>
                    <p className="text-[13px] text-[hsl(var(--foreground))] leading-relaxed font-medium">
                      {currentStep.agentThought}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.35)] p-3.5 space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase text-[hsl(var(--muted-foreground))]">
                      Discovery / Observation
                    </div>
                    <p className="text-[12px] text-[hsl(var(--foreground))] font-semibold">
                      {currentStep.discovery}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                      Autonomous Decision Rule Enforced
                    </div>
                    <p className="text-[12px] text-emerald-700 dark:text-emerald-300 font-medium">
                      {currentStep.decisionRule}
                    </p>
                  </div>
                </div>

                {/* Right Card: Tool Dispatch & Next Action */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  {currentStep.toolInvoked ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">
                          Selected Tool Execution
                        </span>
                        <span className="rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 font-mono text-[9px] font-bold">
                          ✓ 200 OK
                        </span>
                      </div>
                      <div className="rounded-xl bg-[hsl(var(--muted)/.4)] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] p-3.5 font-mono text-[11px] space-y-2 overflow-x-auto">
                        <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                          TOOL: {currentStep.toolInvoked}
                        </div>
                        {currentStep.inputPayload && (
                          <div>
                            <span className="text-[hsl(var(--muted-foreground))]">Input:</span>{' '}
                            {JSON.stringify(currentStep.inputPayload)}
                          </div>
                        )}
                        {currentStep.outputPayload && (
                          <div>
                            <span className="text-[hsl(var(--muted-foreground))]">Output:</span>{' '}
                            {JSON.stringify(currentStep.outputPayload)}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/.2)] p-6 text-center text-[12px] text-[hsl(var(--muted-foreground))] flex flex-col items-center justify-center gap-2.5">
                      <Sparkles size={20} className="text-emerald-500/70 animate-pulse" />
                      <span>Pre-screening phase: Evaluating bibliography against Crossref and cached integrity registers.</span>
                    </div>
                  )}

                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.35)] p-4 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono text-[9px] uppercase font-bold text-[hsl(var(--muted-foreground))] block">
                        Subsequent Agent Decision
                      </span>
                      <p className="text-[12px] font-bold text-[hsl(var(--foreground))]">
                        {currentStep.nextStepRationale}
                      </p>
                    </div>
                    {currentStepIndex < DEMO_INVESTIGATION_STEPS.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 text-[11px] shrink-0 transition-colors shadow-xs cursor-pointer"
                      >
                        Next <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'why' && (
            <WhyThisDecisionPanel
              doi="10.1038/nature13358"
              paperTitle="Stimulus-triggered fate conversion of somatic cells into pluripotency"
              status="retracted"
            />
          )}

          {activeTab === 'cascade' && (
            <ContaminationCascade />
          )}

          {activeTab === 'decision' && (
            <HumanDecisionBoundary
              citationId={1}
              citationTitle="Lin et al. (Cell Stem Cell 2015) → Obokata et al. (Nature 2014)"
              citationDoi="10.1016/j.stem.2015.01.002"
              currentStatus="propagation"
              recommendedAction="Replace Section 3.2 acid preconditioning with standardized Yamanaka transcription factors (Cell 2019)."
              onDecision={async (action: HumanDecisionAction, notes: string) => {
                // Mock commit for demo
                await new Promise((r) => setTimeout(r, 600));
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
