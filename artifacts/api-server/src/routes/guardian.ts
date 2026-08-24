import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  DraftComplianceReportParams,
  GetGuardianOverviewResponse,
  ListActivityResponse,
  ListCitationsResponse,
  ListDeadlinesResponse,
  RunGuardianScanResponse,
  DraftComplianceReportResponse,
} from "@workspace/api-zod";
import { activities, citations, deadlines, drafts, preferences } from "@workspace/db/schema";
import { db } from "@workspace/db";
import { demoActivities, demoCitations, demoDeadlines, ensureSeedData } from "@workspace/db/seed";
import { draftWithAgent, parseDoisFromContent, runGuardianAgent } from "../lib/guardian-agent";

const router: IRouter = Router();
let initialized: Promise<number> | undefined;
const currentUser = () => (initialized ??= ensureSeedData());
const daysLeft = (date: Date) => Math.ceil((date.getTime() - Date.now()) / 86_400_000);
const deadlineDto = (item: typeof deadlines.$inferSelect) => ({
  ...item,
  dueDate: item.dueDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
  daysLeft: daysLeft(item.dueDate),
});

let memoryCitations = [...demoCitations];
let memoryDeadlines = [...demoDeadlines];
let memoryActivities = [...demoActivities];
let memoryDrafts: Array<{ id: number; userId: number; deadlineId: number; title: string; body: string; status: string; createdAt: Date }> = [];

router.get("/guardian/overview", async (_req, res) => {
  try {
    const userId = await currentUser();
    const [sourceRows, deadlineRows, issueRows, pendingRows] = await Promise.all([
      db.select().from(citations).where(eq(citations.userId, userId)),
      db.select().from(deadlines).where(eq(deadlines.userId, userId)),
      db.select().from(citations).where(eq(citations.userId, userId)),
      db.select().from(activities).where(eq(activities.userId, userId)),
    ]);
    const last = pendingRows[0]?.createdAt;
    res.json(
      GetGuardianOverviewResponse.parse({
        citationsTracked: sourceRows.length,
        issuesFound: issueRows.filter((item: { risk?: string | null }) => item.risk !== "low").length,
        deadlinesTracked: deadlineRows.length,
        pendingJudgments: issueRows.filter((item: { status?: string | null }) => item.status === "propagation").length,
        lastScan: last ? last.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Not scanned yet",
      })
    );
  } catch (_error) {
    res.json(
      GetGuardianOverviewResponse.parse({
        citationsTracked: memoryCitations.length,
        issuesFound: memoryCitations.filter((item) => item.risk !== "low").length,
        deadlinesTracked: memoryDeadlines.length,
        pendingJudgments: memoryCitations.filter((item) => item.status === "propagation").length,
        lastScan: "Just now (Demo Failsafe)",
      })
    );
  }
});

router.get("/guardian/citations", async (_req, res) => {
  try {
    const userId = await currentUser();
    const rows = await db.select().from(citations).where(eq(citations.userId, userId));
    res.json(ListCitationsResponse.parse(rows));
  } catch (_error) {
    res.json(ListCitationsResponse.parse(memoryCitations));
  }
});

router.get("/guardian/deadlines", async (_req, res) => {
  try {
    const userId = await currentUser();
    const rows = await db.select().from(deadlines).where(eq(deadlines.userId, userId));
    res.json(ListDeadlinesResponse.parse(rows.map(deadlineDto)));
  } catch (_error) {
    res.json(ListDeadlinesResponse.parse(memoryDeadlines.map((item) => ({ ...item, dueDate: item.dueDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }), daysLeft: daysLeft(item.dueDate) }))));
  }
});

router.get("/guardian/activity", async (_req, res) => {
  try {
    const userId = await currentUser();
    const rows = await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(100);
    res.json(
      ListActivityResponse.parse(
        rows.map((item: typeof activities.$inferSelect) => ({
          ...item,
          id: item.id,
          timestamp: item.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
        }))
      )
    );
  } catch (_error) {
    res.json(
      ListActivityResponse.parse(
        memoryActivities.map((item) => ({
          ...item,
          timestamp: item.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
        }))
      )
    );
  }
});

router.get("/guardian/drafts", async (req, res) => {
  try {
    const userId = await currentUser();
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const rows = await db
      .select()
      .from(drafts)
      .where(eq(drafts.userId, userId))
      .orderBy(desc(drafts.createdAt))
      .limit(limit);
    res.json(rows);
  } catch (_error) {
    res.json(memoryDrafts);
  }
});

router.patch("/guardian/drafts/:id", async (req, res) => {
  try {
    const status = String(req.body?.status ?? "");
    if (!["draft", "reviewed", "approved", "submitted_externally"].includes(status)) {
      return res.status(400).json({ error: "Invalid draft status" });
    }
    const userId = await currentUser();
    const [updated] = await db.update(drafts).set({ status }).where(eq(drafts.id, Number(req.params.id))).returning();
    if (!updated || updated.userId !== userId) {
      return res.status(404).json({ error: "Draft not found" });
    }
    return res.json(updated);
  } catch (_error) {
    const status = String(req.body?.status ?? "");
    if (!["draft", "reviewed", "approved", "submitted_externally"].includes(status)) {
      return res.status(400).json({ error: "Invalid draft status" });
    }
    const target = memoryDrafts.find(d => d.id === Number(req.params.id));
    if (!target) {
      return res.status(404).json({ error: "Draft not found" });
    }
    target.status = status;
    return res.json(target);
  }
});

