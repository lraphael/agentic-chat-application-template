import { getLogger } from "@/core/logging";

import { KnowledgeEntryNotFoundError } from "./errors";
import type { KnowledgeEntry } from "./models";
import * as repository from "./repository";
import type { CreateKnowledgeEntryInput, UpdateKnowledgeEntryInput } from "./schemas";

const logger = getLogger("knowledge.service");

export async function listEntries(): Promise<KnowledgeEntry[]> {
  logger.info("knowledge.list_started");
  const entries = await repository.findAll();
  logger.info({ count: entries.length }, "knowledge.list_completed");
  return entries;
}

export async function getEntry(id: string): Promise<KnowledgeEntry> {
  logger.info({ entryId: id }, "knowledge.get_started");

  const entry = await repository.findById(id);
  if (!entry) {
    logger.warn({ entryId: id }, "knowledge.get_failed");
    throw new KnowledgeEntryNotFoundError(id);
  }

  logger.info({ entryId: id }, "knowledge.get_completed");
  return entry;
}

export async function createEntry(input: CreateKnowledgeEntryInput): Promise<KnowledgeEntry> {
  logger.info({ title: input.title, contributor: input.contributor }, "knowledge.create_started");

  const entry = await repository.create({
    title: input.title,
    content: input.content,
    tags: input.tags,
    contributor: input.contributor,
  });

  logger.info({ entryId: entry.id }, "knowledge.create_completed");
  return entry;
}

export async function updateEntry(
  id: string,
  input: UpdateKnowledgeEntryInput,
): Promise<KnowledgeEntry> {
  logger.info({ entryId: id }, "knowledge.update_started");

  // Build update data, filtering out undefined to satisfy exactOptionalPropertyTypes
  const data = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.content !== undefined ? { content: input.content } : {}),
    ...(input.tags !== undefined ? { tags: input.tags } : {}),
    ...(input.contributor !== undefined ? { contributor: input.contributor } : {}),
  };

  const entry = await repository.update(id, data);
  if (!entry) {
    logger.warn({ entryId: id }, "knowledge.update_failed");
    throw new KnowledgeEntryNotFoundError(id);
  }

  logger.info({ entryId: id }, "knowledge.update_completed");
  return entry;
}

export async function deleteEntry(id: string): Promise<void> {
  logger.info({ entryId: id }, "knowledge.delete_started");

  const deleted = await repository.deleteById(id);
  if (!deleted) {
    logger.warn({ entryId: id }, "knowledge.delete_failed");
    throw new KnowledgeEntryNotFoundError(id);
  }

  logger.info({ entryId: id }, "knowledge.delete_completed");
}

export async function searchEntries(query: string, limit = 5): Promise<KnowledgeEntry[]> {
  logger.info({ query, limit }, "knowledge.search_started");

  const results = await repository.fullTextSearch(query, limit);

  logger.info({ query, resultCount: results.length }, "knowledge.search_completed");
  return results;
}

/**
 * Build a knowledge context string for injection into the LLM system prompt.
 * Returns empty string if no relevant entries are found.
 */
export async function buildKnowledgeContext(userMessage: string): Promise<{
  context: string;
  sources: Array<{ id: string; title: string; contributor: string }>;
}> {
  const results = await searchEntries(userMessage, 5);

  if (results.length === 0) {
    return { context: "", sources: [] };
  }

  const sources = results.map((r) => ({
    id: r.id,
    title: r.title,
    contributor: r.contributor,
  }));

  const context = [
    "## Relevant Knowledge Base Entries",
    "",
    ...results.map((r, i) => `### [${i + 1}] ${r.title} (by ${r.contributor})\n${r.content}`),
    "",
    "Use the above knowledge to inform your answer. Cite sources by number [1], [2] etc. when using them.",
  ].join("\n");

  return { context, sources };
}
