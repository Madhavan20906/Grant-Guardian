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
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden" data-testid="why-this-decision-panel">
      {/* Header bar */}
      <div className="border-b border-slate-100 dark:border-slate-800 p-5 bg-slate-50/60 dark:bg-slate-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Fingerprint size={16} />
              </span>
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-indigo-700 dark:text-indigo-300">
                Auditable Action Reasoning
              </span>
              <span className="rounded bg-indigo-100/80 dark:bg-indigo-900/50 px-2 py-0.5 font-mono text-[9px] font-bold text-indigo-800 dark:text-indigo-300">
                Zero Opaque Chain-of-Thought
              </span>
            </div>
            <h3 className="mt-1 text-[16px] font-extrabold text-slate-900 dark:text-white">
              Why Did the Agent Take These Actions?
            </h3>
            <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
              Complete provenance trail of what was detected, why each authoritative registry was queried, and what the agent decided next.
            </p>
          </div>

          <button
            type="button"
            onClick={copyProvenanceJson}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-all"
            data-testid="btn-copy-provenance-json"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            <span>{copied ? 'Audit JSON Copied' : 'Export Audit JSON'}</span>
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2 sm:p-4">
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
                className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 rounded-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-extrabold ${
                    step.humanApprovalRequired
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                  }`}>
                    {step.stepNumber}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                        {step.action}
                      </span>
                      <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        tool: {step.toolName}
                      </span>
                      {step.humanApprovalRequired && (
                        <span className="rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-[9px] font-extrabold px-1.5 py-0.5">
                          ⚠ Human Approval Required
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Detected: {step.detected}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">
                    {step.latencyMs ? `${step.latencyMs}ms` : ''}
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </button>

              {/* Detailed Auditable Breakdown */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 space-y-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-xl border-t border-slate-100 dark:border-slate-800">
                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    {/* Detected */}
                    <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800/70 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <span className="size-1.5 rounded-full bg-slate-400" />
                        Detected
                      </div>
                      <p className="text-[12px] text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {step.detected}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800/70 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <span className="size-1.5 rounded-full bg-indigo-500" />
                        Agent Action
                      </div>
                      <p className="text-[12px] text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {step.action}
                      </p>
                    </div>

                    {/* Why this source */}
                    <div className="rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                        <Database size={11} />
                        Why This Source
                      </div>
                      <p className="text-[12px] text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium">
                        {step.whyThisSource}
                      </p>
                      <div className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 pt-0.5">
                        Provider: {step.sourceProvider}
                      </div>
                    </div>

                    {/* Result */}
                    <div className={`rounded-xl border p-3 space-y-1 ${
                      step.humanApprovalRequired
                        ? 'border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20'
                        : 'border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20'
                    }`}>
                      <div className={`flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                        step.humanApprovalRequired ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                      }`}>
                        <CheckCircle2 size={11} />
                        Verification Result
                      </div>
                      <p className={`text-[12px] leading-relaxed font-medium ${
                        step.humanApprovalRequired ? 'text-amber-950 dark:text-amber-200' : 'text-emerald-950 dark:text-emerald-200'
                      }`}>
                        {step.result}
                      </p>
                    </div>
                  </div>

                  {/* Next Action & Confidence Footer */}
                  <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="flex items-start sm:items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        <ArrowRight size={12} />
                      </span>
                      <div>
                        <span className="font-mono text-[9px] uppercase font-bold text-slate-400">Next Action:</span>
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                          {step.nextAction}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                      <div className="text-right">
                        <span className="font-mono text-[9px] uppercase font-bold text-slate-400 block">Confidence</span>
                        <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {step.confidence}
                        </span>
                      </div>

                      {step.humanApprovalRequired && (
                        <div className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-right">
                          <span className="font-mono text-[8px] uppercase font-extrabold text-amber-800 dark:text-amber-300 block">
                            Human Approval
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            Required Before Action
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {step.humanApprovalReason && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
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
