
import React, { useState } from "react";
import UserAvatar from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MoreHorizontal, Send } from "lucide-react";

interface Comment {
  id: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
}

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: {
        name: "Jane Cooper",
        username: "jane_cooper",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
      },
      content: "This is amazing! Thanks for sharing.",
      timestamp: "15m ago",
      likes: 3,
      isLiked: false,
    },
    {
      id: "2",
      author: {
        name: "Alex Morgan",
        username: "alex_m",
        avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200",
      },
      content: "I've been waiting for this update!",
      timestamp: "1h ago",
      likes: 7,
      isLiked: true,
    },
  ]);
  
  const [newComment, setNewComment] = useState("");
  
  const handleLikeComment = (id: string) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === id) {
          return {
            ...comment,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            isLiked: !comment.isLiked,
          };
        }
        return comment;
      })
    );
  };
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        name: "You",
        username: "user",
      },
      content: newComment,
      timestamp: "Just now",
      likes: 0,
      isLiked: false,
    };
    
    setComments([...comments, comment]);
    setNewComment("");
  };

  return (
    <div className="border-t border-border px-4 py-3 bg-gray-50">
      <div className="space-y-3 mb-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex">
            <UserAvatar
              src={comment.author.avatar}
              alt={comment.author.name}
              size="sm"
            />
            <div className="ml-2 flex-1">
              <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                <div className="flex justify-between mb-1">
                  <div>
                    <span className="font-semibold text-xs">{comment.author.name}</span>
                    <span className="text-xs text-gray-500 ml-1">@{comment.author.username}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1">
                    <MoreHorizontal size={14} className="text-gray-500" />
                  </Button>
                </div>
                <p className="text-xs text-gray-800">{comment.content}</p>
              </div>
              <div className="flex items-center mt-1 ml-1">
                <button
                  className={`flex items-center text-xs ${comment.isLiked ? 'text-red-500' : 'text-gray-500'}`}
                  onClick={() => handleLikeComment(comment.id)}
                >
                  <Heart
                    size={12}
                    className={`mr-1 ${comment.isLiked ? 'fill-red-500' : ''}`}
                  />
                  <span>{comment.likes}</span>
                </button>
                <span className="text-xs text-gray-500 ml-3">{comment.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmitComment} className="flex items-center">
        <UserAvatar alt="You" size="sm" />
        <div className="flex-1 mx-2">
          <Input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="text-sm bg-white"
          />
        </div>
        <Button type="submit" size="sm" variant="ghost" className="text-primary">
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};

export default CommentSection;
