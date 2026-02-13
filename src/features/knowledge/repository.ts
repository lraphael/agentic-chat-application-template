import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/core/database/client";

import type { KnowledgeEntry, NewKnowledgeEntry } from "./models";
import { knowledgeEntries } from "./models";

export async function findAll(): Promise<KnowledgeEntry[]> {
  return db.select().from(knowledgeEntries).orderBy(desc(knowledgeEntries.createdAt));
}

export async function findById(id: string): Promise<KnowledgeEntry | undefined> {
  const results = await db
    .select()
    .from(knowledgeEntries)
    .where(eq(knowledgeEntries.id, id))
    .limit(1);
  return results[0];
}

export async function create(data: NewKnowledgeEntry): Promise<KnowledgeEntry> {
  const results = await db.insert(knowledgeEntries).values(data).returning();
  const entry = results[0];
  if (!entry) {
    throw new Error("Failed to create knowledge entry");
  }
  return entry;
}

export async function update(
  id: string,
  data: Partial<NewKnowledgeEntry>,
): Promise<KnowledgeEntry | undefined> {
  const results = await db
    .update(knowledgeEntries)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(knowledgeEntries.id, id))
    .returning();
  return results[0];
}

export async function deleteById(id: string): Promise<boolean> {
  const results = await db.delete(knowledgeEntries).where(eq(knowledgeEntries.id, id)).returning();
  return results.length > 0;
}

/**
 * Full-text search using Postgres tsvector/tsquery.
 * Title matches are weighted higher (A) than content matches (B).
 * Falls back to ILIKE if FTS returns no results.
 */
export async function fullTextSearch(query: string, limit = 5): Promise<KnowledgeEntry[]> {
  // Primary: Postgres full-text search with ranking
  // db.execute with postgres-js returns the result array directly (no .rows)
  const ftsResults: KnowledgeEntry[] = await db.execute(sql`
    SELECT id, title, content, tags, contributor, created_at, updated_at
    FROM knowledge_entries
    WHERE search_vector @@ plainto_tsquery('english', ${query})
    ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${query})) DESC
    LIMIT ${limit}
  `);

  if (ftsResults.length > 0) {
    return ftsResults;
  }

  // Fallback: ILIKE for partial matches when FTS finds nothing
  const pattern = `%${query}%`;
  const ilikeResults: KnowledgeEntry[] = await db.execute(sql`
    SELECT id, title, content, tags, contributor, created_at, updated_at
    FROM knowledge_entries
    WHERE title ILIKE ${pattern} OR content ILIKE ${pattern}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);

  return ilikeResults;
}
