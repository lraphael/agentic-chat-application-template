"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface KnowledgeFormValues {
  title: string;
  content: string;
  tags: string[];
  contributor: string;
}

interface KnowledgeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (entry: KnowledgeFormValues) => Promise<void>;
  initialValues?: KnowledgeFormValues;
  defaultContributor?: string;
}

export function KnowledgeForm({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  defaultContributor = "",
}: KnowledgeFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [tagsInput, setTagsInput] = useState(initialValues?.tags.join(", ") ?? "");
  const [contributor, setContributor] = useState(initialValues?.contributor ?? defaultContributor);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!initialValues;

  const resetForm = () => {
    setTitle(initialValues?.title ?? "");
    setContent(initialValues?.content ?? "");
    setTagsInput(initialValues?.tags.join(", ") ?? "");
    setContributor(initialValues?.contributor ?? defaultContributor);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !contributor.trim()) {
      toast.error("Title, content, and your name are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        tags,
        contributor: contributor.trim(),
      });
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Failed to add knowledge entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Knowledge" : "Add Knowledge"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this knowledge entry."
              : "Share knowledge with the community. The AI will use it to answer questions."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kb-title">Title</Label>
            <Input
              id="kb-title"
              placeholder="e.g. How Vertical Slice Architecture works"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kb-content">Content</Label>
            <Textarea
              id="kb-content"
              placeholder="Explain the concept, paste a snippet, or share a link..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kb-tags">Tags (comma-separated)</Label>
            <Input
              id="kb-tags"
              placeholder="e.g. architecture, typescript, patterns"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kb-contributor">Your Name</Label>
            <Input
              id="kb-contributor"
              placeholder="e.g. Cole"
              value={contributor}
              onChange={(e) => setContributor(e.target.value)}
              maxLength={100}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add to Knowledge Base"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
