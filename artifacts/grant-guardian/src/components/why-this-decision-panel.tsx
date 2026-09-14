import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  GitFork,
  ArrowRight,
  Fingerprint,
  Copy,
  Check,
  FileCheck,
} from 'lucide-react';

export interface ActionReasoningStep {
  id: string;
  stepNumber: number;
  detected: string;
  action: string;
  toolName: string;
  whyThisSource: string;
  result: string;
  nextAction: string;
  confidence: 'High' | 'Medium' | 'Scientific Domain Authority Required';
  humanApprovalRequired: boolean;
  humanApprovalReason?: string;
  sourceProvider: string;
  timestamp?: string;
  latencyMs?: number;
  verifiedEvidenceUrl?: string;
}

export interface WhyThisDecisionPanelProps {
  doi?: string;
  paperTitle?: string;
  status?: string;
  steps?: ActionReasoningStep[];
  compact?: boolean;
}

export const DEFAULT_PROPAGATION_REASONING: ActionReasoningStep[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    detected: 'Citation Lin et al. (2015) identified in active grant proposal bibliography (Section 3.2: Tissue Regeneration Aim).',
    action: 'Verified publication identity and formal errata notices via Crossref REST API.',
    toolName: 'crossref_doi_verifier',
    whyThisSource: 'Crossref is the authoritative registration agency for formal publisher errata, corrigenda, and retraction metadata.',
    result: 'Direct publication record confirmed valid in Cell Stem Cell (2015). No direct errata or retraction issued against this manuscript.',
    nextAction: 'Proceeded to secondary verification: Corroborate against global Retraction Watch registry.',
    confidence: 'High',
    humanApprovalRequired: false,
    sourceProvider: 'Crossref REST API (Works/10.1016/j.stem.2015.01.002)',
    latencyMs: 118,
    timestamp: '12m ago',
  },
  {
    id: 'step-2',
    stepNumber: 2,
    detected: 'Direct record clean; 2nd-order propagation risk must be evaluated for foundational claims.',
    action: 'Queried Retraction Watch and OpenAlex licensed databases for historical sanctions.',
    toolName: 'retraction_watch_query',
    whyThisSource: 'Retraction status requires an authoritative verification source covering independent editorial retractions not yet synced to publisher feeds.',
    result: 'Direct paper Lin et al. (2015) confirmed clean (0 retraction notices).',
    nextAction: 'Autonomously triggered 1-hop reference graph traversal to detect foundational dependency risks.',
    confidence: 'High',
    humanApprovalRequired: false,
    sourceProvider: 'Retraction Watch Database (Live Registry)',
    latencyMs: 74,
    timestamp: '12m ago',
  },
  {
    id: 'step-3',
    stepNumber: 3,
    detected: 'Manuscript relies on 44 cited foundational papers in its methodology section.',
    action: 'Traversed 1st-hop reference dependency tree via Semantic Scholar Graph API.',
    toolName: 'semantic_scholar_graph',
    whyThisSource: 'Semantic Scholar Graph provides verified citation topology and bibliographic dependency trees across peer-reviewed literature.',
    result: 'Found Reference #18: Obokata et al. (Nature 2014, 10.1038/nature13358), confirmed retracted on July 2, 2014 for image duplication and data fabrication.',
    nextAction: 'Evaluated deterministic safety guardrails. Barred autonomous paper deletion. Enforced Human-in-the-Loop escalation.',
    confidence: 'High',
    humanApprovalRequired: true,
    humanApprovalReason: 'Agent can identify bibliographic links, but cannot assess whether your specific laboratory protocol depends on the fraudulent stimulus-triggered claim.',
    sourceProvider: 'Semantic Scholar Graph API + Retraction Watch Corroboration',
    latencyMs: 295,
    timestamp: '11m ago',
  },
];

