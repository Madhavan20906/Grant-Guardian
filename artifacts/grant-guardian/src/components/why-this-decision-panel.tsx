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

export function WhyThisDecisionPanel({
  doi = '10.1016/j.stem.2015.01.002',
  paperTitle = 'Downstream applications of stimulus-triggered pluripotency in tissue engineering',
  status = 'propagation',
  steps = DEFAULT_PROPAGATION_REASONING,
  compact = false,
}: WhyThisDecisionPanelProps) {
  const [expandedStep, setExpandedStep] = useState<string>(steps[steps.length - 1]?.id || 'step-3');
  const [copied, setCopied] = useState(false);

  const copyProvenanceJson = () => {
    const payload = {
      subjectDoi: doi,
      evaluatedStatus: status,
      generatedAt: new Date().toISOString(),
      governanceModel: 'Strands Agent + Deterministic Safety Boundary',
      humanSupervision: 'Mandatory before proposal modification',
      auditableActionReasoning: steps,
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
        {steps.map((step) => {
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
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]">
                    {step.stepNumber}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[hsl(var(--foreground))]">
                        {step.action}
                      </span>
                      <span className="font-mono text-[9px] bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]">
                        tool: {step.toolName}
                      </span>
                      {step.humanApprovalRequired && (
                        <span className="rounded bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] font-mono text-[9px] font-bold px-1.5 py-0.5">
                          ⚠ Human Approval Required
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[hsl(var(--muted-foreground))] truncate">
                      Detected: {step.detected}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))] hidden sm:inline">
                    {step.latencyMs ? `${step.latencyMs}ms` : ''}
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-[hsl(var(--muted-foreground))]" /> : <ChevronDown size={16} className="text-[hsl(var(--muted-foreground))]" />}
                </div>
              </button>

              {/* Detailed Auditable Breakdown */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 space-y-3 bg-[hsl(var(--muted)/.25)] rounded-b-xl border-t border-[hsl(var(--border))]">
                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    {/* Detected */}
                    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        <span className="size-1.5 rounded-full bg-[hsl(var(--muted-foreground))]" />
                        Detected
                      </div>
                      <p className="text-[12px] text-[hsl(var(--foreground))] leading-relaxed font-medium">
                        {step.detected}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        <span className="size-1.5 rounded-full bg-[hsl(var(--muted-foreground))]" />
                        Agent Action
                      </div>
                      <p className="text-[12px] text-[hsl(var(--foreground))] leading-relaxed font-medium">
                        {step.action}
                      </p>
                    </div>

                    {/* Why this source */}
                    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        <Database size={11} />
                        Why This Source
                      </div>
                      <p className="text-[12px] text-[hsl(var(--foreground))] leading-relaxed font-medium">
                        {step.whyThisSource}
                      </p>
                      <div className="font-mono text-[10px] text-[hsl(var(--muted-foreground))] pt-0.5">
                        Provider: {step.sourceProvider}
                      </div>
                    </div>

                    {/* Result */}
                    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                        <CheckCircle2 size={11} />
                        Verification Result
                      </div>
                      <p className="text-[12px] text-[hsl(var(--foreground))] leading-relaxed font-medium">
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
