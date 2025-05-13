import {
  users, options, polls, votes, badges, badgeTypes, badgeInfo,
  type User, type Poll, type Option, type Vote, type Badge,
  type InsertUser, type InsertPoll, type InsertOption, type InsertVote, type InsertBadge
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Keep the interface the same
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  incrementUserPollCount(userId: string): Promise<User | undefined>;
  incrementUserVoteCount(userId: string): Promise<User | undefined>;
  
  // Poll methods
  createPoll(poll: InsertPoll): Promise<Poll>;
  getPoll(id: number): Promise<Poll | undefined>;
  getPollByShareCode(shareCode: string): Promise<Poll | undefined>;
  getPolls(isActive: boolean): Promise<Poll[]>;
  updatePollStatus(id: number, isActive: boolean): Promise<Poll | undefined>;
  removePoll(id: number): Promise<Poll | undefined>;
  updatePollPreviewImage(id: number, previewImageUrl: string): Promise<Poll | undefined>;
  
  // Option methods
  createOption(option: InsertOption): Promise<Option>;
  getOptionsByPollId(pollId: number): Promise<Option[]>;
  getOption(id: number): Promise<Option | undefined>;
  
  // Vote methods
  createVote(vote: InsertVote): Promise<Vote>;
  getVotesByPollId(pollId: number): Promise<Vote[]>;
  getVoteByUserAndPoll(userId: string, pollId: number): Promise<Vote | undefined>;
  
  // Badge methods
  getUserBadges(userId: string): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  hasBadge(userId: string, type: string): Promise<boolean>;
  updateBadgeLevel(userId: string, type: string, level: number): Promise<Badge | undefined>;
  checkAndAwardBadges(userId: string): Promise<Badge[]>;
}

// Helper function to update poll statuses
async function updatePollStatuses() {
  try {
    // Use raw SQL query for simplicity
    await db.execute(sql`
      UPDATE polls
      SET is_active = false
      WHERE is_active = true AND end_date < NOW()
    `);
    console.log('Poll statuses updated successfully');
  } catch (error) {
    console.error('Error updating poll statuses:', error);
  }
}

