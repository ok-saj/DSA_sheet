import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { FileText, Save } from 'lucide-react';

interface NotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  problemKey: string;
  problemTitle: string;
  initialNotes: string;
}

export const NotesDialog: React.FC<NotesDialogProps> = ({
  isOpen,
  onClose,
  problemKey,
  problemTitle,
  initialNotes,
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const updateNotes = useMutation(api.progress.updateNotes);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes, isOpen]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    
    // CHANGED: Show success toast immediately
    toast({
      title: "Notes Saved! 📝",
      description: "Your notes have been saved successfully.",
    });
    
    onClose();
    
    try {
      await updateNotes({
        userId: user._id,
        problemKey,
        notes: notes.trim(),
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Notes for: {problemTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Your Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add your notes, approach, key insights, or anything you want to remember about this problem..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[200px] resize-none"
              disabled={isLoading}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            Use this space to jot down your approach, key insights, edge cases, or anything that will help you when revisiting this problem.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isLoading ? "Saving..." : "Save Notes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};