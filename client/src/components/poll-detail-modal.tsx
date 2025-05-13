import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { PollWithOptionsAndVotes } from "@shared/schema";
import { PollChart } from "@/components/poll-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ListChecks, Users, Trash2 } from "lucide-react";
import { useWebSocket, WebSocketMessageType } from "@/hooks/use-websocket";
import { useEffect, useState } from "react";
import { useUser } from "@/context/user-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PollDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: PollWithOptionsAndVotes;
  onVoteAgain: () => void;
  onDelete?: () => void;
}

export function PollDetailModal({ open, onOpenChange, poll: initialPoll, onVoteAgain, onDelete }: PollDetailModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [poll, setPoll] = useState<PollWithOptionsAndVotes>(initialPoll);
  const [voteAnimation, setVoteAnimation] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Connect to real-time updates
  const { isConnected, activeUsers, joinPoll, leavePoll } = useWebSocket({
    onMessage: (message) => {
      if (message.type === WebSocketMessageType.POLL_UPDATE && message.data && message.pollId === poll.id) {
        setPoll(message.data);
      }
      
      if (message.type === WebSocketMessageType.NEW_VOTE && message.pollId === poll.id) {
        // Show vote animation
        setVoteAnimation(message.data?.optionId || null);
        
        // Clear animation after 2 seconds
        setTimeout(() => {
          setVoteAnimation(null);
        }, 2000);
      }
    }
  });
  
  // Join poll room when modal opens
  useEffect(() => {
    let joinTimeout: ReturnType<typeof setTimeout> | null = null;
    
    if (open && user && poll) {
      // Small delay to ensure WebSocket connection is ready
      joinTimeout = setTimeout(() => {
        if (isConnected) {
          joinPoll(poll.id, user.userId);
        }
      }, 500);
      
      // Leave poll room when modal closes
      return () => {
        if (joinTimeout) {
          clearTimeout(joinTimeout);
        }
        if (isConnected) {
          leavePoll();
        }
      };
    }
    
    return () => {
      if (joinTimeout) {
        clearTimeout(joinTimeout);
      }
    };
  }, [open, poll?.id, user, joinPoll, leavePoll, isConnected]);
  
  // Update local poll state when prop changes
  useEffect(() => {
    setPoll(initialPoll);
  }, [initialPoll]);
  
  // Handle poll deletion
  const handleDeletePoll = async () => {
    if (!user || !poll || isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      const response = await apiRequest(
        'DELETE',
        `/api/polls/${poll.id}?userId=${user.userId}`
      );
      
      if (response.ok) {
        toast({
          title: "Poll deleted",
          description: "Your poll has been successfully deleted",
          variant: "default"
        });
        
        // Close the modal
        onOpenChange(false);
        
        // Trigger parent component refresh if callback exists
        if (onDelete) {
          onDelete();
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete poll",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the poll",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {poll.question}
            </DialogTitle>
            <Badge 
              variant={poll.isActive ? "outline" : "secondary"}
              className={poll.isActive 
                ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0" 
                : ""}
            >
              {poll.isActive ? "Active" : "Closed"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Created {format(new Date(poll.createdAt), "MMM d, yyyy")} · 
            {poll.isActive 
              ? ` Ends ${format(new Date(poll.endDate), "MMM d, yyyy")}`
              : ` Ended ${format(new Date(poll.endDate), "MMM d, yyyy")}`
            }
          </p>
        </DialogHeader>
        
        <div className="mt-4">
          <Tabs defaultValue="bars" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="bars" className="flex items-center">
                <ListChecks className="h-4 w-4 mr-2" />
                Bar View
              </TabsTrigger>
              <TabsTrigger value="chart" className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Chart View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="bars" className="mt-0">
              <div className="space-y-4">
                {poll.optionsWithVotes.map((option) => (
                  <div key={option.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 flex items-center">
                        {option.text}
                        {poll.userVote?.optionId === option.id && (
                          <Badge variant="outline" className="ml-2 text-xs border-violet-500 text-violet-600">
                            Your vote
                          </Badge>
                        )}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {option.percentage}% ({option.votes} votes)
                      </span>
                    </div>
                    <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-100">
                      <div 
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full transition-all duration-1000 ease-out
                          ${poll.userVote?.optionId === option.id 
                            ? 'bg-gradient-to-r from-violet-500 to-indigo-600' 
                            : 'bg-gradient-to-r from-indigo-500 to-blue-500'
                          }
                          ${voteAnimation === option.id ? 'animate-vote-flash animate-vote-pulse' : ''}
                        `}
                        style={{ width: `${option.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="chart" className="mt-0">
              <PollChart poll={poll} />
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 flex flex-col space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                <h4 className="text-sm font-medium text-gray-700">Total Votes</h4>
                <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  {poll.totalVotes}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Active Viewers
                </h4>
                <div className="flex items-center mt-1">
                  <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <p className="text-lg font-bold text-gray-800">
                    {activeUsers.count || 0}
                  </p>
                </div>
              </div>
            </div>
            
            {poll.userVote && (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                <h4 className="text-sm font-medium text-gray-700">Your Vote</h4>
                <p className="mt-1 text-sm font-medium text-gray-800">
                  You voted for <span className="font-semibold text-violet-700">{poll.userVote.text}</span>
                </p>
              </div>
            )}
            
            {/* Status indicator */}
            <div className={`text-center text-xs font-medium ${isConnected ? 'text-green-600' : 'text-orange-500'}`}>
              {isConnected ? 'Live: Results update in real-time' : 'Connecting to live updates...'}
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-3 sm:gap-2 mt-4 pt-4 border-t">
          <div className="flex items-center justify-between w-full">
            {onDelete && (
              <Button 
                variant="destructive" 
                onClick={handleDeletePoll}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white transition-all h-9 w-9 p-0"
                size="sm"
                aria-label="Delete poll"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting && <span className="sr-only">Deleting...</span>}
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-gray-300 hover:bg-gray-50 transition-all min-w-[80px]"
              >
                Close
              </Button>
              {poll.isActive && (
                <Button 
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition-all min-w-[100px]"
                  onClick={onVoteAgain}
                >
                  Vote Again
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