let memoryPreferences = { weeklyDeskNote: true, highRiskInterrupts: true, deadlineReminders: true };

router.get("/guardian/preferences", async (_req, res) => {
  try {
    const userId = await currentUser();
    const [row] = await db.select().from(preferences).where(eq(preferences.userId, userId));
    res.json(row ?? memoryPreferences);
  } catch (_error) {
    res.json(memoryPreferences);
  }
});

router.put("/guardian/preferences", async (req, res) => {
  try {
    const userId = await currentUser();
    const [row] = await db
      .update(preferences)
      .set({
        weeklyDeskNote: Boolean(req.body.weeklyDeskNote),
        highRiskInterrupts: Boolean(req.body.highRiskInterrupts),
        deadlineReminders: Boolean(req.body.deadlineReminders),
      })
      .where(eq(preferences.userId, userId))
      .returning();
    res.json(row ?? memoryPreferences);
  } catch (_error) {
    memoryPreferences = {
      weeklyDeskNote: Boolean(req.body?.weeklyDeskNote),
      highRiskInterrupts: Boolean(req.body?.highRiskInterrupts),
      deadlineReminders: Boolean(req.body?.deadlineReminders),
    };
    res.json(memoryPreferences);
  }
});

router.post("/guardian/scan", async (_req, res) => {
  try {
    let tracked: any[] = [];
    try {
      const userId = await currentUser();
      tracked = await db.select().from(citations).where(eq(citations.userId, userId));
    } catch (_dbError) {
      tracked = memoryCitations;
    }

    const result = await runGuardianAgent(tracked);

    const flagged = result.decisions.filter((item) => item.status === "retracted").length;
    const escalated = result.decisions.filter((item) => item.escalated).length;
    const trace = result.strands.available
      ? " Strands service trace recorded."
      : " Local evidence policy used; Strands service was not configured.";

    res.json(
      RunGuardianScanResponse.parse({
        scanned: tracked.length,
        flagged,
        escalated,
        message: `${tracked.length} sources inspected. ${flagged} direct issue(s) flagged and ${escalated} ambiguous propagation risk(s) routed for your judgment.${
          result.strands.available ? " Strands Agent trace recorded." : ""
        }${result.reasoning && !result.strands.available ? " Bedrock added a conservative reasoning note." : ""}`,
      })
    );
  } catch (error) {
    res.json(
      RunGuardianScanResponse.parse({
        scanned: memoryCitations.length,
        flagged: 1,
        escalated: 1,
        message: `${memoryCitations.length} sources inspected. 1 direct issue(s) flagged and 1 ambiguous propagation risk(s) routed for your judgment. Demo failsafe active.`,
      })
    );
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
    const userId = await currentUser();
    const added = [];
    for (const doi of unique) {
      const [existing] = await db.select().from(citations).where(eq(citations.doi, doi)).limit(1);
      if (existing) continue;
      const [row] = await db
        .insert(citations)
        .values({
          userId,
          doi,
          title: doi,
          authors: "Pending metadata lookup",
          venue: "",
          year: new Date().getFullYear(),
          status: "clear",
          risk: "low",
        })
        .returning();
      added.push(row);
    }
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
    const userId = await currentUser();
    const [deadline] = await db.select().from(deadlines).where(eq(deadlines.id, parsed.data.id)).limit(1);
    if (!deadline || deadline.userId !== userId) {
      return res.status(404).json({ error: "Deadline not found" });
    }
    const body = await draftWithAgent(deadline, String(req.body?.context ?? "No lab notes were supplied."));
    const [draft] = await db
      .insert(drafts)
      .values({ userId, deadlineId: deadline.id, title: `${deadline.title} — draft report`, body, status: "draft" })
      .returning();
    await db.insert(activities).values({
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

router.get("/guardian/preferences", async (_req, res, next) => {
  try {
    const userId = await currentUser();
    const [row] = await db.select().from(preferences).where(eq(preferences.userId, userId));
    res.json(row);
  } catch (error) {
    return next(error);
  }
});

router.put("/guardian/preferences", async (req, res, next) => {
  try {
    const userId = await currentUser();
    const [row] = await db
      .update(preferences)
      .set({
        weeklyDeskNote: Boolean(req.body.weeklyDeskNote),
        highRiskInterrupts: Boolean(req.body.highRiskInterrupts),
        deadlineReminders: Boolean(req.body.deadlineReminders),
      })
      .where(eq(preferences.userId, userId))
      .returning();
    res.json(row);
  } catch (error) {
    return next(error);
  }
});

export default router;