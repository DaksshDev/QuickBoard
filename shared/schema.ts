import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// This app primarily uses Firebase for data storage (Firestore & RTDB), 
// but we include a minimal schema here to satisfy backend boilerplate.
export const dummyUsers = pgTable("dummy_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertDummyUserSchema = createInsertSchema(dummyUsers).omit({ id: true });
export type InsertDummyUser = z.infer<typeof insertDummyUserSchema>;
export type DummyUser = typeof dummyUsers.$inferSelect;
