"use client";

import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface Source {
  id: string;
  title: string;
  contributor: string;
}

interface ContextSourcesProps {
  sources: Source[];
  onOpenKnowledge?: (entryId: string) => void;
}

export function ContextSources({ sources, onOpenKnowledge }: ContextSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-1">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors"
      >
        <BookOpen className="size-3" />
        <span>
          {sources.length} knowledge {sources.length === 1 ? "source" : "sources"} found
        </span>
        {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="border-border/50 bg-muted/30 mt-1 space-y-1 rounded-lg border p-2">
          {sources.map((source, i) => (
            <button
              key={source.id}
              type="button"
              onClick={() => onOpenKnowledge?.(source.id)}
              className="hover:bg-muted flex w-full items-baseline gap-2 rounded px-1 py-0.5 text-left text-xs transition-colors"
            >
              <span className="text-primary font-mono font-medium">[{i + 1}]</span>
              <span className="text-foreground font-medium">{source.title}</span>
              <span className="text-muted-foreground">by {source.contributor}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
