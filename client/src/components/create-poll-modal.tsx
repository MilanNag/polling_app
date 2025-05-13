import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import { LoginModal } from "@/components/login-modal";

interface CreatePollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePollModal({ open, onOpenChange }: CreatePollModalProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [endDate, setEndDate] = useState("");
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Helper to get tomorrow's date in YYYY-MM-DD format
  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Reset form when modal is opened
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setQuestion("");
      setDescription("");
      setOptions(["", ""]);
      setEndDate("");
    }
    onOpenChange(open);
  };

  // Handle adding a new option
  const addOption = () => {
    setOptions([...options, ""]);
  };

  // Handle removing an option
  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast({
        title: "Error",
        description: "A poll must have at least 2 options",
        variant: "destructive",
      });
      return;
    }
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  // Handle updating an option
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Create poll mutation
  const createPollMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/polls", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Poll created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/polls/active"] });
      handleOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create poll",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    // Validate form
    if (!question.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    if (options.some(option => !option.trim())) {
      toast({
        title: "Error",
        description: "All options must have text",
        variant: "destructive",
      });
      return;
    }

    if (!endDate) {
      toast({
        title: "Error",
        description: "Please select an end date",
        variant: "destructive",
      });
      return;
    }

    const pollData = {
      question,
      description: description.trim() || undefined,
      createdBy: user.userId,
      endDate: endDate ? endDate + "T00:00:00.000Z" : null, // Format YYYY-MM-DDT00:00:00.000Z
      options: options.map(option => option.trim()),
    };
    
    // Log for debugging
    console.log("Creating poll with data:", pollData);

    createPollMutation.mutate(pollData);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Poll</DialogTitle>
            <DialogDescription>
              Create a new poll for others to vote on
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} id="create-poll-form" data-testid="create-poll-form">
            {/* Add a debug indicator for number of options - helps with testing */}
            <div data-testid="options-count">{options.length}</div>
            <div className="space-y-6">
              <div>
                <Label htmlFor="poll-question">Poll Question</Label>
                <Input
                  id="poll-question"
                  placeholder="Ask a question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="poll-description">Description (Optional)</Label>
                <Textarea
                  id="poll-description"
                  placeholder="Add some context to your question..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label>Poll Options</Label>
                <div className="mt-1 space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="ml-2"
                        aria-label="Remove option"
                        disabled={options.length <= 1}
                        data-testid={`remove-option-${index}`}
                      >
                        <Trash2 className="h-5 w-5 text-gray-400" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="mt-2"
                  disabled={options.length >= 6}
                  aria-label="Add Option"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>

              <div>
                <Label htmlFor="poll-end-date">End Date</Label>
                <Input
                  id="poll-end-date"
                  type="date"
                  min={getTomorrow()}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="create-poll-form"
              disabled={createPollMutation.isPending}
              aria-label="Create Poll"
            >
              {createPollMutation.isPending ? "Creating..." : "Create Poll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />
    </>
  );
}
