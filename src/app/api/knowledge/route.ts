import { type NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import {
  CreateKnowledgeEntrySchema,
  createEntry,
  listEntries,
  SearchKnowledgeSchema,
  searchEntries,
} from "@/features/knowledge";

const logger = getLogger("api.knowledge");

/**
 * GET /api/knowledge
 * List all entries, or search with ?q=query&limit=5
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (q) {
      const { q: query, limit } = SearchKnowledgeSchema.parse({
        q,
        limit: searchParams.get("limit") ?? undefined,
      });
      const results = await searchEntries(query, limit);
      return NextResponse.json({ entries: results });
    }

    const entries = await listEntries();
    return NextResponse.json({ entries });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/knowledge
 * Create a new knowledge entry.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = CreateKnowledgeEntrySchema.parse(body);

    logger.info({ title: input.title, contributor: input.contributor }, "knowledge.create_started");

    const entry = await createEntry(input);

    logger.info({ entryId: entry.id }, "knowledge.create_completed");

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
