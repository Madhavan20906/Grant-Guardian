import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("researcher"),
  passwordHash: text("password_hash"),
  salt: text("salt"),
  title: text("title").notNull().default("Dr."),
  labName: text("lab_name").notNull().default("Research Laboratory"),
  institution: text("institution").notNull().default("University Research Institute"),
  focus: text("focus").notNull().default("General Research & Grant Development"),
  proposalName: text("proposal_name").notNull().default("Active Research Grant"),
  initials: text("initials").notNull().default("PI"),
  tenantSlug: text("tenant_slug"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const citations = pgTable("citations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  doi: text("doi").notNull(),
  title: text("title").notNull(),
  authors: text("authors").notNull().default(""),
  venue: text("venue").notNull().default(""),
  year: integer("year").notNull(),
  status: text("status").notNull().default("clear"),
  risk: text("risk").notNull().default("low"),
  detail: text("detail"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  judgment: text("judgment").default("pending"),
  judgmentNotes: text("judgment_notes"),
  judgmentAt: timestamp("judgment_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deadlines = pgTable("deadlines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  owner: text("owner").notNull().default("You"),
  progress: integer("progress").notNull().default(0),
  status: text("status").notNull().default("on_track"),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tone: text("tone").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const drafts = pgTable("drafts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deadlineId: integer("deadline_id").notNull().references(() => deadlines.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const preferences = pgTable("preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  weeklyDeskNote: boolean("weekly_desk_note").notNull().default(true),
  highRiskInterrupts: boolean("high_risk_interrupts").notNull().default(true),
  deadlineReminders: boolean("deadline_reminders").notNull().default(true),
});