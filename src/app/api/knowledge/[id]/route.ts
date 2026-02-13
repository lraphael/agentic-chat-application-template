import { NextResponse } from "next/server";

import { handleApiError } from "@/core/api/errors";
import { getLogger } from "@/core/logging";
import {
  deleteEntry,
  getEntry,
  UpdateKnowledgeEntrySchema,
  updateEntry,
} from "@/features/knowledge";

const logger = getLogger("api.knowledge.detail");

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/knowledge/[id]
 * Get a single knowledge entry.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const entry = await getEntry(id);
    return NextResponse.json(entry);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/knowledge/[id]
 * Update a knowledge entry.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = UpdateKnowledgeEntrySchema.parse(body);

    logger.info({ entryId: id }, "knowledge.update_started");

    const entry = await updateEntry(id, data);

    logger.info({ entryId: id }, "knowledge.update_completed");

    return NextResponse.json(entry);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/knowledge/[id]
 * Delete a knowledge entry.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    logger.info({ entryId: id }, "knowledge.delete_started");

    await deleteEntry(id);

    logger.info({ entryId: id }, "knowledge.delete_completed");

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
