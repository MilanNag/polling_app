import { useUser } from "@/context/user-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserBadge } from "@/components/user-badge";
import { useEffect, useState } from "react";
import { badgeInfo } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";

export function BadgeShowcase() {
  const { user, badges = [], refreshUserStats } = useUser();
  const [hasError, setHasError] = useState(false);
  
  // Refresh badges when component mounts
  useEffect(() => {
    if (user && refreshUserStats && !hasError) {
      try {
        refreshUserStats();
      } catch (error) {
        console.error("Error refreshing user stats:", error);
        setHasError(true);
      }
    }
  }, [user, refreshUserStats, hasError]);
  
  // If there's an error or no badges to show, don't render the component
  if (!user || hasError || !Array.isArray(badges) || badges.length === 0) return null;
  
  return (
    <Card className="mb-6 bg-white border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md flex items-center gap-2">
            <Award className="h-5 w-5 text-violet-500" />
            Your Achievements
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={refreshUserStats} className="h-8 text-xs">
            Refresh
          </Button>
        </div>
        <CardDescription>Your earned badges and achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {Array.isArray(badges) && badges.map((badge) => {
            if (!badge || !badge.type) return null;
            
            // Safely access badge data with type checking
            if (
              !badge.type || 
              ![
                'poll_creator', 
                'poll_master', 
                'vote_collector', 
                'first_vote', 
                'top_contributor'
              ].includes(badge.type)
            ) return null;
            
            const badgeType = badge.type as keyof typeof badgeInfo;
            const badgeData = badgeInfo[badgeType];
            
            if (!badgeData) return null;
            
            // Find level info if it exists
            const badgeLevel = badge.level || 1;
            // Add type safety for the find operation
            const levelInfo = badgeData.levels?.find((level: {level: number}) => level.level === badgeLevel);
            
            return (
              <div key={`${badge.type}-${badgeLevel}`} className="flex flex-col items-center text-center">
                <UserBadge badge={badge} size="md" />
                <p className="text-sm font-medium mt-2">{badgeData.name || "Badge"}</p>
                <p className="text-xs text-gray-500">{levelInfo?.title || `Level ${badgeLevel}`}</p>
                {badgeLevel > 1 && (
                  <span className="inline-block bg-violet-100 text-violet-800 text-xs px-2 py-0.5 rounded-full mt-1">
                    Level {badgeLevel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}