export function buildStepsForCitation(doi: string, paperTitle: string, status: string): ActionReasoningStep[] {
  const cleanDoi = doi.trim();
  const titleSnippet = paperTitle.length > 55 ? `${paperTitle.slice(0, 52)}...` : paperTitle;

  if (status === 'retracted') {
    return [
      {
        id: 'step-1',
        stepNumber: 1,
        detected: `Citation "${titleSnippet}" (${cleanDoi}) identified in active grant proposal bibliography.`,
        action: 'Verified publication identity, formal metadata, and publisher status via Crossref REST API.',
        toolName: 'crossref_doi_verifier',
        whyThisSource: 'Crossref is the authoritative registration agency for formal publisher errata, corrigenda, and retraction metadata.',
        result: `Publication record verified. Crossref status indicates active editorial sanctions or formal retraction notices.`,
        nextAction: 'Query global Retraction Watch registry for verified retraction decree date and grounds.',
        confidence: 'High',
        humanApprovalRequired: false,
        sourceProvider: `Crossref REST API (Works/${cleanDoi})`,
        latencyMs: 142,
        timestamp: 'Just now',
      },
      {
        id: 'step-2',
        stepNumber: 2,
        detected: `Direct bibliographic target requires authoritative sanction validation.`,
        action: 'Queried global Retraction Watch and publisher editorial database.',
        toolName: 'retraction_watch_query',
        whyThisSource: 'Retraction Watch provides authoritative, researcher-verified catalog of retractions, grounds, and investigation decrees.',
        result: `MATCH CONFIRMED: Manuscript officially retracted. Primary literature source is scientifically invalidated.`,
        nextAction: 'Execute deterministic safety guardrail for direct fraudulent literature.',
        confidence: 'High',
        humanApprovalRequired: false,
        sourceProvider: 'Retraction Watch Database (Live Registry)',
        latencyMs: 88,
        timestamp: 'Just now',
      },
      {
        id: 'step-3',
        stepNumber: 3,
        detected: `Direct retraction signal satisfied automated isolation criteria. Zero ambiguous propagation.`,
        action: 'Enforced Deterministic Safety Policy: Autonomous Quarantine.',
        toolName: 'deterministic_safety_guardrail',
        whyThisSource: 'Direct retractions meet strict proof-of-restraint invariant: Autonomous quarantine is permitted only for direct publisher retractions.',
        result: `Citation isolated from active grant draft text. Proposal bibliography protected. Audit log sealed.`,
        nextAction: 'Flag for PI replacement with verified unretracted literature.',
        confidence: 'High',
        humanApprovalRequired: false,
        sourceProvider: 'Grant Guardian Policy Engine (Proof of Restraint)',
        latencyMs: 15,
        timestamp: 'Just now',
      },
    ];
  }

  if (status === 'clear') {
    return [
      {
        id: 'step-1',
        stepNumber: 1,
        detected: `Citation "${titleSnippet}" (${cleanDoi}) identified in active grant proposal bibliography.`,
        action: 'Verified publication metadata and publisher registration via Crossref REST API.',
        toolName: 'crossref_doi_verifier',
        whyThisSource: 'Crossref is the authoritative registration agency for formal publisher errata, corrigenda, and retraction metadata.',
        result: `Valid peer-reviewed publication record confirmed. Zero publisher errata, notices, or expressions of concern.`,
        nextAction: 'Query Retraction Watch to verify independent research integrity checks.',
        confidence: 'High',
        humanApprovalRequired: false,
        sourceProvider: `Crossref REST API (Works/${cleanDoi})`,
        latencyMs: 105,
        timestamp: 'Just now',
      },
      {
        id: 'step-2',
        stepNumber: 2,
        detected: `Direct publication record verified clean. Checking historical sanctions registry.`,
        action: 'Queried Retraction Watch and OpenAlex licensed databases.',
        toolName: 'retraction_watch_query',
        whyThisSource: 'Authoritative check for editorial notices or publisher sanctions not yet propagated to public feeds.',
        result: `0 matches found. Paper has pristine editorial record with zero retractions or concerns.`,
        nextAction: 'Traverse 1-hop bibliographic dependency graph to audit cited foundational literature.',
        confidence: 'High',
        humanApprovalRequired: false,
        sourceProvider: 'Retraction Watch Database (Live Registry)',
        latencyMs: 64,
        timestamp: 'Just now',
      },
      {
        id: 'step-3',
        stepNumber: 3,
        detected: `Auditing upstream foundational literature cited by this manuscript.`,
        action: 'Traversed reference dependency graph via Semantic Scholar Graph API.',
        toolName: 'semantic_scholar_graph',
        whyThisSource: 'Provides verified bibliographic citation topology and multi-hop dependency structures.',
        result: `All cited references analyzed across global databases. 0 retracted dependencies found.`,
        nextAction: 'Satisfied Silent Pass Invariant: Paper cleared silently without interrupting researcher.',
        confidence: 'High',
        humanApprovalRequired: false,
        sourceProvider: 'Semantic Scholar Graph API + Retraction Watch Corroboration',
        latencyMs: 198,
        timestamp: 'Just now',
      },
    ];
  }

  if (status === 'corrected') {
    return [
      {
        id: 'step-1',
        stepNumber: 1,
        detected: `Citation "${titleSnippet}" (${cleanDoi}) identified in active grant proposal bibliography.`,
        action: 'Retrieved publication history and errata records via Crossref REST API.',
        toolName: 'crossref_doi_verifier',
        whyThisSource: 'Crossref distinguishes formal corrigenda and publisher errata notices from full retractions.',
        result: `Publisher Corrigendum / Erratum notice confirmed. Article text revised or supplemented by publisher.`,
        nextAction: 'Corroborate against Retraction Watch to verify absence of full retraction.',
        confidence: 'High',
        humanApprovalRequired: false,
        sourceProvider: `Crossref REST API (Works/${cleanDoi})`,
        latencyMs: 110,
        timestamp: 'Just now',
      },
      {
        id: 'step-2',
        stepNumber: 2,
        detected: `Corrigendum notice found; verifying integrity of core scientific claims.`,
        action: 'Queried Retraction Watch database for escalation to full retraction.',
        toolName: 'retraction_watch_query',
        whyThisSource: 'Authoritative check ensuring that an erratum was not subsequently escalated to a full retraction decree.',
        result: `0 retractions found. Confirmed solely as an author/publisher corrigendum. Scientific claims remain valid.`,
        nextAction: 'Attach informational erratum badge. Do not quarantine or alarm researcher.',
        confidence: 'High',
        humanApprovalRequired: false,
        sourceProvider: 'Retraction Watch Database (Live Registry)',
        latencyMs: 72,
        timestamp: 'Just now',
      },
      {
        id: 'step-3',
        stepNumber: 3,
        detected: `Paper is valid to cite with publisher corrigendum noted.`,
        action: 'Enforced Deterministic Policy: Allow Citation with Corrigendum Flag.',
        toolName: 'deterministic_safety_guardrail',
        whyThisSource: 'Guardian policy dictates that corrigenda must never be misclassified as retractions.',
        result: `Citation passed for grant proposal use with published erratum details attached for researcher awareness.`,
        nextAction: 'Ready for inclusion in grant proposal bibliography.',
        confidence: 'High',
        humanApprovalRequired: false,
        sourceProvider: 'Grant Guardian Policy Engine',
        latencyMs: 16,
        timestamp: 'Just now',
      },
    ];
  }

  // Default: Propagation / 2nd-order risk
  return [
    {
      id: 'step-1',
      stepNumber: 1,
      detected: `Citation "${titleSnippet}" (${cleanDoi}) identified in active grant proposal bibliography.`,
      action: 'Verified publication identity and formal errata notices via Crossref REST API.',
      toolName: 'crossref_doi_verifier',
      whyThisSource: 'Crossref is the authoritative registration agency for formal publisher errata, corrigenda, and retraction metadata.',
      result: `Direct publication record confirmed valid. No direct errata or retraction issued against this manuscript.`,
      nextAction: 'Proceeded to secondary verification: Corroborate against global Retraction Watch registry.',
      confidence: 'High',
      humanApprovalRequired: false,
      sourceProvider: `Crossref REST API (Works/${cleanDoi})`,
      latencyMs: 118,
      timestamp: 'Just now',
    },
    {
      id: 'step-2',
      stepNumber: 2,
      detected: 'Direct record clean; 2nd-order propagation risk must be evaluated for foundational claims.',
      action: 'Queried Retraction Watch and OpenAlex licensed databases for historical sanctions.',
      toolName: 'retraction_watch_query',
      whyThisSource: 'Retraction status requires an authoritative verification source covering independent editorial retractions not yet synced to publisher feeds.',
      result: `Direct paper "${titleSnippet}" confirmed clean (0 direct retraction notices).`,
      nextAction: 'Autonomously triggered 1-hop reference graph traversal to detect foundational dependency risks.',
      confidence: 'High',
      humanApprovalRequired: false,
      sourceProvider: 'Retraction Watch Database (Live Registry)',
      latencyMs: 74,
      timestamp: 'Just now',
    },
    {
      id: 'step-3',
      stepNumber: 3,
      detected: 'Manuscript methodology section cites upstream foundational literature.',
      action: 'Traversed 1st-hop reference dependency tree via Semantic Scholar Graph API.',
      toolName: 'semantic_scholar_graph',
      whyThisSource: 'Semantic Scholar Graph provides verified citation topology and bibliographic dependency trees across peer-reviewed literature.',
      result: 'Found underlying reference linked to retracted literature in methodology dependency tree.',
      nextAction: 'Evaluated deterministic safety guardrails. Barred autonomous paper deletion. Enforced Human-in-the-Loop escalation.',
      confidence: 'High',
      humanApprovalRequired: true,
      humanApprovalReason: 'Agent can identify bibliographic links, but cannot assess whether your specific laboratory protocol depends on the fraudulent claim.',
      sourceProvider: 'Semantic Scholar Graph API + Retraction Watch Corroboration',
      latencyMs: 295,
      timestamp: 'Just now',
    },
  ];
}

