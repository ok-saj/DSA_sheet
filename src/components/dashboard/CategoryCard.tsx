import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Play, Check, Clock, BookmarkPlus, BookmarkMinus, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { DSACategory, DSAProblem } from "@/data/dsaData";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NotesDialog } from "./NotesDialog";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface CategoryCardProps {
  category: DSACategory;
  onProblemToggle: (categoryName: string, problemId: number) => void;
  revisionMap: Record<string, boolean>;
  notesMap: Record<string, string>;
  // CHANGED: Added callback to update revision state immediately in parent
  onRevisionToggle: (problemKey: string, marked: boolean) => void;
  // CHANGED: Added callback to update notes state immediately
  onNotesUpdate: (problemKey: string, notes: string) => void;
}

export const CategoryCard = ({ category, onProblemToggle, revisionMap, notesMap, onRevisionToggle, onNotesUpdate }: CategoryCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notesDialog, setNotesDialog] = useState<{
    isOpen: boolean;
    problemKey: string;
    problemTitle: string;
    initialNotes: string;
  }>({
    isOpen: false,
    problemKey: '',
    problemTitle: '',
    initialNotes: '',
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const toggleRevision = useMutation(api.progress.toggleRevision);
  
  const completedCount = category.problems.filter(p => p.completed).length;
  const totalCount = category.problems.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleRevisionToggle = async (categoryName: string, problemId: number) => {
    if (!user) return;
    
    const problemKey = `${categoryName}-${problemId}`;
    const currentlyMarked = revisionMap[problemKey] || false;
    const newMarkedState = !currentlyMarked;
    
    // CHANGED: Update UI state immediately to prevent blinking
    onRevisionToggle(problemKey, newMarkedState);
    
    // CHANGED: Show toast immediately with new state
    toast({
      title: newMarkedState ? "Marked for Revision! 📚" : "Removed from Revision",
      description: newMarkedState 
        ? "Problem added to your revision list"
        : "Problem removed from your revision list",
    });
    
    try {
      await toggleRevision({
        userId: user._id,
        problemKey,
        markedForRevision: newMarkedState,
      });
    } catch (error) {
      console.error('Error toggling revision:', error);
      // CHANGED: Revert UI state on error
      onRevisionToggle(problemKey, currentlyMarked);
      toast({
        title: "Error",
        description: "Failed to update revision status",
        variant: "destructive",
      });
    }
  };

  const handleNotesClick = (categoryName: string, problemId: number, problemTitle: string) => {
    const problemKey = `${categoryName}-${problemId}`;
    const currentNotes = notesMap[problemKey] || '';
    
    setNotesDialog({
      isOpen: true,
      problemKey,
      problemTitle,
      initialNotes: currentNotes,
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-success/10 text-success border-success/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'hard': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const ProblemRow = ({ problem }: { problem: DSAProblem }) => (
    <>
    <div className="group flex items-center space-x-4 p-4 rounded-lg border border-border/50 bg-card/30 hover:bg-card/50 transition-all duration-200 animate-fade-in">
      <Checkbox
        checked={problem.completed}
        onCheckedChange={() => onProblemToggle(category.name, problem.id)}
        className="data-[state=checked]:bg-success data-[state=checked]:border-success"
      />
      
      {/* Problem Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3 mb-2">
          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
            {problem.question}
          </h4>
          <Badge variant="outline" className={getDifficultyColor(problem.difficulty)}>
            {problem.difficulty}
          </Badge>
          {revisionMap[`${category.name}-${problem.id}`] && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Revision
            </Badge>
          )}
          {notesMap[`${category.name}-${problem.id}`] && (
            <FileText className="w-4 h-4 text-primary" />
          )}
        </div>
        
        {problem.companies && (
          <p className="text-sm text-muted-foreground mb-1">
            <strong>Companies:</strong> {problem.companies}
          </p>
        )}
        
        {problem.prerequisites && (
          <p className="text-sm text-muted-foreground">
            <strong>Prerequisites:</strong> {problem.prerequisites}
          </p>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Notes Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNotesClick(category.name, problem.id, problem.question)}
          className="hover:bg-info/10 hover:text-info"
          title="Add/Edit Notes"
        >
          <FileText className="w-4 h-4" />
        </Button>
        
        {/* Revision Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRevisionToggle(category.name, problem.id)}
          className={`hover:bg-primary/10 hover:text-primary ${
            revisionMap[`${category.name}-${problem.id}`] ? 'text-primary bg-primary/10' : ''
          }`}
          title={revisionMap[`${category.name}-${problem.id}`] ? "Remove from Revision" : "Mark for Revision"}
        >
          {revisionMap[`${category.name}-${problem.id}`] ? (
            <BookmarkMinus className="w-4 h-4" />
          ) : (
            <BookmarkPlus className="w-4 h-4" />
          )}
        </Button>
        
        {problem.solutionLink && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(problem.solutionLink, '_blank')}
            className="hover:bg-primary/10 hover:text-primary"
          >
            <Play className="w-4 h-4 mr-1" />
            Solution
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(problem.link, '_blank')}
          className="hover:bg-accent/10 hover:text-accent"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Problem
        </Button>
      </div>
    </div>
    
    {/* Notes Dialog */}
    <NotesDialog
      isOpen={notesDialog.isOpen}
      onClose={() => setNotesDialog(prev => ({ ...prev, isOpen: false }))}
      problemKey={notesDialog.problemKey}
      problemTitle={notesDialog.problemTitle}
      initialNotes={notesDialog.initialNotes}
     onNotesUpdate={onNotesUpdate}
    />
    </>
  );

  return (
    <Card className="w-full animate-scale-in border-border/50 bg-card/30 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-foreground">{category.name}</h3>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {completedCount}/{totalCount}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-primary">{Math.round(completionPercentage)}%</span>
                  </div>
                  <Progress 
                    value={completionPercentage} 
                    className="h-2 bg-muted"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  {completedCount > 0 && (
                    <Check className="w-4 h-4 text-success" />
                  )}
                  {completedCount < totalCount && (
                    <Clock className="w-4 h-4 text-warning" />
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {category.problems.map((problem, index) => (
                <div
                  key={problem.id}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ProblemRow problem={problem} />
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};