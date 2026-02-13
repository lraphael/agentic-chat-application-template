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
}

export function ContextSources({ sources }: ContextSourcesProps) {
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
            <div key={source.id} className="flex items-baseline gap-2 text-xs">
              <span className="text-primary font-mono font-medium">[{i + 1}]</span>
              <span className="text-foreground font-medium">{source.title}</span>
              <span className="text-muted-foreground">by {source.contributor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
