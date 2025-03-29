
import React, { useEffect } from "react";
import UserAvatar from "@/components/UserAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Edit, Settings, Image, MapPin, Link as LinkIcon, LogOut } from "lucide-react";
import Post from "@/components/Post";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Profile: React.FC = () => {
  const { user, profile, signOut, loading } = useAuth();
  
  // Redirect to auth page if not logged in
  if (!loading && !user) {
    return <Navigate to="/auth" />;
  }

  const profileData = {
    name: profile?.nom || "Utilisateur",
    username: profile?.email?.split('@')[0] || "utilisateur",
    avatar: profile?.photo_profil || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200",
    cover: profile?.photo_couverture || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200",
    bio: `${profile?.nom_role || "Utilisateur"} | Plateforme AgrInvest`,
    location: "Madagascar",
    website: "agrinvest.mg",
    followers: 1425,
    following: 356,
    posts: 123,
  };

  const posts = [
    {
      id: "1",
      author: {
        name: profileData.name,
        username: profileData.username,
        avatar: profileData.avatar,
      },
      content: "Je viens de rejoindre AgrInvest ! Prêt à participer à des projets agricoles passionnants.",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=1200",
      timestamp: "2d ago",
      likes: 87,
      comments: 14,
      shares: 9,
    },
    {
      id: "2",
      author: {
        name: profileData.name,
        username: profileData.username,
        avatar: profileData.avatar,
      },
      content: "Découvrez mon nouveau projet agricole ! Une opportunité unique d'investissement.",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-6">
      <div className="relative">
        <div
          className="h-48 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${profileData.cover})` }}
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
              <UserAvatar src={profileData.avatar} alt={profileData.name} size="lg" status="online" />
            </div>
            <Button variant="outline" className="rounded-full" onClick={signOut}>
              <LogOut size={16} className="mr-2" />
              Déconnexion
            </Button>
          </div>
          
          <div className="mt-2">
            <h1 className="text-xl font-bold">{profileData.name}</h1>
            <p className="text-sm text-gray-500">@{profileData.username}</p>
            <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {profile?.nom_role || "Utilisateur"}
            </div>
          </div>
          
          <p className="mt-3 text-sm text-gray-800">{profileData.bio}</p>
          
          <div className="flex flex-wrap gap-y-2 mt-3">
            <div className="flex items-center text-xs text-gray-600 mr-4">
              <MapPin size={14} className="mr-1" />
              <span>{profileData.location}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <LinkIcon size={14} className="mr-1" />
              <a href={`https://${profileData.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                {profileData.website}
              </a>
            </div>
          </div>
          
          <div className="flex mt-4 pt-4 border-t border-border">
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold">{profileData.posts}</p>
              <p className="text-xs text-gray-500">Projets</p>
            </div>
            <div className="flex-1 text-center border-x border-border">
              <p className="text-sm font-semibold">{profileData.followers}</p>
              <p className="text-xs text-gray-500">Abonnés</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold">{profileData.following}</p>
              <p className="text-xs text-gray-500">Abonnements</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-4 mt-6">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted rounded-lg">
            <TabsTrigger value="posts" className="rounded-md">Projets</TabsTrigger>
            <TabsTrigger value="photos" className="rounded-md">Photos</TabsTrigger>
            <TabsTrigger value="saved" className="rounded-md">Sauvegardés</TabsTrigger>
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
              Pas de projets sauvegardés
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
