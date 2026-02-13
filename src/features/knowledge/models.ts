import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { knowledgeEntries } from "@/core/database/schema";

export { knowledgeEntries };

export type KnowledgeEntry = InferSelectModel<typeof knowledgeEntries>;
export type NewKnowledgeEntry = InferInsertModel<typeof knowledgeEntries>;
