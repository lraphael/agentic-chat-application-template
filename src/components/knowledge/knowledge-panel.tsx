"use client";

import { BookOpen, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { KnowledgeEntryCard } from "./knowledge-entry-card";
import type { KnowledgeFormValues } from "./knowledge-form";
import { KnowledgeForm } from "./knowledge-form";

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  contributor: string;
}

interface KnowledgePanelProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  focusEntryId?: string | null;
  onFocusEntryIdChange?: (id: string | null) => void;
}

export function KnowledgePanel({
  open,
  onOpenChange,
  focusEntryId,
  onFocusEntryIdChange,
}: KnowledgePanelProps) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchEntries = useCallback(async (query?: string) => {
    setIsLoading(true);
    try {
      const url = query ? `/api/knowledge?q=${encodeURIComponent(query)}` : "/api/knowledge";
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as { entries: KnowledgeEntry[] };
        setEntries(data.entries);
      }
    } catch {
      toast.error("Failed to load knowledge base");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (value.trim()) {
        void fetchEntries(value.trim());
      } else {
        void fetchEntries();
      }
    },
    [fetchEntries],
  );

  const handleCreate = useCallback(
    async (entry: { title: string; content: string; tags: string[]; contributor: string }) => {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) {
        throw new Error("Failed to create");
      }
      toast.success("Knowledge added!");
      await fetchEntries();
    },
    [fetchEntries],
  );

  const handleEdit = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        setEditingEntry(entry);
        setIsFormOpen(true);
      }
    },
    [entries],
  );

  const handleUpdate = useCallback(
    async (values: KnowledgeFormValues) => {
      if (!editingEntry) {
        return;
      }
      const res = await fetch(`/api/knowledge/${editingEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        throw new Error("Failed to update");
      }
      const updated = (await res.json()) as KnowledgeEntry;
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success("Entry updated!");
    },
    [editingEntry],
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Entry removed");
    } catch {
      toast.error("Failed to delete entry");
    }
  }, []);

  return (
    <>
      <Sheet {...(open !== undefined ? { open } : {})} {...(onOpenChange ? { onOpenChange } : {})}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-primary/30 hover:bg-primary/10 hover:text-primary"
          >
            <BookOpen className="size-4" />
            Knowledge Base
            {entries.length > 0 && (
              <span className="bg-primary/10 text-primary ml-auto rounded-full px-2 py-0.5 text-xs">
                {entries.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-96 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="flex items-center gap-2">
              <BookOpen className="size-5" />
              Shared Knowledge Base
            </SheetTitle>
            <SheetDescription>Community-contributed knowledge used by the AI</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-3 p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  placeholder="Search knowledge..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                size="icon"
                onClick={() => {
                  setEditingEntry(null);
                  setIsFormOpen(true);
                }}
                aria-label="Add knowledge"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-180px)] px-4 pb-4">
            {isLoading ? (
              <div className="text-muted-foreground py-8 text-center text-sm">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center gap-3 py-12 text-center">
                <BookOpen className="size-10 opacity-30" />
                <div>
                  <p className="font-medium">No knowledge yet</p>
                  <p className="text-xs">Be the first to contribute!</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(true)}
                  className="mt-2"
                >
                  <Plus className="mr-1 size-3.5" />
                  Add Knowledge
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <KnowledgeEntryCard
                    key={entry.id}
                    id={entry.id}
                    title={entry.title}
                    content={entry.content}
                    tags={entry.tags}
                    contributor={entry.contributor}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    {...(focusEntryId === entry.id ? { isFocused: true } : {})}
                    {...(onFocusEntryIdChange
                      ? { onFocusHandled: () => onFocusEntryIdChange(null) }
                      : {})}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <KnowledgeForm
        key={editingEntry?.id ?? "new"}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingEntry(null);
          }
        }}
        onSubmit={editingEntry ? handleUpdate : handleCreate}
        {...(editingEntry ? { initialValues: editingEntry } : {})}
      />
    </>
  );
}
