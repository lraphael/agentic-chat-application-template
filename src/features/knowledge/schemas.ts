import { z } from "zod/v4";

export const CreateKnowledgeEntrySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  tags: z.array(z.string().min(1).max(50)).max(10).default([]),
  contributor: z.string().min(1).max(100),
});

export const SearchKnowledgeSchema = z.object({
  q: z.string().min(1).max(500),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export const UpdateKnowledgeEntrySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  contributor: z.string().min(1).max(100).optional(),
});

export type CreateKnowledgeEntryInput = z.infer<typeof CreateKnowledgeEntrySchema>;
export type UpdateKnowledgeEntryInput = z.infer<typeof UpdateKnowledgeEntrySchema>;
export type SearchKnowledgeInput = z.infer<typeof SearchKnowledgeSchema>;