// Database implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    // Check for expired polls every minute
    setInterval(updatePollStatuses, 60000);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUserId(userId: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.userId, userId));
      return user;
    } catch (error) {
      console.error('Error getting user by userId:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values({
        ...insertUser,
        pollsCreated: 0,
        votesSubmitted: 0
      }).returning();
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async incrementUserPollCount(userId: string): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ 
          pollsCreated: sql`${users.pollsCreated} + 1` 
        })
        .where(eq(users.userId, userId))
        .returning();
        
      // Check and award badges based on updated counts
      await this.checkAndAwardBadges(userId);
      
      return updatedUser;
    } catch (error) {
      console.error('Error incrementing poll count:', error);
      return undefined;
    }
  }
  
  async incrementUserVoteCount(userId: string): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ 
          votesSubmitted: sql`${users.votesSubmitted} + 1` 
        })
        .where(eq(users.userId, userId))
        .returning();
        
      // Check and award badges based on updated counts
      await this.checkAndAwardBadges(userId);
      
      return updatedUser;
    } catch (error) {
      console.error('Error incrementing vote count:', error);
      return undefined;
    }
  }

  // Poll methods
  async createPoll(insertPoll: InsertPoll): Promise<Poll> {
    try {
      // Log the input for debugging
      console.log('Creating poll with data:', JSON.stringify(insertPoll, null, 2));
      
      // Convert the endDate if it's a string
      let endDateValue = insertPoll.endDate;
      if (typeof endDateValue === 'string') {
        endDateValue = new Date(endDateValue);
      }
      
      // Generate a unique share code for the poll
      const shareCode = this.generateShareCode();
      
      // Create a poll with regular insert
      const result = await db.insert(polls).values({
        question: insertPoll.question,
        description: insertPoll.description || null,
        createdBy: insertPoll.createdBy,
        endDate: endDateValue,
        isActive: true,
        createdAt: new Date(),
        shareCode: shareCode,
        previewImageUrl: insertPoll.previewImageUrl || null
      }).returning();
      
      // Log the result for debugging
      console.log('Poll created, result:', result);
      
      if (!result || result.length === 0) {
        throw new Error('Failed to create poll: No rows returned');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    }
  }
  
  // Helper function to generate a random share code
  private generateShareCode(): string {
    // Generate a random string of 8 characters
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let shareCode = '';
    
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      shareCode += characters.charAt(randomIndex);
    }
    
    return shareCode;
  }

  async getPoll(id: number): Promise<Poll | undefined> {
    try {
      const [poll] = await db.select().from(polls).where(eq(polls.id, id));
      return poll;
    } catch (error) {
      console.error('Error getting poll:', error);
      return undefined;
    }
  }
  
  async getPollByShareCode(shareCode: string): Promise<Poll | undefined> {
    try {
      const [poll] = await db.select().from(polls).where(eq(polls.shareCode, shareCode));
      return poll;
    } catch (error) {
      console.error('Error getting poll by share code:', error);
      return undefined;
    }
  }
  
  async updatePollPreviewImage(id: number, previewImageUrl: string): Promise<Poll | undefined> {
    try {
      const [updatedPoll] = await db
        .update(polls)
        .set({ previewImageUrl })
        .where(eq(polls.id, id))
        .returning();
      
      return updatedPoll;
    } catch (error) {
      console.error('Error updating poll preview image:', error);
      return undefined;
    }
  }

  async getPolls(isActive: boolean): Promise<Poll[]> {
    try {
      const whereConditions = and(
        eq(polls.isActive, isActive),
        eq(polls.isRemoved, false)
      );
      
      return db
        .select()
        .from(polls)
        .where(whereConditions)
        .orderBy(desc(polls.createdAt));
    } catch (error) {
      console.error('Error getting polls:', error);
      return [];
    }
  }

  async updatePollStatus(id: number, isActive: boolean): Promise<Poll | undefined> {
    try {
      const [poll] = await db
        .update(polls)
        .set({ isActive })
        .where(eq(polls.id, id))
        .returning();
      return poll;
    } catch (error) {
      console.error('Error updating poll status:', error);
      return undefined;
    }
  }
  
  async removePoll(id: number): Promise<Poll | undefined> {
    try {
      const [poll] = await db
        .update(polls)
        .set({ 
          isRemoved: true, 
          isActive: false 
        })
        .where(eq(polls.id, id))
        .returning();
      
      console.log(`Poll ${id} marked as removed`);
      return poll;
    } catch (error) {
      console.error('Error removing poll:', error);
      return undefined;
    }
  }

  // Option methods
  async createOption(insertOption: InsertOption): Promise<Option> {
    try {
      const [option] = await db
        .insert(options)
        .values(insertOption)
        .returning();
      return option;
    } catch (error) {
      console.error('Error creating option:', error);
      throw error;
    }
  }

  async getOptionsByPollId(pollId: number): Promise<Option[]> {
    try {
      return db
        .select()
        .from(options)
        .where(eq(options.pollId, pollId));
    } catch (error) {
      console.error('Error getting options by pollId:', error);
      return [];
    }
  }

  async getOption(id: number): Promise<Option | undefined> {
    try {
      const [option] = await db.select().from(options).where(eq(options.id, id));
      return option;
    } catch (error) {
      console.error('Error getting option:', error);
      return undefined;
    }
  }

  // Vote methods
  async createVote(insertVote: InsertVote): Promise<Vote> {
    try {
      const [vote] = await db
        .insert(votes)
        .values({
          ...insertVote,
          votedAt: new Date()
        })
        .returning();
      return vote;
    } catch (error) {
      console.error('Error creating vote:', error);
      throw error;
    }
  }

  async getVotesByPollId(pollId: number): Promise<Vote[]> {
    try {
      return db
        .select()
        .from(votes)
        .where(eq(votes.pollId, pollId));
    } catch (error) {
      console.error('Error getting votes by pollId:', error);
      return [];
    }
  }

  async getVoteByUserAndPoll(userId: string, pollId: number): Promise<Vote | undefined> {
    try {
      const [vote] = await db
        .select()
        .from(votes)
        .where(
          and(
            eq(votes.userId, userId),
            eq(votes.pollId, pollId)
          )
        );
      return vote;
    } catch (error) {
      console.error('Error getting vote by user and poll:', error);
      return undefined;
    }
  }
  
  // Badge methods
  async getUserBadges(userId: string): Promise<Badge[]> {
    try {
      return await db
        .select()
        .from(badges)
        .where(eq(badges.userId, userId))
        .orderBy(desc(badges.level), desc(badges.earnedAt));
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  }
  
  async createBadge(badge: InsertBadge): Promise<Badge> {
    try {
      const [newBadge] = await db
        .insert(badges)
        .values(badge)
        .returning();
      return newBadge;
    } catch (error) {
      console.error('Error creating badge:', error);
      throw error;
    }
  }
  
  async hasBadge(userId: string, type: string): Promise<boolean> {
    try {
      const results = await db
        .select()
        .from(badges)
        .where(and(
          eq(badges.userId, userId),
          eq(badges.type, type)
        ));
      return results.length > 0;
    } catch (error) {
      console.error('Error checking for badge:', error);
      return false;
    }
  }
  
  async updateBadgeLevel(userId: string, type: string, level: number): Promise<Badge | undefined> {
    try {
      const [updatedBadge] = await db
        .update(badges)
        .set({ 
          level,
          earnedAt: new Date()
        })
        .where(and(
          eq(badges.userId, userId),
          eq(badges.type, type)
        ))
        .returning();
      return updatedBadge;
    } catch (error) {
      console.error('Error updating badge level:', error);
      return undefined;
    }
  }
  
  async checkAndAwardBadges(userId: string): Promise<Badge[]> {
    try {
      const user = await this.getUserByUserId(userId);
      if (!user) return [];
      
      const awardedBadges: Badge[] = [];
      
      // Poll Creator badge
      if (user.pollsCreated > 0) {
        const hasPollCreatorBadge = await this.hasBadge(userId, badgeTypes.POLL_CREATOR);
        
        let level = 1;
        if (user.pollsCreated >= 10) level = 3;
        else if (user.pollsCreated >= 5) level = 2;
        
        if (!hasPollCreatorBadge) {
          const badge = await this.createBadge({
            userId,
            type: badgeTypes.POLL_CREATOR,
            level
          });
          awardedBadges.push(badge);
        } else {
          // Check if level needs to be upgraded
          const userBadges = await this.getUserBadges(userId);
          const pollCreatorBadge = userBadges.find(b => b.type === badgeTypes.POLL_CREATOR);
          
          if (pollCreatorBadge && pollCreatorBadge.level < level) {
            const updatedBadge = await this.updateBadgeLevel(userId, badgeTypes.POLL_CREATOR, level);
            if (updatedBadge) awardedBadges.push(updatedBadge);
          }
        }
      }
      
      // First Vote badge level updates
      if (user.votesSubmitted > 0) {
        const hasFirstVoteBadge = await this.hasBadge(userId, badgeTypes.FIRST_VOTE);
        
        let level = 1;
        if (user.votesSubmitted >= 20) level = 3;
        else if (user.votesSubmitted >= 5) level = 2;
        
        if (!hasFirstVoteBadge) {
          const badge = await this.createBadge({
            userId,
            type: badgeTypes.FIRST_VOTE,
            level
          });
          awardedBadges.push(badge);
        } else {
          // Check if level needs to be upgraded
          const userBadges = await this.getUserBadges(userId);
          const firstVoteBadge = userBadges.find(b => b.type === badgeTypes.FIRST_VOTE);
          
          if (firstVoteBadge && firstVoteBadge.level < level) {
            const updatedBadge = await this.updateBadgeLevel(userId, badgeTypes.FIRST_VOTE, level);
            if (updatedBadge) awardedBadges.push(updatedBadge);
          }
        }
      }
      
      return awardedBadges;
    } catch (error) {
      console.error('Error checking and awarding badges:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
