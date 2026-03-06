import { db } from "./db";
import { dummyUsers, type InsertDummyUser, type DummyUser } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getDummyUsers(): Promise<DummyUser[]>;
  createDummyUser(user: InsertDummyUser): Promise<DummyUser>;
}

export class DatabaseStorage implements IStorage {
  async getDummyUsers(): Promise<DummyUser[]> {
    return await db.select().from(dummyUsers);
  }

  async createDummyUser(user: InsertDummyUser): Promise<DummyUser> {
    const [newUser] = await db.insert(dummyUsers).values(user).returning();
    return newUser;
  }
}

export const storage = new DatabaseStorage();
