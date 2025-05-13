import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/context/user-context";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { generateRandomUsername, getUserInitials } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { login, isLoggingIn } = useUser();
  const [username, setUsername] = useState(generateRandomUsername());
  const [error, setError] = useState<string | null>(null);
  const userInitials = getUserInitials(username);

  const handleContinue = async () => {
    if (username.trim()) {
      setError(null);
      try {
        await login(username);
        onOpenChange(false);
      } catch (err) {
        // Extract clean error message without quotes
        let errorMessage = "Failed to create user";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      }
    }
  };

  const generateNewUser = () => {
    setUsername(generateRandomUsername());
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 rounded-t-lg -mt-4"></div>
        <DialogHeader className="text-center relative z-10 pb-6">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome to PollWave
          </DialogTitle>
          <DialogDescription>
            To participate in polls, we'll create a temporary random user for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center mt-4 relative z-10">
          <div className="h-20 w-20 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center text-white text-2xl shadow-md">
            <span>{userInitials}</span>
          </div>
          
          <div className="mt-4 w-full">
            <Label htmlFor="username" className="font-medium text-slate-700">Username</Label>
            <div className="flex mt-1">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-lg border-slate-300 focus:border-violet-500 focus:ring focus:ring-violet-200 transition-all"
                placeholder="Enter username..."
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 rounded-lg border-slate-300 hover:bg-violet-50 hover:text-violet-600 transition-all"
                onClick={generateNewUser}
                disabled={isLoggingIn}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4 border-red-200 bg-red-50 text-red-800 rounded-lg shadow-sm">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0 mt-6 pt-4 border-t border-slate-200">
          <Button
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition-all py-6 rounded-lg"
            onClick={handleContinue}
            disabled={isLoggingIn || !username.trim()}
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <span className="mr-2 h-5 w-5 animate-spin inline-block border-2 border-current border-t-transparent rounded-full"></span>
                Creating user...
              </>
            ) : (
              <span className="flex items-center justify-center text-lg font-medium">
                Continue as Random User
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
