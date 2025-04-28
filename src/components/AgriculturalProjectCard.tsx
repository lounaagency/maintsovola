import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageSquare, Share2 } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { format } from 'date-fns';

interface AgriculturalProjectCardProps {
  project: {
    id: string;
    title: string;
    farmer: {
      id: string;
      name: string | React.ReactNode;
      username: string;
      avatar?: string;
    };
    location: {
      region: string | React.ReactNode;
      district: string | React.ReactNode;
      commune: string | React.ReactNode;
    };
    cultivationArea: number;
    cultivationType: string | React.ReactNode;
    farmingCost: number;
    expectedYield: string | number;
    expectedRevenue: number;
    creationDate: string;
    images: string[];
    description: string;
    fundingGoal: number;
    currentFunding: number;
    likes: number;
    comments: number;
    shares: number;
    isLiked?: boolean;
    technicianId?: string;
  };
  onLikeToggle: (isLiked: boolean) => void;
}

const AgriculturalProjectCard: React.FC<AgriculturalProjectCardProps> = ({
  project,
  onLikeToggle
}) => {
  const isLiked = project.isLiked ?? false;

  const handleLikeClick = () => {
    onLikeToggle(isLiked);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd-MM-yyyy');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center">
          <Avatar className="mr-3 h-8 w-8">
            <AvatarImage src={project.farmer.avatar} />
            <AvatarFallback>{project.farmer.name.toString()[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <CardTitle className="text-sm font-medium">{project.farmer.name}</CardTitle>
            <CardDescription className="text-xs text-gray-500">@{project.farmer.username}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-4">
        <CardTitle className="text-base font-semibold">{project.title}</CardTitle>
        <CardDescription className="text-sm text-gray-700">{project.description}</CardDescription>
        <div className="mt-2 text-xs text-gray-500">
          {project.location.region}, {project.location.district}, {project.location.commune}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Culture: {project.cultivationType}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between py-3">
        <div className="flex items-center space-x-4 text-gray-500">
          <Button variant="ghost" size="icon" onClick={handleLikeClick}>
            <Heart className={`h-4 w-4 ${isLiked ? 'text-red-500' : ''}`} fill={isLiked ? 'red' : 'none'} />
          </Button>
          <span>{project.likes}</span>
          <Button variant="ghost" size="icon">
            <MessageSquare className="h-4 w-4" />
          </Button>
          <span>{project.comments}</span>
          <Button variant="ghost" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
          <span>{project.shares}</span>
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(project.creationDate)}
        </div>
      </CardFooter>
    </Card>
  );
};

export default AgriculturalProjectCard;
