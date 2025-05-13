import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, formatDistance } from "date-fns";
import { PollWithOptionsAndVotes } from "@shared/schema";
import { BarChart2, Calendar, ExternalLink, Vote, Trash2, Share2 } from "lucide-react";
import { useUser } from "@/context/user-context";
import { useToast } from "@/hooks/use-toast";

interface PollCardProps {
  poll: PollWithOptionsAndVotes;
  onVote: () => void;
  onViewDetails: () => void;
  onDelete?: (pollId: number) => void;
  isActive: boolean;
}

export function PollCard({ poll, onVote, onViewDetails, onDelete, isActive }: PollCardProps) {
  const { user } = useUser();
  const { toast } = useToast();
  
  // Format the created date as relative time
  const createdTimeAgo = formatDistance(new Date(poll.createdAt), new Date(), { addSuffix: true });
  
  // Get the top 3 options to display
  const topOptions = [...poll.optionsWithVotes]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 3);
    
  // Check if current user is the poll creator
  const isCreator = user && poll.createdBy === user.userId;
  
  // Handle share poll
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/share/${poll.shareCode}`;
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: poll.question,
        text: `Check out this poll: ${poll.question}`,
        url: shareUrl,
      }).catch((error) => {
        console.error('Error sharing:', error);
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied",
        description: "Share link has been copied to clipboard",
      });
    }
  };

  return (
    <Card className="poll-card hover:shadow-md transition-all overflow-hidden border-gray-200">
      <div className={`h-1 w-full ${isActive ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`}></div>
      <CardContent className="px-6 py-5">
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-bold bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">
            {poll.question}
          </h2>
          <Badge 
            variant={isActive ? "outline" : "secondary"}
            className={isActive 
              ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0" 
              : ""}
          >
            {isActive ? "Active" : "Closed"}
          </Badge>
        </div>
        
        <div className="flex items-center mt-2 gap-4">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
            {createdTimeAgo}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <BarChart2 className="h-3 w-3 mr-1 text-gray-400" />
            {poll.totalVotes} votes
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          {topOptions.map((option, index) => (
            <div key={option.id} className="relative">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  {option.text}
                  {poll.userVote?.optionId === option.id && (
                    <Badge variant="outline" className="ml-2 text-xs border-violet-500 text-violet-600">
                      Your vote
                    </Badge>
                  )}
                </span>
                <span className="text-sm font-medium text-gray-900">{option.percentage}%</span>
              </div>
              <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-gray-100">
                <div 
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full ${
                    index === 0 
                      ? 'bg-gradient-to-r from-violet-500 to-indigo-600' 
                      : index === 1 
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-500'
                        : 'bg-gradient-to-r from-blue-400 to-cyan-500'
                  }`}
                  style={{ width: `${option.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-end">
                <span className="text-xs text-gray-500 mt-1">{option.votes} vote{option.votes !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onViewDetails}
            className="text-gray-600 h-9 min-w-24 justify-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Details
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleShare}
            className="text-indigo-500 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 h-9 w-9 p-0 justify-center"
            aria-label="Share poll"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDelete(poll.id)}
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 h-9 w-9 p-0 justify-center"
              aria-label="Delete poll"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {isActive && (
          <div className="ml-4">
            <Button 
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white h-9 min-w-24 justify-center"
              onClick={onVote}
            >
              <Vote className="h-4 w-4 mr-2" />
              Vote
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