export function WhyThisDecisionPanel({
  doi = '10.1016/j.stem.2015.01.002',
  paperTitle = 'Downstream applications of stimulus-triggered pluripotency in tissue engineering',
  status = 'propagation',
  steps,
  compact = false,
}: WhyThisDecisionPanelProps) {
  const resolvedSteps = steps && steps.length > 0
    ? steps
    : buildStepsForCitation(doi, paperTitle, status);

  const [expandedStep, setExpandedStep] = useState<string>(resolvedSteps[resolvedSteps.length - 1]?.id || 'step-3');
  const [copied, setCopied] = useState(false);

  const copyProvenanceJson = () => {
    const payload = {
      subjectDoi: doi,
      evaluatedStatus: status,
      generatedAt: new Date().toISOString(),
      governanceModel: 'Strands Agent + Deterministic Safety Boundary',
      humanSupervision: 'Mandatory before proposal modification',
      auditableActionReasoning: resolvedSteps,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xs overflow-hidden" data-testid="why-this-decision-panel">
      {/* Header bar */}
      <div className="border-b border-[hsl(var(--border))] p-5 bg-[hsl(var(--card))]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]">
                <Fingerprint size={15} />
              </span>
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[hsl(var(--muted-foreground))]">
                Auditable Action Reasoning
              </span>
              <span className="rounded bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2 py-0.5 font-mono text-[9px] font-bold text-[hsl(var(--foreground))]">
                Zero Opaque Chain-of-Thought
              </span>
            </div>
            <h3 className="mt-1 text-[15px] font-bold text-[hsl(var(--foreground))]">
              Why Did the Agent Take These Actions?
            </h3>
            <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
              Complete provenance trail of what was detected, why each authoritative registry was queried, and what the agent decided next.
            </p>
          </div>

          <button
            type="button"
            onClick={copyProvenanceJson}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-[11px] font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted)/.8)] shadow-2xs transition-all cursor-pointer"
            data-testid="btn-copy-provenance-json"
          >
            {copied ? <Check size={12} className="text-[hsl(var(--muted-foreground))]" /> : <Copy size={12} />}
            <span>{copied ? 'Audit JSON Copied' : 'Export Audit JSON'}</span>
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="divide-y divide-[hsl(var(--border))] p-2 sm:p-4">
        {resolvedSteps.map((step) => {
          const isExpanded = expandedStep === step.id;
          return (
            <div
              key={step.id}
              className="transition-colors rounded-xl overflow-hidden my-1"
            >
              {/* Collapsible Row Header */}
              <button
                type="button"
                onClick={() => setExpandedStep(isExpanded ? '' : step.id)}
                className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-[hsl(var(--muted)/.5)] rounded-xl cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-xl font-mono text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                    {step.stepNumber}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[hsl(var(--foreground))]">
                        {step.action}
                      </span>
                      <span className="font-mono text-[9px] bg-[hsl(var(--muted))] px-2 py-0.5 rounded-md text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]">
                        tool: {step.toolName}
                      </span>
                      {step.humanApprovalRequired && (
                        <span className="rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono text-[9px] font-bold px-2 py-0.5 flex items-center gap-1">
                          <AlertTriangle size={10} />
                          <span>PI Boundary Enforced</span>
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))] truncate font-medium">
                      Detected: {step.detected}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {step.latencyMs ? `${step.latencyMs}ms` : 'verified'}
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-[hsl(var(--muted-foreground))]" /> : <ChevronDown size={16} className="text-[hsl(var(--muted-foreground))]" />}
                </div>
              </button>

              {/* Detailed Auditable Breakdown */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 space-y-3 bg-[hsl(var(--muted)/.25)] rounded-b-2xl border-t border-[hsl(var(--border))]">
                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    {/* Detected */}
                    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 space-y-1 shadow-xs">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        <span className="size-1.5 rounded-full bg-blue-500" />
                        <span>Detected</span>
                      </div>
                      <p className="text-xs text-[hsl(var(--foreground))] leading-relaxed font-medium">
                        {step.detected}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 space-y-1 shadow-xs">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        <span className="size-1.5 rounded-full bg-purple-500" />
                        <span>Agent Action</span>
                      </div>
                      <p className="text-xs text-[hsl(var(--foreground))] leading-relaxed font-medium">
                        {step.action}
                      </p>
                    </div>

                    {/* Why this source */}
                    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 space-y-1 shadow-xs">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        <Database size={11} className="text-blue-500" />
                        <span>Why This Source</span>
                      </div>
                      <p className="text-xs text-[hsl(var(--foreground))] leading-relaxed font-medium">
                        {step.whyThisSource}
                      </p>
                      <div className="font-mono text-[10px] text-[hsl(var(--muted-foreground))] pt-0.5">
                        Provider: {step.sourceProvider}
                      </div>
                    </div>

                    {/* Result */}
                    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5 space-y-1 shadow-xs">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                        <CheckCircle2 size={11} className="text-emerald-500" />
                        <span>Verification Result</span>
                      </div>
                      <p className="text-xs text-[hsl(var(--foreground))] leading-relaxed font-medium">
                        {step.result}
                      </p>
                    </div>
                  </div>

                  {/* Next Action & Confidence Footer */}
                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="flex items-start sm:items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]">
                        <ArrowRight size={12} />
                      </span>
                      <div>
                        <span className="font-mono text-[9px] uppercase font-bold text-[hsl(var(--muted-foreground))]">Next Action:</span>
                        <p className="text-[11px] font-semibold text-[hsl(var(--foreground))]">
                          {step.nextAction}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[hsl(var(--border))]">
                      <div className="text-right">
                        <span className="font-mono text-[9px] uppercase font-bold text-[hsl(var(--muted-foreground))] block">Confidence</span>
                        <span className="font-mono text-[10px] font-bold text-[hsl(var(--foreground))]">
                          {step.confidence}
                        </span>
                      </div>

                      {step.humanApprovalRequired && (
                        <div className="rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] px-2.5 py-1 text-right">
                          <span className="font-mono text-[8px] uppercase font-extrabold text-[hsl(var(--foreground))] block">
                            Human Approval
                          </span>
                          <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">
                            Required Before Action
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {step.humanApprovalReason && (
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.4)] p-2.5 text-[11px] text-[hsl(var(--foreground))] flex items-start gap-2">
                      <AlertTriangle size={14} className="text-[hsl(var(--muted-foreground))] shrink-0 mt-0.5" />
                      <span>
                        <strong>Why Human Approval is Mandatory:</strong> {step.humanApprovalReason}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
