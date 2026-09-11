import { desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { activities, citations, deadlines, drafts, preferences } from "@workspace/db/schema";
import { demoActivities, demoCitations, demoDeadlines, demoPersonas, ensureSeedData, type PersonaProfile } from "@workspace/db/seed";
import { logger } from "./logger";

export interface CitationRecord {
  id: number;
  userId: number;
  doi: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  status: string;
  risk: string;
  detail?: string | null;
  metadata?: any;
  judgment?: string | null;
  judgmentNotes?: string | null;
  judgmentAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DeadlineRecord {
  id: number;
  userId: number;
  type: string;
  title: string;
  dueDate: Date;
  owner: string;
  progress: number;
  status: "on_track" | "due_soon" | "attention";
}

export interface ActivityRecord {
  id: number;
  userId: number;
  kind: string;
  title: string;
  description: string;
  tone: string;
  createdAt: Date;
}

export interface DraftRecord {
  id: number;
  userId: number;
  deadlineId: number;
  title: string;
  body: string;
  status: string;
  createdAt: Date;
}

export interface PreferencesRecord {
  id?: number;
  userId: number;
  weeklyDeskNote: boolean;
  highRiskInterrupts: boolean;
  deadlineReminders: boolean;
}

class GuardianStore {
  private memoryCitations: CitationRecord[] = demoCitations.map(c => ({
    ...c,
    judgment: (c as any).judgment ?? "pending",
    judgmentNotes: (c as any).judgmentNotes ?? null,
    judgmentAt: (c as any).judgmentAt ?? null,
    createdAt: (c as any).createdAt ?? new Date(),
    updatedAt: (c as any).updatedAt ?? new Date(),
  }));

  private memoryDeadlines: DeadlineRecord[] = [...demoDeadlines];
  private memoryActivities: ActivityRecord[] = [...demoActivities];
  private memoryDrafts: DraftRecord[] = [];
  private memoryPreferences: PreferencesRecord = {
    userId: 1,
    weeklyDeskNote: true,
    highRiskInterrupts: true,
    deadlineReminders: true,
  };

  private initialized: Promise<number> | null = null;

  getPersonas(): PersonaProfile[] {
    return demoPersonas;
  }

  async getUserId(identifier?: string | number): Promise<number> {
    try {
      await (this.initialized ??= ensureSeedData());
    } catch (err) {
      logger.warn({ err }, "Database seed/user check failed; using local persona mapping");
    }
    if (identifier === undefined || identifier === null) return 1;
    if (typeof identifier === "number" && !isNaN(identifier)) {
      const match = demoPersonas.find(p => p.id === identifier);
      return match ? match.id : 1;
    }
    const clean = String(identifier).trim().toLowerCase();
    const numeric = parseInt(clean, 10);
    if (!isNaN(numeric)) {
      const match = demoPersonas.find(p => p.id === numeric);
      if (match) return match.id;
    }
    const matched = demoPersonas.find(
      p => p.slug.toLowerCase() === clean || p.name.toLowerCase().includes(clean)
    );
    return matched ? matched.id : 1;
  }

  async getOverview(userId: number) {
    try {
      const [sourceRows, deadlineRows, issueRows, pendingRows] = await Promise.all([
        db.select().from(citations).where(eq(citations.userId, userId)),
        db.select().from(deadlines).where(eq(deadlines.userId, userId)),
        db.select().from(citations).where(eq(citations.userId, userId)),
        db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.createdAt)),
      ]);
      const last = pendingRows[0]?.createdAt;
      return {
        citationsTracked: sourceRows.length,
        issuesFound: issueRows.filter(item => item.risk !== "low").length,
        deadlinesTracked: deadlineRows.length,
        pendingJudgments: issueRows.filter(item => item.status === "propagation").length,
        lastScan: last ? last.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Not scanned yet",
      };
    } catch (err) {
      logger.warn({ err, operation: "getOverview" }, "Database unavailable for overview; using in-memory store");
      const userCitations = this.memoryCitations.filter(c => c.userId === userId);
      const userDeadlines = this.memoryDeadlines.filter(d => d.userId === userId);
      const userActivities = this.memoryActivities.filter(a => a.userId === userId);
      const last = userActivities[0]?.createdAt;
      return {
        citationsTracked: userCitations.length,
        issuesFound: userCitations.filter(item => item.risk !== "low").length,
        deadlinesTracked: userDeadlines.length,
        pendingJudgments: userCitations.filter(item => item.status === "propagation").length,
        lastScan: last ? last.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Not scanned yet",
      };
    }
  }

  async getCitations(userId: number): Promise<CitationRecord[]> {
    try {
      const rows = await db
        .select()
        .from(citations)
        .where(eq(citations.userId, userId))
        .orderBy(desc(citations.updatedAt));
      return rows as CitationRecord[];
    } catch (err) {
      logger.warn({ err, operation: "getCitations" }, "Database unavailable for citations; using in-memory store");
      return this.memoryCitations.filter(c => c.userId === userId);
    }
  }

  async getDeadlines(userId: number): Promise<DeadlineRecord[]> {
    try {
      const rows = await db
        .select()
        .from(deadlines)
        .where(eq(deadlines.userId, userId))
        .orderBy(deadlines.dueDate);
      return rows as DeadlineRecord[];
    } catch (err) {
      logger.warn({ err, operation: "getDeadlines" }, "Database unavailable for deadlines; using in-memory store");
      return this.memoryDeadlines.filter(d => d.userId === userId);
    }
  }

  async getDeadlineById(id: number, userId: number): Promise<DeadlineRecord | null> {
    try {
      const [row] = await db
        .select()
        .from(deadlines)
        .where(eq(deadlines.id, id))
        .limit(1);
      if (row && row.userId === userId) {
        return row as DeadlineRecord;
      }
      return null;
    } catch (err) {
      logger.warn({ err, id, operation: "getDeadlineById" }, "Database unavailable for getDeadlineById; using in-memory store");
      return this.memoryDeadlines.find(d => d.id === id && d.userId === userId) ?? null;
    }
  }

  async getActivities(userId: number, limit = 100): Promise<ActivityRecord[]> {
    try {
      const rows = await db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId))
        .orderBy(desc(activities.createdAt))
        .limit(limit);
      return rows as ActivityRecord[];
    } catch (err) {
      logger.warn({ err, operation: "getActivities" }, "Database unavailable for activities; using in-memory store");
      return this.memoryActivities
        .filter(a => a.userId === userId)
        .slice(0, limit);
    }
  }

  async addActivity(data: { userId: number; kind: string; title: string; description: string; tone: string; createdAt?: Date }): Promise<ActivityRecord> {
    const record: ActivityRecord = {
      id: this.memoryActivities.length + 1,
      userId: data.userId,
      kind: data.kind,
      title: data.title,
      description: data.description,
      tone: data.tone,
      createdAt: data.createdAt ?? new Date(),
    };

    try {
      const [inserted] = await db
        .insert(activities)
        .values({
          userId: data.userId,
          kind: data.kind,
          title: data.title,
          description: data.description,
          tone: data.tone,
          createdAt: record.createdAt,
        })
        .returning();
      if (inserted) {
        record.id = inserted.id;
      }
    } catch (err) {
      logger.warn({ err, operation: "addActivity" }, "Database unavailable for addActivity; persisted in memory only");
    }

    this.memoryActivities.unshift(record);
    return record;
  }

  async getDrafts(userId: number, limit = 25): Promise<DraftRecord[]> {
    try {
      const rows = await db
        .select()
        .from(drafts)
        .where(eq(drafts.userId, userId))
        .orderBy(desc(drafts.createdAt))
        .limit(limit);
      return rows as DraftRecord[];
    } catch (err) {
      logger.warn({ err, operation: "getDrafts" }, "Database unavailable for drafts; using in-memory store");
      return this.memoryDrafts.filter(d => d.userId === userId).slice(0, limit);
    }
  }

  async updateDraftStatus(id: number, userId: number, status: string): Promise<DraftRecord | null> {
    let updatedRecord: DraftRecord | null = null;

    try {
      const [updated] = await db
        .update(drafts)
        .set({ status })
        .where(eq(drafts.id, id))
        .returning();
      if (updated && updated.userId === userId) {
        updatedRecord = updated as DraftRecord;
      }
    } catch (err) {
      logger.warn({ err, id, operation: "updateDraftStatus" }, "Database unavailable for updateDraftStatus; updating in-memory store");
    }

    const memTarget = this.memoryDrafts.find(d => d.id === id);
    if (memTarget && memTarget.userId === userId) {
      memTarget.status = status;
      if (!updatedRecord) {
        updatedRecord = memTarget;
      }
    }

    return updatedRecord;
  }

  async createDraft(userId: number, deadlineId: number, title: string, body: string): Promise<DraftRecord> {
    const record: DraftRecord = {
      id: this.memoryDrafts.length + 1,
      userId,
      deadlineId,
      title,
      body,
      status: "draft",
      createdAt: new Date(),
    };

    try {
      const [inserted] = await db
        .insert(drafts)
        .values({
          userId,
          deadlineId,
          title,
          body,
          status: "draft",
        })
        .returning();
      if (inserted) {
        record.id = inserted.id;
      }
    } catch (err) {
      logger.warn({ err, deadlineId, operation: "createDraft" }, "Database unavailable for createDraft; persisted in memory only");
    }

    this.memoryDrafts.unshift(record);
    return record;
  }

  async findDraftByDeadline(deadlineId: number): Promise<boolean> {
    try {
      const found = await db.select().from(drafts).where(eq(drafts.deadlineId, deadlineId)).limit(1);
      return found.length > 0;
    } catch (err) {
      logger.warn({ err, deadlineId, operation: "findDraftByDeadline" }, "Database unavailable for findDraftByDeadline; checking memory store");
      return this.memoryDrafts.some(d => d.deadlineId === deadlineId);
    }
  }

  async getPreferences(userId: number): Promise<PreferencesRecord> {
    try {
      const [row] = await db.select().from(preferences).where(eq(preferences.userId, userId));
      if (row) return row as PreferencesRecord;
    } catch (err) {
      logger.warn({ err, operation: "getPreferences" }, "Database unavailable for preferences; using in-memory store");
    }
    return this.memoryPreferences;
  }

  async updatePreferences(userId: number, data: { weeklyDeskNote?: boolean; highRiskInterrupts?: boolean; deadlineReminders?: boolean }): Promise<PreferencesRecord> {
    const updated = {
      userId,
      weeklyDeskNote: data.weeklyDeskNote ?? this.memoryPreferences.weeklyDeskNote,
      highRiskInterrupts: data.highRiskInterrupts ?? this.memoryPreferences.highRiskInterrupts,
      deadlineReminders: data.deadlineReminders ?? this.memoryPreferences.deadlineReminders,
    };

    try {
      const [row] = await db
        .update(preferences)
        .set({
          weeklyDeskNote: updated.weeklyDeskNote,
          highRiskInterrupts: updated.highRiskInterrupts,
          deadlineReminders: updated.deadlineReminders,
        })
        .where(eq(preferences.userId, userId))
        .returning();
      if (row) {
        this.memoryPreferences = row as PreferencesRecord;
        return this.memoryPreferences;
      }
    } catch (err) {
      logger.warn({ err, operation: "updatePreferences" }, "Database unavailable for updatePreferences; updating in-memory store");
    }

    this.memoryPreferences = updated;
    return this.memoryPreferences;
  }

  async importCitations(userId: number, dois: string[]): Promise<CitationRecord[]> {
    const added: CitationRecord[] = [];

    for (const doi of dois) {
      const normalizedDoi = doi.trim();
      let exists = false;

      try {
        const [existing] = await db.select().from(citations).where(eq(citations.doi, normalizedDoi)).limit(1);
        if (existing) {
          exists = true;
        }
      } catch (err) {
        logger.warn({ err, doi: normalizedDoi, operation: "importCitations.check" }, "Database unavailable for import deduplication; checking memory");
        exists = this.memoryCitations.some(c => c.doi.toLowerCase() === normalizedDoi.toLowerCase());
      }

      if (exists) continue;

      const newRecord: CitationRecord = {
        id: this.memoryCitations.length + 1,
        userId,
        doi: normalizedDoi,
        title: normalizedDoi,
        authors: "Pending metadata lookup",
        venue: "",
        year: new Date().getFullYear(),
        status: "clear",
        risk: "low",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        const [inserted] = await db
          .insert(citations)
          .values({
            userId,
            doi: newRecord.doi,
            title: newRecord.title,
            authors: newRecord.authors,
            venue: newRecord.venue,
            year: newRecord.year,
            status: newRecord.status,
            risk: newRecord.risk,
          })
          .returning();
        if (inserted) {
          newRecord.id = inserted.id;
        }
      } catch (err) {
        logger.warn({ err, doi: normalizedDoi, operation: "importCitations.insert" }, "Database unavailable for import insert; storing in memory");
      }

      this.memoryCitations.push(newRecord);
      added.push(newRecord);
    }

    return added;
  }

  async saveCitationDecisions(decisions: Array<{
    citationId: number;
    status: string;
    risk: string;
    detail?: string | null;
    graph?: any;
    providerStatus?: any;
    trace?: any;
    retractedReferences?: any;
  }>): Promise<void> {
    for (const d of decisions) {
      try {
        await db
          .update(citations)
          .set({
            status: d.status as any,
            risk: d.risk as any,
            detail: d.detail,
            metadata: {
              graph: d.graph,
              providers: d.providerStatus,
              trace: d.trace,
              retractedReferences: d.retractedReferences,
            },
            updatedAt: new Date(),
          })
          .where(eq(citations.id, d.citationId));
      } catch (err) {
        logger.warn({ err, citationId: d.citationId, operation: "saveCitationDecisions" }, "Database unavailable to save scan decision; updating memory store");
      }

      const memTarget = this.memoryCitations.find(c => c.id === d.citationId);
      if (memTarget) {
        memTarget.status = d.status;
        memTarget.risk = d.risk;
        memTarget.detail = d.detail ?? null;
        memTarget.metadata = {
          graph: d.graph,
          providers: d.providerStatus,
          trace: d.trace,
          retractedReferences: d.retractedReferences,
        };
        memTarget.updatedAt = new Date();
      }
    }
  }

  async recordJudgment(
    id: number,
    userId: number,
    judgment: "relevant" | "not_relevant" | "deferred",
    notes: string
  ): Promise<CitationRecord | null> {
    const newStatus = judgment === "relevant" ? "quarantined" : judgment === "not_relevant" ? "clear" : "propagation";
    const newRisk = judgment === "relevant" ? "high" : judgment === "not_relevant" ? "low" : "medium";

    let updatedRecord: CitationRecord | null = null;

    try {
      const [updated] = await db
        .update(citations)
        .set({
          judgment: judgment as any,
          judgmentNotes: notes || null,
          judgmentAt: new Date(),
          status: newStatus as any,
          risk: newRisk as any,
          updatedAt: new Date(),
        })
        .where(eq(citations.id, id))
        .returning();
      if (updated) {
        updatedRecord = updated as CitationRecord;
      }
    } catch (err) {
      logger.warn({ err, id, operation: "recordJudgment" }, "Database unavailable to record judgment; updating memory store");
    }

    const memTarget = this.memoryCitations.find(c => c.id === id);
    if (memTarget) {
      memTarget.judgment = judgment;
      memTarget.judgmentNotes = notes || null;
      memTarget.judgmentAt = new Date();
      memTarget.status = newStatus;
      memTarget.risk = newRisk;
      memTarget.updatedAt = new Date();
      if (!updatedRecord) {
        updatedRecord = memTarget;
      }
    }

    const activityTitle =
      judgment === "relevant"
        ? "PI Judgment: Direct Dependency Quarantined"
        : judgment === "not_relevant"
        ? "PI Judgment: Scientific Independence Verified"
        : "PI Judgment: Review Deferred";

    const activityDesc =
      judgment === "relevant"
        ? `Researcher confirmed finding relies on retracted foundation work. Citation quarantined. Notes: "${notes || "Direct dependency"}"`
        : judgment === "not_relevant"
        ? `Researcher evaluated citation and verified claims do not depend on retracted premise. Marked safe. Notes: "${notes || "Independent claim"}"`
        : `Researcher deferred decision for further consultation. Notes: "${notes || "Pending lab discussion"}"`;

    await this.addActivity({
      userId,
      kind: judgment === "relevant" ? "flagged" : judgment === "not_relevant" ? "scan" : "escalation",
      tone: judgment === "relevant" ? "danger" : judgment === "not_relevant" ? "success" : "warning",
      title: activityTitle,
      description: activityDesc,
    });

    return updatedRecord;
  }
}

export const guardianStore = new GuardianStore();
