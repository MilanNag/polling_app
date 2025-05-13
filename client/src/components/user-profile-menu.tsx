import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserBadgeCollection } from "@/components/user-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/context/user-context";
import { badgeTypes, badgeInfo } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { LogOut, Trophy, Award } from "lucide-react";

// Simple wrapper to safely get progress values
const getProgressValue = (progress: number): number => {
  if (isNaN(progress) || progress < 0) return 0;
  if (progress > 100) return 100;
  return progress;
};

export function UserProfileMenu() {
  const { user, userInitials, logout, badges = [], userStats, refreshUserStats } = useUser();
  const [open, setOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  if (!user || hasError) return null;
  
  // Refresh stats when menu is opened
  const handleOpen = (isOpen: boolean) => {
    if (isOpen && refreshUserStats) {
      try {
        refreshUserStats();
      } catch (error) {
        console.error("Error refreshing user stats:", error);
        setHasError(true);
      }
    }
    setOpen(isOpen);
  };
  
  // Get progress towards next badge level
  const getProgressToNextLevel = (badgeType: string, count: number) => {
    if (badgeType === badgeTypes.POLL_CREATOR) {
      if (count < 5) return { current: count, next: 5, progress: (count / 5) * 100 };
      if (count < 10) return { current: count, next: 10, progress: ((count - 5) / 5) * 100 };
      return { current: count, next: null, progress: 100 };
    } else if (badgeType === badgeTypes.FIRST_VOTE) {
      if (count < 5) return { current: count, next: 5, progress: (count / 5) * 100 };
      if (count < 20) return { current: count, next: 20, progress: ((count - 5) / 15) * 100 };
      return { current: count, next: null, progress: 100 };
    }
    return { current: 0, next: null, progress: 0 };
  };
  
  // Calculate progress for polls created
  const pollsCreated = userStats?.pollsCreated || 0;
  const pollProgress = getProgressToNextLevel(badgeTypes.POLL_CREATOR, pollsCreated);
  
  // Calculate progress for votes submitted
  const votesSubmitted = userStats?.votesSubmitted || 0;
  const voteProgress = getProgressToNextLevel(badgeTypes.FIRST_VOTE, votesSubmitted);
  
  // Format numbers for display
  const pollProgressFormatted = getProgressValue(pollProgress?.progress || 0);
  const voteProgressFormatted = getProgressValue(voteProgress?.progress || 0);
  
  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-full h-10 w-10 p-0 relative">
          <Avatar>
            <AvatarFallback className="bg-violet-500 text-white">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {badges.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {badges.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-bold text-lg flex items-center justify-between">
          <span>{user.username}</span>
          <Button variant="ghost" size="sm" onClick={logout} className="h-8 px-2">
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Badges section */}
        <div className="px-2 py-2">
          <h3 className="text-sm font-semibold flex items-center mb-2">
            <Trophy className="h-4 w-4 mr-1" />
            Your Badges
          </h3>
          
          {Array.isArray(badges) && badges.length > 0 ? (
            <UserBadgeCollection 
              badges={badges} 
              maxDisplay={5} 
              size="sm" 
              className="my-2" 
            />
          ) : (
            <p className="text-xs text-gray-500 italic my-2">
              Create polls and vote to earn badges!
            </p>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Progress section */}
        <div className="px-2 py-2">
          <h3 className="text-sm font-semibold flex items-center mb-2">
            <Award className="h-4 w-4 mr-1" />
            Stats & Progress
          </h3>
          
          <div className="space-y-3">
            {/* Polls created progress */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">Polls Created</span>
                <span>{pollsCreated} {pollProgress.next ? `/ ${pollProgress.next}` : ""}</span>
              </div>
              <Progress value={pollProgressFormatted} className="h-2" />
            </div>
            
            {/* Votes submitted progress */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">Votes Cast</span>
                <span>{votesSubmitted} {voteProgress.next ? `/ ${voteProgress.next}` : ""}</span>
              </div>
              <Progress value={voteProgressFormatted} className="h-2" />
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}