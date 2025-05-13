import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Copy, Share2 } from "lucide-react";
import { Poll } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/context/user-context";

interface SharePollCardProps {
  poll: Poll;
}

export function SharePollCard({ poll }: SharePollCardProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [previewImage, setPreviewImage] = useState(poll.previewImageUrl || "");
  const shareUrl = `${window.location.origin}/share/${poll.shareCode}`;

  // Mutation to update preview image
  const { mutate: updatePreviewImage, isPending } = useMutation({
    mutationFn: async (previewImageUrl: string) => {
      return apiRequest(`/api/polls/${poll.id}/preview`, "PATCH", {
        previewImageUrl
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Preview image has been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preview image",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Share link has been copied to clipboard",
    });
  };

  const handleSavePreviewImage = () => {
    if (previewImage.trim()) {
      updatePreviewImage(previewImage);
    } else {
      toast({
        title: "Error",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
    }
  };

  const shareOnSocialMedia = () => {
    const shareText = `Check out this poll: ${poll.question}`;
    const shareUrl = `${window.location.origin}/share/${poll.shareCode}`;
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: poll.question,
        text: shareText,
        url: shareUrl,
      }).catch((error) => {
        console.error('Error sharing:', error);
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Share This Poll</h3>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Input
              value={shareUrl}
              readOnly
              className="bg-gray-50"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={shareOnSocialMedia} 
            variant="secondary" 
            className="w-full"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share on Social Media
          </Button>
        </div>
        
        <div className="mt-6">
          <Label htmlFor="previewImage" className="block mb-2">
            Preview Image URL
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              id="previewImage"
              value={previewImage}
              onChange={(e) => setPreviewImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1"
            />
            <Button
              onClick={handleSavePreviewImage}
              disabled={isPending || !previewImage.trim()}
            >
              Save
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This image will be displayed when sharing the poll link on social media
          </p>
          
          {previewImage && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Preview</h4>
              <div className="bg-gray-100 rounded-md border overflow-hidden">
                <img 
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/600x400?text=Invalid+Image+URL";
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}