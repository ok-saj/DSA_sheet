import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink, Play, FileText, X } from 'lucide-react';
import { dsaData } from '@/data/dsaData';
import { useToast } from '@/hooks/use-toast';

interface RevisionViewProps {
  // CHANGED: Added callback to update revision state in parent
  onRevisionToggle: (problemKey: string, marked: boolean) => void;
}

export const RevisionView = ({ onRevisionToggle }: RevisionViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const toggleRevision = useMutation(api.progress.toggleRevision);
  const revisionProblems = useQuery(
    api.progress.getRevisionProblems,
    user ? { userId: user._id } : "skip"
  );

  // CHANGED: Added function to handle removing problems from revision
  const handleRemoveFromRevision = async (categoryName: string, problemId: number, problemTitle: string) => {
    if (!user) return;
    
    const problemKey = `${categoryName}-${problemId}`;
    
    // Update UI state immediately to prevent blinking
    onRevisionToggle(problemKey, false);
    
    // Show toast immediately
    toast({
      title: "Removed from Revision",
      description: `"${problemTitle}" removed from your revision list`,
    });
    
    try {
      await toggleRevision({
        userId: user._id,
        problemKey,
        markedForRevision: false,
      });
    } catch (error) {
      console.error('Error removing from revision:', error);
      // Revert UI state on error
      onRevisionToggle(problemKey, true);
      toast({
        title: "Error",
        description: "Failed to remove from revision",
        variant: "destructive",
      });
    }
  };
  // CHANGED: Show loading state while data is being fetched
  if (revisionProblems === undefined) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4 py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading revision problems...</p>
        </div>
      </div>
    );
  }

  // CHANGED: Improved empty state message
  if (!revisionProblems || revisionProblems.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4 py-12">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold text-foreground">No Problems Marked for Revision</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Mark problems for revision while solving them to create your personalized study list. 
            Use the bookmark button next to any problem to add it here.
          </p>
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              💡 Tip: Problems marked for revision will appear here for easy access during your study sessions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Group problems by category
  const problemsByCategory = revisionProblems.reduce((acc, revisionProblem) => {
    const [categoryName, problemIdStr] = revisionProblem.problemKey.split('-');
    const problemId = parseInt(problemIdStr);
    
    // Find the actual problem data
    const category = dsaData.find(cat => cat.name === categoryName);
    const problem = category?.problems.find(p => p.id === problemId);
    
    if (problem) {
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push({
        ...problem,
        completed: revisionProblem.completed,
        notes: revisionProblem.notes,
      });
    }
    
    return acc;
  }, {} as Record<string, any[]>);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-success/10 text-success border-success/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'hard': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          Revision Problems
        </h2>
        <p className="text-muted-foreground">
          Problems you've marked for revision ({revisionProblems.length} total)
        </p>
      </div>

      {/* Problems by Category */}
      <div className="space-y-6">
        {Object.entries(problemsByCategory).map(([categoryName, problems]) => (
          <Card key={categoryName} className="border-border/50 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center justify-between">
                <span>{categoryName}</span>
                <Badge variant="secondary">{problems.length} problems</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {problems.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-center space-x-4 p-4 rounded-lg border border-border/50 bg-card/30 hover:bg-card/50 transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-foreground">
                        {problem.question}
                      </h4>
                      <Badge variant="outline" className={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty}
                      </Badge>
                      {problem.completed && (
                        <Badge variant="default" className="bg-success/10 text-success border-success/20">
                          Completed
                        </Badge>
                      )}
                    </div>
                    
                    {problem.companies && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Companies:</strong> {problem.companies}
                      </p>
                    )}
                    
                    {problem.notes && (
                      <div className="mt-2 p-2 bg-muted/30 rounded border-l-2 border-primary/30">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <FileText className="w-3 h-3" />
                          Your Notes:
                        </div>
                        <p className="text-sm text-foreground">{problem.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* CHANGED: Added remove from revision button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromRevision(categoryName, problem.id, problem.question)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                      title="Remove from Revision"
                    >
                      <X className="w-4 h-4" />
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
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};