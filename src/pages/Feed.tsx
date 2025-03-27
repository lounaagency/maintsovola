
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Post, { PostProps } from "@/components/Post";
import NewPost from "@/components/NewPost";
import { motion } from "framer-motion";

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<PostProps[]>([
    {
      id: "1",
      author: {
        name: "Emma Watson",
        username: "emmaw",
        avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200",
      },
      content: "Just finished reading this amazing book about sustainable design. So many insights that I can apply to my next project! 📚 #SustainableDesign #Reading",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200",
      timestamp: "2h ago",
      likes: 42,
      comments: 8,
      shares: 3,
    },
    {
      id: "2",
      author: {
        name: "David Chen",
        username: "dchen",
        avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=200",
      },
      content: "Check out the view from my hotel room! The conference starts tomorrow and I'm so excited to share what we've been working on.",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=1200",
      timestamp: "4h ago",
      likes: 87,
      comments: 14,
      shares: 9,
      isLiked: true,
    },
    {
      id: "3",
      author: {
        name: "Sarah Johnson",
        username: "sjohnson",
        avatar: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80&w=200",
      },
      content: "Just launched our new website! It's been months of hard work but I'm so proud of what the team has accomplished. Check it out and let me know what you think!",
      timestamp: "6h ago",
      likes: 124,
      comments: 32,
      shares: 18,
    },
  ]);
  
  const handleNewPost = (newPost: PostProps) => {
    setPosts([newPost, ...posts]);
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 25 } }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
      </header>
      
      <Tabs defaultValue="for-you" className="mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted rounded-lg">
          <TabsTrigger value="for-you" className="rounded-md">For You</TabsTrigger>
          <TabsTrigger value="following" className="rounded-md">Following</TabsTrigger>
        </TabsList>
        
        <TabsContent value="for-you" className="mt-4">
          <NewPost onPostCreated={handleNewPost} />
          
          <motion.div
            className="space-y-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {posts.map((post) => (
              <motion.div key={post.id} variants={item}>
                <Post {...post} />
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
        
        <TabsContent value="following" className="mt-4">
          <div className="flex items-center justify-center h-40 border rounded-lg border-dashed text-gray-500">
            Start following people to see their posts
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Feed;
