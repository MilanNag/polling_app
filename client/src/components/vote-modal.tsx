import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PollWithOptionsAndVotes } from "@shared/schema";
import { useUser } from "@/context/user-context";
import { LoginModal } from "@/components/login-modal";

interface VoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: PollWithOptionsAndVotes;
}

export function VoteModal({ open, onOpenChange, poll }: VoteModalProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/votes", data);
      if (!response.ok) {
        // Get plain text error message
        const errorText = await response.text();
        throw new Error(errorText || "Failed to record your vote");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your vote has been recorded",
      });
      // Invalidate both active polls and the specific poll
      queryClient.invalidateQueries({ queryKey: ["/api/polls/active"] });
      queryClient.invalidateQueries({ queryKey: [`/api/polls/${poll.id}`] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Could not vote",
        description: error.message || "Failed to record your vote",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    if (selectedOption === null) {
      toast({
        title: "Error",
        description: "Please select an option",
        variant: "destructive",
      });
      return;
    }

    const voteData = {
      pollId: poll.id,
      optionId: selectedOption,
      userId: user.userId,
    };

    voteMutation.mutate(voteData);
  };

  const hasAlreadyVoted = !!poll.userVote;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 rounded-t-lg -mt-4"></div>
          <DialogHeader className="relative z-10 pb-4">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {poll.question}
            </DialogTitle>
            {poll.description && (
              <DialogDescription className="mt-2">{poll.description}</DialogDescription>
            )}
          </DialogHeader>
          
          {hasAlreadyVoted ? (
            <div className="relative z-10 py-6 flex flex-col items-center justify-center text-center">
              <div className="bg-violet-100 text-violet-800 p-6 rounded-lg mb-4 w-full">
                <h3 className="font-semibold text-lg mb-3">You have already voted</h3>
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-violet-200 text-violet-800 rounded-full h-16 w-16 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                </div>
                <p className="text-md">
                  You voted for: <span className="font-medium">{poll.userVote?.text}</span>
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 w-full">
                <p className="text-sm text-slate-500 mb-2">Current results:</p>
                {poll.optionsWithVotes.map(option => (
                  <div key={option.id} className="mb-2 last:mb-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{option.text}</span>
                      <span className="font-medium">{option.votes} votes ({option.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${option.id === poll.userVote?.optionId ? 'bg-violet-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${option.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form id="vote-form" role="form" onSubmit={handleSubmit} className="relative z-10">
              <RadioGroup value={selectedOption?.toString()} onValueChange={(value) => setSelectedOption(Number(value))}>
                <div className="space-y-4 mt-2">
                  {poll.options.map((option) => (
                    <div key={option.id} className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <RadioGroupItem 
                        id={`option-${option.id}`} 
                        value={option.id.toString()} 
                        className="text-violet-600 border-slate-300 focus:ring-violet-500"
                      />
                      <Label htmlFor={`option-${option.id}`} className="ml-3 font-medium cursor-pointer">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </form>
          )}
          <DialogFooter className="gap-2 sm:gap-0 mt-6 pt-4 border-t border-slate-200">
            {hasAlreadyVoted ? (
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition-all rounded-lg"
                size="lg"
              >
                <span className="font-medium">Close</span>
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-slate-300 hover:bg-slate-50 text-slate-700 transition-all rounded-lg"
                  size="lg"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  form="vote-form"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition-all rounded-lg"
                  disabled={voteMutation.isPending || selectedOption === null}
                  size="lg"
                >
                  {voteMutation.isPending ? (
                    <><span className="mr-2 h-5 w-5 animate-spin inline-block border-2 border-current border-t-transparent rounded-full"></span>Submitting...</>
                  ) : (
                    <span className="font-medium">Submit Vote</span>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />
    </>
  );
}
