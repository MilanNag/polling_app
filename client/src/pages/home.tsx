import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PollCard } from "@/components/poll-card";
import { CreatePollModal } from "@/components/create-poll-modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, PanelLeft, BarChart, CheckCircle, Clock, Sparkles, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PollWithOptionsAndVotes } from "@shared/schema";
import { VoteModal } from "@/components/vote-modal";
import { PollDetailModal } from "@/components/poll-detail-modal";
import { useUser } from "@/context/user-context";
import { LoginModal } from "@/components/login-modal";
import { BadgeShowcase } from "@/components/badge-showcase";
import ErrorBoundary from "@/components/error-boundary";
import { useWebSocket, WebSocketMessageType } from "@/hooks/use-websocket";

export default function Home() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(!user);
  const [selectedPoll, setSelectedPoll] = useState<PollWithOptionsAndVotes | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  
  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket({
    onMessage: (message) => {
      // When a poll is updated or a new vote is recorded
      if ((message.type === WebSocketMessageType.POLL_UPDATE || 
           message.type === WebSocketMessageType.NEW_VOTE) && 
          message.pollId) {
        
        // Check if this is a poll removal notification
        if (message.type === WebSocketMessageType.POLL_UPDATE && 
            message.data?.isRemoved === true) {
          // Show toast notification about poll removal
          toast({
            title: "Poll removed",
            description: message.data?.message || "A poll has been removed by its creator",
            variant: "default"
          });
          
          // If currently viewing the deleted poll, close the detail modal
          if (selectedPoll && selectedPoll.id === message.pollId) {
            setDetailModalOpen(false);
          }
        }
        
        // Invalidate the cache for that specific poll and for all polls
        queryClient.invalidateQueries({ queryKey: ["/api/polls/active"] });
        queryClient.invalidateQueries({ queryKey: ["/api/polls/closed"] });
        queryClient.invalidateQueries({ queryKey: [`/api/polls/${message.pollId}`] });
      }
    }
  });

  // Fetch active polls
  const { data: activePolls, isLoading: isLoadingActive } = useQuery<PollWithOptionsAndVotes[]>({
    queryKey: ["/api/polls/active"],
    refetchInterval: realtimeEnabled ? false : 30000, // Only use polling as fallback
  });

  // Fetch closed polls
  const { data: closedPolls, isLoading: isLoadingClosed } = useQuery<PollWithOptionsAndVotes[]>({
    queryKey: ["/api/polls/closed"],
  });
  
  // Toggle real-time updates
  const toggleRealtime = () => {
    setRealtimeEnabled(!realtimeEnabled);
    
    // Show toast notification
    toast({
      title: realtimeEnabled ? "Real-time updates disabled" : "Real-time updates enabled",
      description: realtimeEnabled 
        ? "Polls will now refresh every 30 seconds"
        : "Polls will update automatically as votes come in",
    });
  };

  // Handle vote button click
  const handleVote = (poll: PollWithOptionsAndVotes) => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }
    setSelectedPoll(poll);
    setVoteModalOpen(true);
  };

  // Handle view details button click
  const handleViewDetails = (poll: PollWithOptionsAndVotes) => {
    setSelectedPoll(poll);
    setDetailModalOpen(true);
  };
  
  // Handle poll deletion
  const handleDeletePoll = async (pollId: number) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/polls/${pollId}?userId=${user.userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({
          title: "Poll deleted",
          description: "The poll has been successfully deleted",
          variant: "default"
        });
        
        // Refresh polls lists
        queryClient.invalidateQueries({ queryKey: ["/api/polls/active"] });
        queryClient.invalidateQueries({ queryKey: ["/api/polls/closed"] });
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
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="mb-12 text-center max-w-4xl mx-auto">
        <div className="inline-block p-1 px-3 mb-6 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 text-sm font-medium text-violet-700">
          Welcome to PollWave
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-br from-violet-700 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
          Create & Share Interactive Polls
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Easily create engaging polls, collect votes in real-time, and visualize results with beautiful charts and graphs.
        </p>
      </div>
      
      {/* Badge Showcase */}
      <ErrorBoundary>
        <BadgeShowcase />
      </ErrorBoundary>
    
      {/* Tabs */}
      <Tabs defaultValue="active" className="mb-8" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <TabsList className="bg-white border border-gray-200 shadow-sm rounded-lg p-1.5 w-full md:w-auto flex-grow">
              <TabsTrigger
                value="active"
                className="px-5 py-2.5 text-sm font-medium flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded transition-all"
              >
                <CheckCircle className="h-4 w-4" />
                Active Polls
              </TabsTrigger>
              <TabsTrigger
                value="closed"
                className="px-5 py-2.5 text-sm font-medium flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded transition-all"
              >
                <Clock className="h-4 w-4" />
                Closed Polls
              </TabsTrigger>
            </TabsList>
            
            {activeTab === "active" && (
              <Button
                variant="outline"
                className={`border border-gray-200 shadow-sm px-4 flex items-center gap-2 h-11 ${
                  realtimeEnabled 
                    ? 'text-green-600 hover:text-green-700 hover:border-green-200' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={toggleRealtime}
              >
                <Wifi className={`h-4 w-4 ${realtimeEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">
                  {realtimeEnabled ? 'Real-time: On' : 'Real-time: Off'}
                </span>
                <span className={`ml-1.5 h-2 w-2 rounded-full ${isConnected && realtimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
              </Button>
            )}
          </div>
          
          <Button 
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition-all w-full sm:w-auto" 
            onClick={() => setCreateModalOpen(true)}
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Poll
          </Button>
        </div>

        {/* Active Polls */}
        <TabsContent value="active" className="mt-6">
          {isLoadingActive ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
                  <div className="h-1 bg-gray-200 w-full"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                    <div className="space-y-4">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-12 bg-gray-50 border-t border-gray-100"></div>
                </div>
              ))}
            </div>
          ) : activePolls && activePolls.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {activePolls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  onVote={() => handleVote(poll)}
                  onViewDetails={() => handleViewDetails(poll)}
                  onDelete={handleDeletePoll}
                  isActive={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6 bg-white rounded-xl shadow-sm border border-gray-100 bg-gradient-to-b from-white to-gray-50">
              <div className="mb-6 flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center p-5 shadow-inner">
                  <Sparkles className="h-10 w-10 text-violet-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">No active polls</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                Create your first poll to start collecting votes and insights from your audience. It only takes a minute!
              </p>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md px-6" 
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Poll
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Closed Polls */}
        <TabsContent value="closed" className="mt-6">
          {isLoadingClosed ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
                  <div className="h-1 bg-gray-200 w-full"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                    <div className="space-y-4">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="h-12 bg-gray-50 border-t border-gray-100"></div>
                </div>
              ))}
            </div>
          ) : closedPolls && closedPolls.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {closedPolls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  onVote={() => {}}
                  onViewDetails={() => handleViewDetails(poll)}
                  onDelete={handleDeletePoll}
                  isActive={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6 bg-white rounded-xl shadow-sm border border-gray-100 bg-gradient-to-b from-white to-gray-50">
              <div className="mb-6 flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-5 shadow-inner">
                  <BarChart className="h-10 w-10 text-gray-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No closed polls yet</h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                Polls will appear here once they've reached their end date, allowing you to review the final results and analyze the voting data.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Poll Modal */}
      <CreatePollModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {/* Vote Modal */}
      {selectedPoll && (
        <VoteModal
          open={voteModalOpen}
          onOpenChange={setVoteModalOpen}
          poll={selectedPoll}
        />
      )}

      {/* Poll Detail Modal */}
      {selectedPoll && (
        <PollDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          poll={selectedPoll}
          onVoteAgain={() => {
            setDetailModalOpen(false);
            setVoteModalOpen(true);
          }}
          onDelete={() => {
            // Refresh both active and closed polls
            queryClient.invalidateQueries({ queryKey: ["/api/polls/active"] });
            queryClient.invalidateQueries({ queryKey: ["/api/polls/closed"] });
          }}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />
    </div>
  );
}
