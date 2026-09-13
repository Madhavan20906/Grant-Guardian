import { and, desc, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@workspace/db";
import { activities, citations, deadlines, drafts, preferences, users } from "@workspace/db/schema";
import { demoActivities, demoCitations, demoDeadlines, demoPersonas, ensureSeedData, type PersonaProfile } from "@workspace/db/seed";
import { hashPassword } from "./auth";
import { logger } from "./logger";

export interface UserRecord {
  id: number;
  email: string;
  name: string;
  role: string;
  passwordHash?: string | null;
  salt?: string | null;
  title: string;
  labName: string;
  institution: string;
  focus: string;
  proposalName: string;
  initials: string;
  tenantSlug: string;
  createdAt: Date;
}

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

const DEFAULT_DEMO_HASH = hashPassword("Guardian#2026", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

class GuardianStore {
  private memoryUsers: UserRecord[] = demoPersonas.map((p) => ({
    id: p.id,
    email: p.email.toLowerCase(),
    name: p.name,
    role: p.role,
    passwordHash: DEFAULT_DEMO_HASH.hash,
    salt: DEFAULT_DEMO_HASH.salt,
    title: p.title,
    labName: p.lab,
    institution: p.institution || "Research University & Institute",
    focus: p.focus,
    proposalName: p.proposalName || "Active Research Grant Proposal",
    initials: p.initials,
    tenantSlug: p.slug,
    createdAt: new Date(),
  }));

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
  private memoryPreferences: PreferencesRecord[] = [
    { userId: 1, weeklyDeskNote: true, highRiskInterrupts: true, deadlineReminders: true },
    { userId: 2, weeklyDeskNote: true, highRiskInterrupts: true, deadlineReminders: true },
    { userId: 3, weeklyDeskNote: true, highRiskInterrupts: true, deadlineReminders: true },
    { userId: 4, weeklyDeskNote: true, highRiskInterrupts: true, deadlineReminders: true },
  ];

  private initialized: Promise<number> | null = null;

  async ensureReady(): Promise<void> {
    if (!isDatabaseConfigured) {
      return;
    }
    try {
      await (this.initialized ??= ensureSeedData());
    } catch (err) {
      logger.warn({ err }, "Database initialization warning; in-memory store active");
    }
  }

  getPersonas(): PersonaProfile[] {
    return this.memoryUsers.map((u) => ({
      id: u.id,
      slug: u.tenantSlug,
      name: u.name,
      email: u.email,
      role: u.role,
      title: u.title,
      lab: u.labName,
      institution: u.institution,
      proposalName: u.proposalName,
      initials: u.initials,
      focus: u.focus,
    }));
  }

  async listTenants(): Promise<UserRecord[]> {
    if (!isDatabaseConfigured) {
      return [...this.memoryUsers];
    }
    await this.ensureReady();
    try {
      const rows = await db.select().from(users).orderBy(users.id);
      if (rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          email: r.email,
          name: r.name,
          role: r.role,
          title: r.title ?? "Dr.",
          labName: r.labName ?? "Research Laboratory",
          institution: r.institution ?? "Research Institution",
          focus: r.focus ?? "Scientific Research",
          proposalName: r.proposalName ?? "Active Research Proposal",
          initials: r.initials ?? "PI",
          tenantSlug: r.tenantSlug ?? `user-${r.id}`,
          createdAt: r.createdAt ?? new Date(),
        }));
      }
    } catch {
      // Fallback to memory
    }
    return [...this.memoryUsers];
  }

  async getUserById(id: number): Promise<UserRecord | null> {
    if (!isDatabaseConfigured) {
      return this.memoryUsers.find((u) => u.id === id) ?? null;
    }
    await this.ensureReady();
    try {
      const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (row) {
        return {
          id: row.id,
          email: row.email,
          name: row.name,
          role: row.role,
          passwordHash: row.passwordHash,
          salt: row.salt,
          title: row.title ?? "Dr.",
          labName: row.labName ?? "Research Laboratory",
          institution: row.institution ?? "Research Institution",
          focus: row.focus ?? "Scientific Research",
          proposalName: row.proposalName ?? "Active Research Proposal",
          initials: row.initials ?? "PI",
          tenantSlug: row.tenantSlug ?? `user-${row.id}`,
          createdAt: row.createdAt ?? new Date(),
        };
      }
    } catch {
      // Fallback to memory
    }
    return this.memoryUsers.find((u) => u.id === id) ?? null;
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    await this.ensureReady();
    const cleanEmail = email.trim().toLowerCase();
    try {
      const [row] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      if (row) {
        return {
          id: row.id,
          email: row.email,
          name: row.name,
          role: row.role,
          passwordHash: row.passwordHash,
          salt: row.salt,
          title: row.title ?? "Dr.",
          labName: row.labName ?? "Research Laboratory",
          institution: row.institution ?? "Research Institution",
          focus: row.focus ?? "Scientific Research",
          proposalName: row.proposalName ?? "Active Research Proposal",
          initials: row.initials ?? "PI",
          tenantSlug: row.tenantSlug ?? `user-${row.id}`,
          createdAt: row.createdAt ?? new Date(),
        };
      }
    } catch {
      // Fallback to memory
    }
    return this.memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail) ?? null;
  }

  async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    salt: string;
    role?: string;
    title?: string;
    labName?: string;
    institution?: string;
    focus?: string;
    proposalName?: string;
    initials?: string;
    tenantSlug?: string;
    starterTemplate?: string;
  }): Promise<UserRecord> {
    await this.ensureReady();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();
    const title = data.title?.trim() || "Dr.";
    const labName = data.labName?.trim() || `${cleanName.split(" ").pop() || "Research"} Lab`;
    const institution = data.institution?.trim() || "Research University";
    const focus = data.focus?.trim() || "Grant-Funded Research";
    const proposalName = data.proposalName?.trim() || "Active Grant Proposal";
    const initials = data.initials?.trim() || cleanName.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "PI";
    const tenantSlug = data.tenantSlug?.trim().toLowerCase() || cleanEmail.split("@")[0].replace(/[^a-z0-9]/g, "-");

    const newId = this.memoryUsers.length > 0 ? Math.max(...this.memoryUsers.map((u) => u.id)) + 1 : 1;
    const userRecord: UserRecord = {
      id: newId,
      email: cleanEmail,
      name: cleanName,
      role: data.role || "PI",
      passwordHash: data.passwordHash,
      salt: data.salt,
      title,
      labName,
      institution,
      focus,
      proposalName,
      initials,
      tenantSlug,
      createdAt: new Date(),
    };

    try {
      const [inserted] = await db
        .insert(users)
        .values({
          name: userRecord.name,
          email: userRecord.email,
          role: userRecord.role,
          passwordHash: userRecord.passwordHash,
          salt: userRecord.salt,
          title: userRecord.title,
          labName: userRecord.labName,
          institution: userRecord.institution,
          focus: userRecord.focus,
          proposalName: userRecord.proposalName,
          initials: userRecord.initials,
          tenantSlug: userRecord.tenantSlug,
        })
        .returning();
      if (inserted) {
        userRecord.id = inserted.id;
      }
      await db.insert(preferences).values({ userId: userRecord.id });
    } catch (err) {
      logger.warn({ err, email: cleanEmail }, "Database user insertion failed; storing in memory");
    }

    this.memoryUsers.push(userRecord);
    this.memoryPreferences.push({
      userId: userRecord.id,
      weeklyDeskNote: true,
      highRiskInterrupts: true,
      deadlineReminders: true,
    });

    // Populate starter template if requested (defaults to biomaterials)
    if (data.starterTemplate && data.starterTemplate !== "clean") {
      await this.seedUserWorkspace(userRecord.id, data.starterTemplate);
    }

    // Add initial welcome activity
    await this.addActivity({
      userId: userRecord.id,
      kind: "scan",
      title: "New Research Tenant Initialized",
      description: `Tenant workspace initialized for ${title} ${cleanName} (${labName} · ${institution}).`,
      tone: "neutral",
    });

    return userRecord;
  }

  async seedUserWorkspace(
    userId: number,
    template: string = "biomaterials"
  ): Promise<{ citationsCount: number; deadlinesCount: number }> {
    await this.ensureReady();
    const sourceUserId = template === "oncology" ? 2 : 1;
    const user = await this.getUserById(userId);
    const ownerName = user
      ? user.title && user.title.includes(user.name)
        ? user.title
        : `${user.title ? user.title + " " : ""}${user.name}`
      : "Principal Investigator";
    const proposalName = user?.proposalName || "Active Research Proposal";

    // Filter and clone citations
    const templateCitations = demoCitations.filter((c) => c.userId === sourceUserId);
    const clonedCitations: CitationRecord[] = templateCitations.map((c, i) => {
      const meta = c.metadata ? JSON.parse(JSON.stringify(c.metadata)) : undefined;
      if (meta?.graph?.cascade) {
        meta.graph.cascade.project = proposalName;
      }
      return {
        ...c,
        id: this.memoryCitations.length + i + 1,
        userId,
        metadata: meta,
        judgment: (c as any).judgment ?? "pending",
        judgmentNotes: (c as any).judgmentNotes ?? null,
        judgmentAt: (c as any).judgmentAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Filter and clone deadlines
    const templateDeadlines = demoDeadlines.filter((d) => d.userId === sourceUserId);
    const clonedDeadlines: DeadlineRecord[] = templateDeadlines.map((d, i) => ({
      ...d,
      id: this.memoryDeadlines.length + i + 1,
      userId,
      owner: ownerName,
    }));

    // Filter and clone activities
    const templateActivities = demoActivities.filter((a) => a.userId === sourceUserId);
    const clonedActivities: ActivityRecord[] = templateActivities.map((a, i) => ({
      ...a,
      id: this.memoryActivities.length + i + 1,
      userId,
      title: a.title
        .replace(/Dr\. Elena Rossi/g, ownerName)
        .replace(/Dr\. Marcus Chen/g, ownerName)
        .replace(/Dr\. Sarah Jenkins/g, ownerName)
        .replace(/Dr\. Chen/g, ownerName),
      description: a.description
        .replace(/Dr\. Elena Rossi/g, ownerName)
        .replace(/Dr\. Marcus Chen/g, ownerName)
        .replace(/Dr\. Sarah Jenkins/g, ownerName)
        .replace(/Dr\. Chen/g, ownerName),
      createdAt: new Date(Date.now() - (i + 1) * 3600000),
    }));

    this.memoryCitations.push(...clonedCitations);
    this.memoryDeadlines.push(...clonedDeadlines);
    this.memoryActivities.push(...clonedActivities);

    if (isDatabaseConfigured) {
      try {
        if (clonedCitations.length > 0) {
          await db.insert(citations).values(
            clonedCitations.map((c) => ({
              userId: c.userId,
              title: c.title,
              authors: c.authors,
              venue: c.venue,
              year: c.year,
              doi: c.doi,
              status: c.status,
              risk: c.risk,
              detail: c.detail,
              metadata: c.metadata,
              judgment: c.judgment,
              judgmentNotes: c.judgmentNotes,
              judgmentAt: c.judgmentAt,
            }))
          );
        }
        if (clonedDeadlines.length > 0) {
          await db.insert(deadlines).values(
            clonedDeadlines.map((d) => ({
              userId: d.userId,
              type: d.type,
              title: d.title,
              dueDate: d.dueDate,
              progress: d.progress,
              owner: d.owner,
            }))
          );
        }
        if (clonedActivities.length > 0) {
          await db.insert(activities).values(
            clonedActivities.map((a) => ({
              userId: a.userId,
              kind: a.kind,
              title: a.title,
              description: a.description,
              tone: a.tone,
            }))
          );
        }
      } catch (err) {
        logger.warn({ err, userId }, "Database insertion during seedUserWorkspace failed; memory store populated");
      }
    }

    return {
      citationsCount: clonedCitations.length,
      deadlinesCount: clonedDeadlines.length,
    };
  }

  async updateUserProfile(
    id: number,
    data: {
      name?: string;
      title?: string;
      labName?: string;
      institution?: string;
      focus?: string;
      proposalName?: string;
      initials?: string;
    }
  ): Promise<UserRecord | null> {
    await this.ensureReady();
    try {
      const [updated] = await db
        .update(users)
        .set({
          ...(data.name ? { name: data.name.trim() } : {}),
          ...(data.title ? { title: data.title.trim() } : {}),
          ...(data.labName ? { labName: data.labName.trim() } : {}),
          ...(data.institution ? { institution: data.institution.trim() } : {}),
          ...(data.focus ? { focus: data.focus.trim() } : {}),
          ...(data.proposalName ? { proposalName: data.proposalName.trim() } : {}),
          ...(data.initials ? { initials: data.initials.trim().toUpperCase() } : {}),
        })
        .where(eq(users.id, id))
        .returning();
      if (updated) {
        const mem = this.memoryUsers.find(u => u.id === id);
        if (mem) {
          Object.assign(mem, {
            name: updated.name,
            title: updated.title,
            labName: updated.labName,
            institution: updated.institution,
            focus: updated.focus,
            proposalName: updated.proposalName,
            initials: updated.initials,
          });
        }
        return this.getUserById(id);
      }
    } catch (err) {
      logger.warn({ err, id }, "Database unavailable for updateUserProfile; updating in-memory store");
    }

    const mem = this.memoryUsers.find(u => u.id === id);
    if (mem) {
      if (data.name) mem.name = data.name.trim();
      if (data.title) mem.title = data.title.trim();
      if (data.labName) mem.labName = data.labName.trim();
      if (data.institution) mem.institution = data.institution.trim();
      if (data.focus) mem.focus = data.focus.trim();
      if (data.proposalName) mem.proposalName = data.proposalName.trim();
      if (data.initials) mem.initials = data.initials.trim().toUpperCase();
      return mem;
    }
    return null;
  }

  async getUserId(identifier?: string | number): Promise<number> {
    await this.ensureReady();
    if (identifier === undefined || identifier === null) return 1;
    if (typeof identifier === "number" && !isNaN(identifier)) {
      const match = this.memoryUsers.find(p => p.id === identifier);
      return match ? match.id : identifier;
    }
    const clean = String(identifier).trim().toLowerCase();
    const numeric = parseInt(clean, 10);
    if (!isNaN(numeric)) {
      const match = this.memoryUsers.find(p => p.id === numeric);
      if (match) return match.id;
    }
    const matched = this.memoryUsers.find(
      p => p.tenantSlug.toLowerCase() === clean || p.name.toLowerCase().includes(clean) || p.email.toLowerCase() === clean
    );
    return matched ? matched.id : 1;
  }

  async getOverview(userId: number) {
    const userCitations = this.memoryCitations.filter(c => c.userId === userId);
    const userDeadlines = this.memoryDeadlines.filter(d => d.userId === userId);
    const userActivities = this.memoryActivities.filter(a => a.userId === userId);
    const last = userActivities[0]?.createdAt;
    const memoryOverview = {
      citationsTracked: userCitations.length,
      issuesFound: userCitations.filter(item => item.risk !== "low").length,
      deadlinesTracked: userDeadlines.length,
      pendingJudgments: userCitations.filter(item => item.status === "propagation").length,
      lastScan: last ? last.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Not scanned yet",
    };

    if (!isDatabaseConfigured) {
      return memoryOverview;
    }

    try {
      const [sourceRows, deadlineRows, issueRows, pendingRows] = await Promise.all([
        db.select().from(citations).where(eq(citations.userId, userId)),
        db.select().from(deadlines).where(eq(deadlines.userId, userId)),
        db.select().from(citations).where(eq(citations.userId, userId)),
        db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.createdAt)),
      ]);
      const lastRow = pendingRows[0]?.createdAt;
      return {
        citationsTracked: sourceRows.length,
        issuesFound: issueRows.filter(item => item.risk !== "low").length,
        deadlinesTracked: deadlineRows.length,
        pendingJudgments: issueRows.filter(item => item.status === "propagation").length,
        lastScan: lastRow ? lastRow.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Not scanned yet",
      };
    } catch (err) {
      logger.warn({ err, operation: "getOverview" }, "Database unavailable for overview; using in-memory store");
      return memoryOverview;
    }
  }

  async getCitations(userId: number): Promise<CitationRecord[]> {
    if (!isDatabaseConfigured) {
      return this.memoryCitations.filter(c => c.userId === userId);
    }
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
    if (!isDatabaseConfigured) {
      return this.memoryDeadlines.filter(d => d.userId === userId);
    }
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
    if (!isDatabaseConfigured) {
      return this.memoryDeadlines.find(d => d.id === id && d.userId === userId) ?? null;
    }
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

  async addDeadline(data: {
    userId: number;
    type: string;
    title: string;
    dueDate: Date;
    owner: string;
    progress?: number;
    status?: "on_track" | "due_soon" | "attention";
  }): Promise<DeadlineRecord> {
    const progress = data.progress ?? 15;
    const days = Math.ceil((data.dueDate.getTime() - Date.now()) / 86_400_000);
    const status = data.status || (days <= 7 ? "attention" : days <= 21 ? "due_soon" : "on_track");

    const record: DeadlineRecord = {
      id: this.memoryDeadlines.length + 100,
      userId: data.userId,
      type: data.type,
      title: data.title,
      dueDate: data.dueDate,
      owner: data.owner,
      progress,
      status,
    };

    if (isDatabaseConfigured) {
      try {
        const [inserted] = await db
          .insert(deadlines)
          .values({
            userId: data.userId,
            type: data.type,
            title: data.title,
            dueDate: data.dueDate,
            owner: data.owner,
            progress,
            status,
          })
          .returning();
        if (inserted) {
          record.id = inserted.id;
        }
      } catch (err) {
        logger.warn({ err, operation: "addDeadline" }, "Database unavailable for addDeadline; saved to memory");
      }
    }

    this.memoryDeadlines.push(record);
    return record;
  }


  async getActivities(userId: number, limit = 100): Promise<ActivityRecord[]> {
    if (!isDatabaseConfigured) {
      return this.memoryActivities
        .filter(a => a.userId === userId)
        .slice(0, limit);
    }
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
    const now = data.createdAt ?? new Date();

    // Deduplication check: prevent identical consecutive events within 90 seconds (avoids double-fire UI glitches)
    const existingIndex = this.memoryActivities.findIndex(
      (a) =>
        a.userId === data.userId &&
        a.title === data.title &&
        Math.abs(new Date(a.createdAt).getTime() - now.getTime()) < 90_000
    );
    if (existingIndex !== -1) {
      this.memoryActivities[existingIndex].description = data.description;
      this.memoryActivities[existingIndex].createdAt = now;
      return this.memoryActivities[existingIndex];
    }

    const record: ActivityRecord = {
      id: this.memoryActivities.length + 1,
      userId: data.userId,
      kind: data.kind,
      title: data.title,
      description: data.description,
      tone: data.tone,
      createdAt: now,
    };

    if (!isDatabaseConfigured) {
      this.memoryActivities.unshift(record);
      return record;
    }

    try {
      const [inserted] = await db
        .insert(activities)
        .values({
          userId: data.userId,
          kind: data.kind,
          title: data.title,
          description: data.description,
          tone: data.tone,
          createdAt: data.createdAt ?? new Date(),
        })
        .returning();
      if (inserted) {
        this.memoryActivities.unshift(inserted as ActivityRecord);
        return inserted as ActivityRecord;
      }
    } catch (err) {
      logger.warn({ err, operation: "addActivity" }, "Database unavailable for addActivity; persisted in memory only");
    }

    this.memoryActivities.unshift(record);
    return record;
  }

  async getDrafts(userId: number, limit = 25): Promise<DraftRecord[]> {
    if (!isDatabaseConfigured) {
      return this.memoryDrafts.filter(d => d.userId === userId).slice(0, limit);
    }
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

    if (isDatabaseConfigured) {
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

    if (!isDatabaseConfigured) {
      this.memoryDrafts.unshift(record);
      return record;
    }

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
    if (!isDatabaseConfigured) {
      return this.memoryDrafts.some(d => d.deadlineId === deadlineId);
    }
    try {
      const found = await db.select().from(drafts).where(eq(drafts.deadlineId, deadlineId)).limit(1);
      return found.length > 0;
    } catch (err) {
      logger.warn({ err, deadlineId, operation: "findDraftByDeadline" }, "Database unavailable for findDraftByDeadline; checking memory store");
      return this.memoryDrafts.some(d => d.deadlineId === deadlineId);
    }
  }

  async getPreferences(userId: number): Promise<PreferencesRecord> {
    if (isDatabaseConfigured) {
      try {
        const [row] = await db.select().from(preferences).where(eq(preferences.userId, userId));
        if (row) return row as PreferencesRecord;
      } catch (err) {
        logger.warn({ err, operation: "getPreferences" }, "Database unavailable for preferences; using in-memory store");
      }
    }
    const mem = this.memoryPreferences.find(p => p.userId === userId);
    return mem || { userId, weeklyDeskNote: true, highRiskInterrupts: true, deadlineReminders: true };
  }

  async updatePreferences(userId: number, data: { weeklyDeskNote?: boolean; highRiskInterrupts?: boolean; deadlineReminders?: boolean }): Promise<PreferencesRecord> {
    const current = await this.getPreferences(userId);
    const updated = {
      userId,
      weeklyDeskNote: data.weeklyDeskNote ?? current.weeklyDeskNote,
      highRiskInterrupts: data.highRiskInterrupts ?? current.highRiskInterrupts,
      deadlineReminders: data.deadlineReminders ?? current.deadlineReminders,
    };

    if (isDatabaseConfigured) {
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
          return row as PreferencesRecord;
        }
      } catch (err) {
        logger.warn({ err, operation: "updatePreferences" }, "Database unavailable for updatePreferences; updating in-memory store");
      }
    }

    const idx = this.memoryPreferences.findIndex(p => p.userId === userId);
    if (idx >= 0) {
      this.memoryPreferences[idx] = updated;
    } else {
      this.memoryPreferences.push(updated);
    }
    return updated;
  }

  async importCitations(userId: number, dois: string[]): Promise<CitationRecord[]> {
    const added: CitationRecord[] = [];

    for (const doi of dois) {
      const normalizedDoi = doi.trim();
      let exists = false;

      if (isDatabaseConfigured) {
        try {
          const [existing] = await db
            .select()
            .from(citations)
            .where(and(eq(citations.userId, userId), eq(citations.doi, normalizedDoi)))
            .limit(1);
          if (existing) {
            exists = true;
          }
        } catch (err) {
          logger.warn({ err, doi: normalizedDoi, operation: "importCitations.check" }, "Database unavailable for import deduplication; checking memory");
          exists = this.memoryCitations.some(c => c.userId === userId && c.doi.toLowerCase() === normalizedDoi.toLowerCase());
        }
      } else {
        exists = this.memoryCitations.some(c => c.userId === userId && c.doi.toLowerCase() === normalizedDoi.toLowerCase());
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

      if (isDatabaseConfigured) {
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
      if (isDatabaseConfigured) {
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
