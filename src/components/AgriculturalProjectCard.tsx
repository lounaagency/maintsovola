
import React, { useState } from "react";
import { Heart, MessageCircle, Share, MoreHorizontal, MapPin, Calendar, Image } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { AnimatePresence, motion } from "framer-motion";
import CommentSection from "./CommentSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AgriculturalProject } from "@/types/agriculturalProject";
import { Progress } from "@/components/ui/progress";

interface AgriculturalProjectCardProps {
  project: AgriculturalProject;
}

const AgriculturalProjectCard: React.FC<AgriculturalProjectCardProps> = ({
  project
}) => {
  const [liked, setLiked] = useState(project.isLiked);
  const [likeCount, setLikeCount] = useState(project.likes);
  const [showComments, setShowComments] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  const handleNextImage = () => {
    setImageLoaded(false);
    setCurrentImageIndex((prev) => (prev + 1) % project.images.length);
  };

  const handlePrevImage = () => {
    setImageLoaded(false);
    setCurrentImageIndex((prev) => (prev - 1 + project.images.length) % project.images.length);
  };

  const fundingPercentage = (project.currentFunding / project.fundingGoal) * 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UserAvatar 
              src={project.farmer.avatar} 
              alt={project.farmer.name} 
              size="md" 
            />
            <div className="ml-3">
              <div className="font-semibold text-sm text-gray-900">{project.farmer.name}</div>
              <div className="text-xs text-gray-500">
                @{project.farmer.username} · {new Date(project.creationDate).toLocaleDateString()}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <MoreHorizontal size={18} className="text-gray-500" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
        
        <div className="mb-3 text-sm text-gray-800 leading-relaxed">
          {project.description}
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-xs text-gray-600">
            <MapPin size={14} className="mr-1" />
            <span>{project.location.commune}, {project.location.district}, {project.location.region}</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-600">
            <Calendar size={14} className="mr-1" />
            <span>Créé le {new Date(project.creationDate).toLocaleDateString()}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="text-xs text-gray-600">Surface</div>
              <div className="font-medium">{project.cultivationArea} ha</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="text-xs text-gray-600">Culture</div>
              <div className="font-medium">{project.cultivationType}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="text-xs text-gray-600">Coût</div>
              <div className="font-medium">{project.farmingCost.toLocaleString()} €</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="text-xs text-gray-600">Rendement</div>
              <div className="font-medium">{project.expectedYield} t/ha</div>
            </div>
          </div>
        </div>
        
        {project.images.length > 0 && (
          <div className="relative -mx-4 mt-3 mb-3 aspect-video overflow-hidden bg-gray-100">
            <div className={`absolute inset-0 bg-gray-100 animate-pulse-subtle ${imageLoaded ? 'hidden' : 'block'}`} />
            <img
              src={project.images[currentImageIndex]}
              alt={`Image du projet ${currentImageIndex + 1}/${project.images.length}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
            
            {project.images.length > 1 && (
              <>
                <Button 
                  onClick={handlePrevImage}
                  variant="ghost" 
                  size="sm" 
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 p-0"
                >
                  <Image size={16} className="text-white" />
                </Button>
                <Button 
                  onClick={handleNextImage}
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 p-0"
                >
                  <Image size={16} className="text-white" />
                </Button>
              </>
            )}
          </div>
        )}
        
        <div className="mt-4 mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{project.currentFunding.toLocaleString()} € collectés</span>
            <span className="text-gray-600">{fundingPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={fundingPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Objectif: {project.fundingGoal.toLocaleString()} €</span>
            <span>CA prévisionnel: {project.expectedRevenue.toLocaleString()} €</span>
          </div>
        </div>
        
        <div className="mt-4">
          <Button className="w-full" size="sm">
            Investir dans ce projet
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between p-4 pt-0 border-t border-border">
        <button 
          className={`like-button flex items-center text-sm font-medium p-1 rounded-full transition-colors ${liked ? 'liked text-red-500' : 'text-gray-600 hover:text-red-500'}`}
          onClick={handleLike}
        >
          <Heart 
            size={18} 
            className={`mr-1 ${liked ? 'fill-red-500 animate-heart-beat' : ''}`} 
          />
          <span>{likeCount}</span>
        </button>
        
        <button 
          className="flex items-center text-sm font-medium text-gray-600 p-1 rounded-full hover:text-primary transition-colors"
          onClick={toggleComments}
        >
          <MessageCircle size={18} className="mr-1" />
          <span>{project.comments}</span>
        </button>
        
        <button className="flex items-center text-sm font-medium text-gray-600 p-1 rounded-full hover:text-green-500 transition-colors">
          <Share size={18} className="mr-1" />
          <span>{project.shares}</span>
        </button>
      </CardFooter>
      
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CommentSection postId={project.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default AgriculturalProjectCard;
