import { Router, type IRouter } from "express";
import {
  DraftComplianceReportParams,
  DraftComplianceReportResponse,
  GetGuardianOverviewResponse,
  ListActivityResponse,
  ListCitationsResponse,
  ListDeadlinesResponse,
  RunGuardianScanResponse,
} from "@workspace/api-zod";
import { draftWithAgent, parseDoisFromContent, runGuardianAgent, runStrandsService } from "../lib/guardian-agent";
import { getWatchState, runAutonomousSweep } from "../lib/autonomous-watch";
import { guardianStore, type DeadlineRecord } from "../lib/store";

const router: IRouter = Router();

const daysLeft = (date: Date) => Math.ceil((date.getTime() - Date.now()) / 86_400_000);
const deadlineDto = (item: DeadlineRecord) => ({
  ...item,
  dueDate: item.dueDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
  daysLeft: daysLeft(item.dueDate),
  owner: item.owner ?? "Dr. Elena Rossi",
});

router.get("/guardian/overview", async (_req, res, next) => {
  try {
    const userId = await guardianStore.getUserId();
    const overview = await guardianStore.getOverview(userId);
    return res.json(GetGuardianOverviewResponse.parse(overview));
  } catch (error) {
    return next(error);
  }
});

router.get("/guardian/citations", async (_req, res, next) => {
  try {
    const userId = await guardianStore.getUserId();
    const rows = await guardianStore.getCitations(userId);
    return res.json(ListCitationsResponse.parse(rows));
  } catch (error) {
    return next(error);
  }
});

router.get("/guardian/deadlines", async (_req, res, next) => {
  try {
    const userId = await guardianStore.getUserId();
    const rows = await guardianStore.getDeadlines(userId);
    return res.json(ListDeadlinesResponse.parse(rows.map(deadlineDto)));
  } catch (error) {
    return next(error);
  }
});

