
import React from "react";
import UserAvatar from "@/components/UserAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Edit, Settings, Image, MapPin, Link as LinkIcon } from "lucide-react";
import Post from "@/components/Post";
import { motion } from "framer-motion";

const Profile: React.FC = () => {
  const profile = {
    name: "Alex Morgan",
    username: "alexmorgan",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200",
    cover: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200",
    bio: "Product Designer & Developer | Creating digital experiences that people love",
    location: "San Francisco, CA",
    website: "alexmorgan.design",
    followers: 1425,
    following: 356,
    posts: 123,
  };

  const posts = [
    {
      id: "1",
      author: {
        name: profile.name,
        username: profile.username,
        avatar: profile.avatar,
      },
      content: "Just launched my new portfolio website! Check it out and let me know what you think.",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=1200",
      timestamp: "2d ago",
      likes: 87,
      comments: 14,
      shares: 9,
    },
    {
      id: "2",
      author: {
        name: profile.name,
        username: profile.username,
        avatar: profile.avatar,
      },
      content: "Working on something exciting. Can't wait to share it with you all soon!",
      timestamp: "1w ago",
      likes: 124,
      comments: 32,
      shares: 18,
    },
  ];
  
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
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-md mx-auto pb-6">
      <div className="relative">
        <div
          className="h-48 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${profile.cover})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
        </div>
        
        <div className="absolute top-4 right-4 flex space-x-2">
          <Button variant="outline" size="icon" className="rounded-full bg-white/80 backdrop-blur-sm">
            <Edit size={18} />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full bg-white/80 backdrop-blur-sm">
            <Settings size={18} />
          </Button>
        </div>
        
        <div className="relative -mt-16 px-4">
          <div className="flex justify-between items-end">
            <div className="bg-white p-1 rounded-full">
              <UserAvatar src={profile.avatar} alt={profile.name} size="lg" status="online" />
            </div>
            <Button variant="outline" className="rounded-full">
              Edit Profile
            </Button>
          </div>
          
          <div className="mt-2">
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="text-sm text-gray-500">@{profile.username}</p>
          </div>
          
          <p className="mt-3 text-sm text-gray-800">{profile.bio}</p>
          
          <div className="flex flex-wrap gap-y-2 mt-3">
            <div className="flex items-center text-xs text-gray-600 mr-4">
              <MapPin size={14} className="mr-1" />
              <span>{profile.location}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <LinkIcon size={14} className="mr-1" />
              <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                {profile.website}
              </a>
            </div>
          </div>
          
          <div className="flex mt-4 pt-4 border-t border-border">
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold">{profile.posts}</p>
              <p className="text-xs text-gray-500">Posts</p>
            </div>
            <div className="flex-1 text-center border-x border-border">
              <p className="text-sm font-semibold">{profile.followers}</p>
              <p className="text-xs text-gray-500">Followers</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold">{profile.following}</p>
              <p className="text-xs text-gray-500">Following</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-4 mt-6">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted rounded-lg">
            <TabsTrigger value="posts" className="rounded-md">Posts</TabsTrigger>
            <TabsTrigger value="photos" className="rounded-md">Photos</TabsTrigger>
            <TabsTrigger value="saved" className="rounded-md">Saved</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-4">
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
          
          <TabsContent value="photos" className="mt-4">
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-100 relative overflow-hidden"
                >
                  <Image className="absolute inset-0 m-auto text-gray-400" size={24} />
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="saved" className="mt-4">
            <div className="flex items-center justify-center h-40 border rounded-lg border-dashed text-gray-500">
              No saved posts yet
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
