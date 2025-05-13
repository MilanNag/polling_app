import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { User, Badge } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getUserInitials } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface UserStats {
  id: number;
  userId: string;
  username: string;
  pollsCreated: number;
  votesSubmitted: number;
  badges: Badge[];
}

interface UserContextType {
  user: User | null;
  userInitials: string;
  userStats: UserStats | null;
  badges: Badge[];
  isBadgesLoading: boolean;
  refreshUserStats: () => void;
  login: (username: string) => Promise<void>;
  logout: () => void;
  isLoggingIn: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // On mount, check for user in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("pollwave_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem("pollwave_user");
      }
    }
  }, []);

  // Fetch user stats and badges when user is logged in
  const { 
    data: userStats,
    isLoading: isUserStatsLoading,
    refetch: refetchUserStats
  } = useQuery({
    queryKey: [`/api/users/${user?.userId}/stats`],
    enabled: !!user?.userId,
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
  });

  const refreshUserStats = () => {
    if (user?.userId) {
      refetchUserStats();
    }
  };

  const login = async (username: string) => {
    try {
      setIsLoggingIn(true);
      const response = await apiRequest("POST", "/api/users", { username });
      
      // Check if response is not ok (HTTP error)
      if (!response.ok) {
        // Get the error message as plain text
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create user");
      }
      
      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("pollwave_user", JSON.stringify(userData));
      
      // Refresh stats after login
      setTimeout(() => refreshUserStats(), 500);
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem("pollwave_user");
  };

  const userInitials = user ? getUserInitials(user.username) : "";
  
  // Extract badges from userStats with proper type checking
  let badges: Badge[] = [];
  if (userStats && 'badges' in userStats && Array.isArray(userStats.badges)) {
    // Filter out invalid badges
    badges = userStats.badges.filter(badge => 
      badge && typeof badge === 'object' && 'type' in badge && 'level' in badge
    ) as Badge[];
  }

  return (
    <UserContext.Provider value={{ 
      user, 
      userInitials, 
      userStats: userStats as UserStats | null,
      badges,
      isBadgesLoading: isUserStatsLoading,
      refreshUserStats,
      login, 
      logout, 
      isLoggingIn 
    }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to access user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
