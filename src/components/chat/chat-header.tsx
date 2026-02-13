"use client";

import { Menu, Trash2 } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  title: string | null;
  conversationId: string | null;
  onToggleSidebar: () => void;
  onDelete: (id: string) => void;
}

export function ChatHeader({ title, conversationId, onToggleSidebar, onDelete }: ChatHeaderProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </Button>
        <h1 className="truncate text-lg font-semibold">{title ?? "New Chat"}</h1>
      </div>
      <div className="flex items-center gap-1">
        {conversationId && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setIsDeleteOpen(true)}
            aria-label="Delete conversation"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
        <ThemeToggle />
      </div>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (conversationId) {
                  onDelete(conversationId);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
