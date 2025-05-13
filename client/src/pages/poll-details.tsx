import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { PollWithOptionsAndVotes } from "@shared/schema";
import { useUser } from "@/context/user-context";
import { VoteModal } from "@/components/vote-modal";
import { LoginModal } from "@/components/login-modal";
import { SharePollCard } from "@/components/share-poll-card";

export default function PollDetails() {
  const params = useParams();
  const { id, shareCode } = params;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  
  // Determine if we're using a share code or a regular ID
  const isShareCode = !!shareCode;

  // Fetch poll details - either by ID or by share code
  const { data: poll, isLoading, error } = useQuery<PollWithOptionsAndVotes>({
    queryKey: isShareCode 
      ? [`/api/polls/share/${shareCode}`, user?.userId] 
      : [`/api/polls/${id}`, user?.userId],
    enabled: !!(id || shareCode),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load poll details. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Handle vote button click
  const handleVote = () => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    setVoteModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Poll Not Found</h1>
        <p className="mb-6 text-gray-600">The poll you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-semibold">{poll.question}</CardTitle>
            <Badge variant="secondary" className={poll.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}>
              {poll.isActive ? "Active" : "Closed"}
            </Badge>
          </div>
          <CardDescription className="mt-2">
            Created {format(new Date(poll.createdAt), "MMM d, yyyy")} · 
            {poll.isActive 
              ? ` Ends ${format(new Date(poll.endDate), "MMM d, yyyy")}`
              : ` Ended ${format(new Date(poll.endDate), "MMM d, yyyy")}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Results ({poll.totalVotes} total votes)</h4>
            
            <div className="space-y-4">
              {poll.optionsWithVotes.map((option) => (
                <div key={option.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{option.text}</span>
                    <span className="text-sm font-medium text-gray-900">{option.percentage}% ({option.votes} votes)</span>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                    <div 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                      style={{ width: `${option.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            {poll.userVote && (
              <div className="mt-6 bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-700">Your Vote</h4>
                <p className="mt-1 text-sm text-gray-500">
                  You voted for <span className="font-medium">{poll.userVote.text}</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Polls
          </Button>
          {poll.isActive && (
            <Button 
              className="bg-secondary hover:bg-violet-600 text-white" 
              onClick={handleVote}
              disabled={!poll.isActive}
            >
              {poll.userVote ? "Vote Again" : "Vote Now"}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Share Poll Card */}
      <SharePollCard poll={poll} />

      {/* Vote Modal */}
      <VoteModal
        open={voteModalOpen}
        onOpenChange={setVoteModalOpen}
        poll={poll}
      />

      {/* Login Modal */}
      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />
    </div>
  );
}
