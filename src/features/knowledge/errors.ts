import type { HttpStatusCode } from "@/core/api/errors";

export type KnowledgeErrorCode = "KNOWLEDGE_ENTRY_NOT_FOUND";

export class KnowledgeError extends Error {
  readonly code: KnowledgeErrorCode;
  readonly statusCode: HttpStatusCode;

  constructor(message: string, code: KnowledgeErrorCode, statusCode: HttpStatusCode) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class KnowledgeEntryNotFoundError extends KnowledgeError {
  constructor(id: string) {
    super(`Knowledge entry not found: ${id}`, "KNOWLEDGE_ENTRY_NOT_FOUND", 404);
  }
}
