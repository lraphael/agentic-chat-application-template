"use client";

import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MarkdownContent } from "../chat/markdown-content";

interface KnowledgeEntryCardProps {
  id: string;
  title: string;
  content: string;
  tags: string[];
  contributor: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function KnowledgeEntryCard({
  id,
  title,
  content,
  tags,
  contributor,
  onEdit,
  onDelete,
}: KnowledgeEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = content.length > 120;
  const preview = isLong ? `${content.substring(0, 120)}...` : content;

  return (
    <div className="group border-border/50 hover:border-border rounded-lg border p-3 transition-colors">
      <div className="mb-1 flex items-start justify-between gap-2">
        <button
          type="button"
          className="flex items-center gap-1 text-left"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isLong &&
            (isExpanded ? (
              <ChevronDown className="text-muted-foreground size-3.5 shrink-0" />
            ) : (
              <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
            ))}
          <h4 className="text-sm font-medium leading-tight">{title}</h4>
        </button>
        <div className="-mr-1 -mt-1 flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary size-7"
            onClick={() => onEdit(id)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-7"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {isExpanded ? (
        <div className="bg-muted/30 mb-2 rounded-md p-2">
          <MarkdownContent content={content} />
        </div>
      ) : (
        <p className="text-muted-foreground mb-2 text-xs leading-relaxed">{preview}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn("text-[10px]", isExpanded ? "text-foreground/70" : "text-muted-foreground")}
        >
          by {contributor}
        </span>
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px]">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