router.get("/guardian/activity", async (_req, res, next) => {
  try {
    const userId = await guardianStore.getUserId();
    const rows = await guardianStore.getActivities(userId, 100);
    return res.json(
      ListActivityResponse.parse(
        rows.map((item) => ({
          ...item,
          id: item.id,
          timestamp: item.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
        }))
      )
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/guardian/drafts", async (req, res, next) => {
  try {
    const userId = await guardianStore.getUserId();
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const rows = await guardianStore.getDrafts(userId, limit);
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

router.patch("/guardian/drafts/:id", async (req, res, next) => {
  try {
    const status = String(req.body?.status ?? "");
    if (!["draft", "reviewed", "approved", "submitted_externally"].includes(status)) {
      return res.status(400).json({ error: "Invalid draft status" });
    }
    const userId = await guardianStore.getUserId();
    const updated = await guardianStore.updateDraftStatus(Number(req.params.id), userId, status);
    if (!updated) {
      return res.status(404).json({ error: "Draft not found" });
    }
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.get("/guardian/preferences", async (_req, res, next) => {
  try {
    const userId = await guardianStore.getUserId();
    const prefs = await guardianStore.getPreferences(userId);
    return res.json(prefs);
  } catch (error) {
    return next(error);
  }
});

router.put("/guardian/preferences", async (req, res, next) => {
  try {
    const userId = await guardianStore.getUserId();
    const prefs = await guardianStore.updatePreferences(userId, {
      weeklyDeskNote: Boolean(req.body?.weeklyDeskNote),
      highRiskInterrupts: Boolean(req.body?.highRiskInterrupts),
      deadlineReminders: Boolean(req.body?.deadlineReminders),
    });
    return res.json(prefs);
  } catch (error) {
    return next(error);
  }
});

router.post("/guardian/scan", async (_req, res, next) => {
  try {
    const userId = await guardianStore.getUserId();
    const tracked = await guardianStore.getCitations(userId);
    const result = await runGuardianAgent(tracked);

    await guardianStore.saveCitationDecisions(result.decisions);

    const flagged = result.decisions.filter((item) => item.status === "retracted").length;
    const escalated = result.decisions.filter((item) => item.escalated).length;
    const scanSummaryText = `${tracked.length} sources inspected. ${flagged} direct issue(s) flagged and ${escalated} ambiguous propagation risk(s) routed for your judgment.${
      result.strands.available ? " Strands Agent trace recorded." : ""
    }${result.reasoning && !result.strands.available ? " Bedrock added a conservative reasoning note." : ""}`;

    await guardianStore.addActivity({
      userId,
      title: result.strands.available ? "Autonomous Strands Agent sweep complete" : "Integrity sweep complete",
      description: scanSummaryText,
      kind: flagged > 0 ? "flagged" : escalated > 0 ? "escalation" : "scan",
      tone: flagged > 0 ? "danger" : escalated > 0 ? "warning" : "success",
    });

    return res.json(
      RunGuardianScanResponse.parse({
        scanned: tracked.length,
        flagged,
        escalated,
        message: scanSummaryText,
        decisions: result.decisions,
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.post("/guardian/citations/import", async (req, res, next) => {
  try {
    const input = String(req.body?.content ?? req.body?.doi ?? "").trim();
    if (!input) {
      return res.status(400).json({ error: "Provide a DOI list or BibTeX content" });
    }
    const unique = parseDoisFromContent(input);
    if (!unique.length) {
      return res.status(400).json({ error: "No DOI was found in the supplied content" });
    }
    const userId = await guardianStore.getUserId();
    const added = await guardianStore.importCitations(userId, unique);
    return res.status(201).json({ imported: added.length, citations: added });
  } catch (error) {
    return next(error);
  }
});

router.post("/guardian/deadlines/:id/draft", async (req, res, next) => {
  try {
    const parsed = DraftComplianceReportParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid deadline id" });
    }
    const userId = await guardianStore.getUserId();
    const deadline = await guardianStore.getDeadlineById(parsed.data.id, userId);
    if (!deadline) {
      return res.status(404).json({ error: "Deadline not found" });
    }
    const body = await draftWithAgent(deadline as any, String(req.body?.context ?? "No lab notes were supplied."));
    const draft = await guardianStore.createDraft(userId, deadline.id, `${deadline.title} — draft report`, body);
    await guardianStore.addActivity({
      userId,
      kind: "draft",
      title: "Compliance report draft is ready",
      description: `Agent assembled a reviewable draft for ${deadline.title}. Nothing was submitted.`,
      tone: "success",
    });
    return res.json(DraftComplianceReportResponse.parse(draft));
  } catch (error) {
    return next(error);
  }
});

// Human Decision Inbox: Record PI judgment for escalated citations
router.post("/guardian/citations/:id/judgment", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const judgment = String(req.body?.judgment ?? "");
    const notes = String(req.body?.notes ?? "").trim();

    if (!["relevant", "not_relevant", "deferred"].includes(judgment)) {
      return res.status(400).json({ error: "Invalid judgment. Must be 'relevant', 'not_relevant', or 'deferred'." });
    }

    const userId = await guardianStore.getUserId();
    const updatedCitation = await guardianStore.recordJudgment(id, userId, judgment as any, notes);
    if (!updatedCitation) {
      return res.status(404).json({ error: "Citation not found" });
    }
    return res.json(updatedCitation);
  } catch (error) {
    return next(error);
  }
});

// Autonomous Watch Mode routes
router.get("/guardian/watch/status", async (_req, res) => {
  res.json(getWatchState());
});

router.post("/guardian/watch/sweep", async (_req, res, next) => {
  try {
    const userId = await guardianStore.getUserId();
    const result = await runAutonomousSweep(userId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/guardian/notifications", async (_req, res) => {
  res.json(getWatchState().notifications);
});

router.get("/guardian/strands/status", async (_req, res) => {
  const result = await runStrandsService([]);
  return res.json({
    available: result.available,
    mode: result.mode,
    statusLabel: result.status_label,
    tools: result.tools ?? 6,
    error: result.error,
  });
});

export default router;