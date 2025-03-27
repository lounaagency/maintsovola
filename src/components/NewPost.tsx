
import React, { useState } from "react";
import UserAvatar from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Smile, MapPin } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface NewPostProps {
  onPostCreated?: (post: any) => void;
}

const NewPost: React.FC<NewPostProps> = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("Please enter some content for your post");
      return;
    }
    
    setIsPosting(true);
    
    // Simulate post creation
    setTimeout(() => {
      const newPost = {
        id: Date.now().toString(),
        author: {
          name: "You",
          username: "user",
        },
        content,
        timestamp: "Just now",
        likes: 0,
        comments: 0,
        shares: 0,
      };
      
      if (onPostCreated) {
        onPostCreated(newPost);
      }
      
      setContent("");
      setIsPosting(false);
      toast.success("Post created successfully!");
    }, 1000);
  };

  return (
    <Card className="mb-4 overflow-hidden border-border">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex">
            <UserAvatar alt="You" size="md" />
            <div className="ml-3 flex-1">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                rows={3}
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
            <div className="flex">
              <Button type="button" variant="ghost" size="sm" className="rounded-full text-gray-600">
                <Image size={18} className="mr-1" />
                <span className="text-xs">Photo</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="rounded-full text-gray-600">
                <Smile size={18} className="mr-1" />
                <span className="text-xs">Feeling</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="rounded-full text-gray-600">
                <MapPin size={18} className="mr-1" />
                <span className="text-xs">Location</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              size="sm" 
              className="rounded-full px-4"
              disabled={!content.trim() || isPosting}
            >
              {isPosting ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewPost;
