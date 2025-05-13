import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Badge types enum
export const badgeTypes = {
  POLL_CREATOR: "poll_creator",
  POLL_MASTER: "poll_master", 
  VOTE_COLLECTOR: "vote_collector",
  FIRST_VOTE: "first_vote",
  TOP_CONTRIBUTOR: "top_contributor",
} as const;

export type BadgeType = typeof badgeTypes[keyof typeof badgeTypes];

// Badge descriptions and criteria
export const badgeInfo = {
  [badgeTypes.POLL_CREATOR]: {
    name: "Poll Creator",
    description: "Create your first poll",
    icon: "📊",
    levels: [
      { level: 1, requirement: 1, title: "Novice Pollster" },
      { level: 2, requirement: 5, title: "Poll Enthusiast" },
      { level: 3, requirement: 10, title: "Poll Master" }
    ]
  },
  [badgeTypes.VOTE_COLLECTOR]: { 
    name: "Vote Collector", 
    description: "Collect votes on your polls",
    icon: "🗳️",
    levels: [
      { level: 1, requirement: 10, title: "Vote Gatherer" },
      { level: 2, requirement: 50, title: "Vote Magnet" },
      { level: 3, requirement: 100, title: "Vote Champion" }
    ]
  },
  [badgeTypes.FIRST_VOTE]: { 
    name: "First Vote", 
    description: "Cast your first vote",
    icon: "👍",
    levels: [
      { level: 1, requirement: 1, title: "First-time Voter" },
      { level: 2, requirement: 5, title: "Regular Voter" },
      { level: 3, requirement: 20, title: "Dedicated Voter" }
    ]
  },
  [badgeTypes.POLL_MASTER]: {
    name: "Poll Master",
    description: "Create high-quality polls",
    icon: "🌟",
    levels: [
      { level: 1, requirement: 1, title: "Poll Apprentice" },
      { level: 2, requirement: 3, title: "Poll Expert" },
      { level: 3, requirement: 5, title: "Poll Guru" }
    ]
  },
  [badgeTypes.TOP_CONTRIBUTOR]: {
    name: "Top Contributor",
    description: "Be active in the community",
    icon: "🏆",
    levels: [
      { level: 1, requirement: 5, title: "Community Member" },
      { level: 2, requirement: 15, title: "Community Influencer" },
      { level: 3, requirement: 30, title: "Community Leader" }
    ]
  }
};

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  level: integer("level").default(1).notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

export const insertBadgeSchema = createInsertSchema(badges).pick({
  userId: true,
  type: true,
  level: true,
});

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  userId: text("user_id").notNull().unique(),
  pollsCreated: integer("polls_created").default(0).notNull(),
  votesSubmitted: integer("votes_submitted").default(0).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  userId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isRemoved: boolean("is_removed").notNull().default(false),
  previewImageUrl: text("preview_image_url"),
  shareCode: varchar("share_code", { length: 16 }).unique(),
});

// Custom schema for poll creation that properly handles date strings
export const insertPollSchema = z.object({
  question: z.string().min(1, "Question is required"),
  description: z.string().optional(),
  createdBy: z.string().min(1, "Creator ID is required"),
  endDate: z.string().transform(str => new Date(str)),
  previewImageUrl: z.string().optional(),
});

export type InsertPoll = z.infer<typeof insertPollSchema>;
export type Poll = typeof polls.$inferSelect;

export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  text: text("text").notNull(),
});

export const insertOptionSchema = createInsertSchema(options).pick({
  pollId: true,
  text: true,
});

export type InsertOption = z.infer<typeof insertOptionSchema>;
export type Option = typeof options.$inferSelect;

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull(),
  optionId: integer("option_id").notNull(),
  userId: text("user_id").notNull(),
  votedAt: timestamp("voted_at").notNull().defaultNow(),
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  pollId: true,
  optionId: true,
  userId: true,
});

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

// Extended types for frontend
export type PollWithOptions = Poll & {
  options: Option[];
};

export type PollWithOptionsAndVotes = PollWithOptions & {
  totalVotes: number;
  optionsWithVotes: (Option & { votes: number; percentage: number })[];
  userVote?: { optionId: number; text: string } | null;
};
