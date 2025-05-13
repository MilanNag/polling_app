import { useEffect, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@/context/user-context";
import { Button } from "@/components/ui/button";
import { Plus, LogIn } from "lucide-react";
import { CreatePollModal } from "@/components/create-poll-modal";
import { LoginModal } from "@/components/login-modal";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { useState } from "react";
import ErrorBoundary from "@/components/error-boundary";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useUser();
  const [location] = useLocation();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Set page title based on location
  useEffect(() => {
    let title = "PollWave - Create and Vote on Polls";
    if (location.startsWith("/polls/")) {
      title = "Poll Details - PollWave";
    }
    document.title = title;
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/" className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  PollWave
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                className="inline-flex items-center bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Poll
              </Button>
              
              <ErrorBoundary fallback={
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLoginModalOpen(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              }>
                {user ? (
                  <UserProfileMenu />
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setLoginModalOpen(true)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                )}
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} PollWave. All rights reserved.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">Terms</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">Help</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Create Poll Modal */}
      <CreatePollModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {/* Login Modal */}
      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />
    </div>
  );
}
