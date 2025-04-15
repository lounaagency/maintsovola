
import React, { useState } from "react";
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { AnimatePresence, motion } from "framer-motion";
import CommentSection from "./CommentSection";
import { Button } from "@/components/ui/button";
import ProjectActions from "./ProjectActions";

export interface PostProps {
  id: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
  };
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
}

const Post: React.FC<PostProps> = ({
  id,
  author,
  content,
  image,
  timestamp,
  likes,
  comments,
  shares,
  isLiked = false,
}) => {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [showComments, setShowComments] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLike = () => {
    if (liked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setLiked(!liked);
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  return (
    <div className="post-card mb-4 animate-on-scroll visible">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <UserAvatar 
              src={author.avatar} 
              alt={author.name} 
              size="md" 
            />
            <div className="ml-3">
              <div className="font-semibold text-sm text-gray-900">{author.name}</div>
              <div className="text-xs text-gray-500">
                @{author.username} · {timestamp}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <MoreHorizontal size={18} className="text-gray-500" />
          </Button>
        </div>
        
        <div className="mb-3">
          <p className="text-sm text-gray-800 leading-relaxed">{content}</p>
        </div>
        
        {image && (
          <div className="relative -mx-4 mt-3 mb-3 aspect-video overflow-hidden bg-gray-100">
            <div className={`absolute inset-0 bg-gray-100 animate-pulse-subtle ${imageLoaded ? 'hidden' : 'block'}`} />
            <img
              src={image}
              alt="Post content"
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        )}
        
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <ProjectActions 
            projectId={id}
            likes={likeCount}
            comments={comments}
            shares={shares}
            isLiked={liked}
            onLikeToggle={handleLike}
            onOpenComments={toggleComments}
            onShare={() => {}}
            className=""
            fundingGap={0} // Add the missing required prop with default value
          />
        </div>
      </div>
      
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CommentSection postId={id} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Post;
