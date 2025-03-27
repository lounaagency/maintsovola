
import React, { useState } from "react";
import UserAvatar from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image, MapPin, Calendar } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AgriculturalProject } from "@/types/agriculturalProject";

interface NewProjectProps {
  onProjectCreated?: (project: AgriculturalProject) => void;
}

const NewProject: React.FC<NewProjectProps> = ({ onProjectCreated }) => {
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("Veuillez décrire votre projet agricole");
      return;
    }
    
    setIsPosting(true);
    
    // Simuler la création d'un projet
    setTimeout(() => {
      const newProject: AgriculturalProject = {
        id: Date.now().toString(),
        title: "Nouveau projet agricole",
        farmer: {
          id: "user",
          name: "Vous",
          username: "utilisateur",
        },
        location: {
          region: "Région",
          district: "District",
          commune: "Commune"
        },
        cultivationArea: 2,
        cultivationType: "Non spécifié",
        farmingCost: 3000,
        expectedYield: 2,
        expectedRevenue: 5000,
        creationDate: new Date().toISOString().split('T')[0],
        images: [],
        description: content,
        fundingGoal: 3000,
        currentFunding: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      };
      
      if (onProjectCreated) {
        onProjectCreated(newProject);
      }
      
      setContent("");
      setIsPosting(false);
      toast.success("Projet créé avec succès!");
    }, 1000);
  };

  return (
    <Card className="mb-4 overflow-hidden border-border">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex">
            <UserAvatar alt="Vous" size="md" />
            <div className="ml-3 flex-1">
              <Textarea
                placeholder="Décrivez votre projet agricole..."
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
                <span className="text-xs">Photos</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="rounded-full text-gray-600">
                <MapPin size={18} className="mr-1" />
                <span className="text-xs">Lieu</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="rounded-full text-gray-600">
                <Calendar size={18} className="mr-1" />
                <span className="text-xs">Date</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              size="sm" 
              className="rounded-full px-4"
              disabled={!content.trim() || isPosting}
            >
              {isPosting ? "Publication..." : "Publier"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewProject;
