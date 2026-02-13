// Types

// Errors
export { KnowledgeEntryNotFoundError } from "./errors";
export type { KnowledgeEntry, NewKnowledgeEntry } from "./models";
export type {
  CreateKnowledgeEntryInput,
  SearchKnowledgeInput,
  UpdateKnowledgeEntryInput,
} from "./schemas";
// Schemas
export {
  CreateKnowledgeEntrySchema,
  SearchKnowledgeSchema,
  UpdateKnowledgeEntrySchema,
} from "./schemas";

// Service functions (public API)
export {
  buildKnowledgeContext,
  createEntry,
  deleteEntry,
  getEntry,
  listEntries,
  searchEntries,
  updateEntry,
} from "./service";
