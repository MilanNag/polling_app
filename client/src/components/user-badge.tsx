import { cn } from "@/lib/utils";
import { badgeInfo } from "@shared/schema";
import type { Badge } from "@shared/schema";

interface UserBadgeProps {
  badge: Badge;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

export function UserBadge({ 
  badge, 
  size = "md", 
  showTooltip = true,
  className
}: UserBadgeProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-12 w-12 text-xl",
    lg: "h-16 w-16 text-2xl"
  };

  // Add type safety and error handling
  if (!badge || !badge.type) return null;
  
  // Safe access to badge data
  const badgeType = badge.type as keyof typeof badgeInfo;
  const badgeData = badgeInfo[badgeType];
  
  // Badge not found in our info records
  if (!badgeData) {
    // Fallback for unknown badge types
    return (
      <div className={cn(
        "rounded-full flex items-center justify-center bg-gray-200 text-gray-600",
        sizeClasses[size],
        className
      )}>
        ?
      </div>
    );
  }
  
  // Find level information with type safety
  const levelInfo = badgeData.levels?.find((l: {level: number}) => l.level === (badge.level || 1));
  
  return (
    <div className="relative group">
      <div 
        className={cn(
          "rounded-full flex items-center justify-center",
          "shadow-md bg-gradient-to-br from-violet-500 to-indigo-600 text-white",
          sizeClasses[size],
          className
        )}
      >
        <span role="img" aria-label={badgeData.name}>
          {badgeData.icon}
        </span>
        
        {/* Level indicator */}
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full text-xs font-bold text-gray-800 h-5 w-5 flex items-center justify-center border-2 border-indigo-500">
          {badge.level}
        </div>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm rounded py-1 px-2 hidden group-hover:block w-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <p className="font-bold mb-1">{badgeData.name} {badge.level > 1 && `(Level ${badge.level})`}</p>
          <p className="text-gray-300 text-xs mb-1">{levelInfo?.title || `Level ${badge.level}`}</p>
          <p className="text-gray-400 text-xs">{badgeData.description}</p>
        </div>
      )}
    </div>
  );
}

// A component for displaying a collection of badges
interface UserBadgeCollectionProps {
  badges: Badge[];
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserBadgeCollection({
  badges,
  maxDisplay = 3,
  size = "md",
  className
}: UserBadgeCollectionProps) {
  if (!badges || !Array.isArray(badges) || badges.length === 0) {
    return null;
  }
  
  const sortedBadges = [...badges].sort((a, b) => {
    // Sort by level (descending)
    if (a.level !== b.level) return b.level - a.level;
    // Then by recently earned (descending)
    return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
  });
  
  const displayBadges = sortedBadges.slice(0, maxDisplay);
  const remaining = sortedBadges.length - maxDisplay;
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {displayBadges.map((badge) => (
        <UserBadge 
          key={`${badge.type}-${badge.level}`} 
          badge={badge}
          size={size}
        />
      ))}
      
      {remaining > 0 && (
        <div className={cn(
          "rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium",
          size === "sm" ? "h-8 w-8 text-xs" : size === "md" ? "h-12 w-12 text-sm" : "h-16 w-16 text-base"
        )}>
          +{remaining}
        </div>
      )}
    </div>
  );
}