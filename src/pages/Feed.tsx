
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgriculturalProjectCard from "@/components/AgriculturalProjectCard";
import NewProject from "@/components/NewProject";
import { motion } from "framer-motion";
import { AgriculturalProject } from "@/types/agriculturalProject";

const Feed: React.FC = () => {
  const [projects, setProjects] = useState<AgriculturalProject[]>([
    {
      id: "1",
      title: "Culture de riz biologique",
      farmer: {
        id: "1",
        name: "Jean Dupont",
        username: "jdupont",
        avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=200",
      },
      location: {
        region: "Analamanga",
        district: "Antananarivo",
        commune: "Ambohidratrimo"
      },
      cultivationArea: 5, // 5 hectares
      cultivationType: "Riz biologique",
      farmingCost: 3500,
      expectedYield: 4.5, // tonnes par hectare
      expectedRevenue: 7500,
      creationDate: "2023-11-15",
      images: [
        "https://images.unsplash.com/photo-1465379944081-7f47de8d74ac?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1485833077593-4278bba3f11f?auto=format&fit=crop&q=80&w=1200"
      ],
      description: "Projet de culture de riz biologique sur un terrain fertile de 5 hectares. L'irrigation est déjà en place et nous cherchons des investisseurs pour financer les semences et les équipements.",
      fundingGoal: 3500,
      currentFunding: 1200,
      likes: 42,
      comments: 8,
      shares: 3,
    },
    {
      id: "2",
      title: "Plantation de café arabica",
      farmer: {
        id: "2",
        name: "Marie Rakoto",
        username: "mrakoto",
        avatar: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80&w=200",
      },
      location: {
        region: "Vakinankaratra",
        district: "Antsirabe",
        commune: "Betafo"
      },
      cultivationArea: 3,
      cultivationType: "Café arabica",
      farmingCost: 4200,
      expectedYield: 0.8, // tonnes par hectare
      expectedRevenue: 9600,
      creationDate: "2023-12-05",
      images: [
        "https://images.unsplash.com/photo-1493962853295-0fd70327578a?auto=format&fit=crop&q=80&w=1200"
      ],
      description: "Projet de plantation de café arabica d'altitude. Le terrain bénéficie d'un microclimat idéal pour cette culture. Recherche de financement pour l'achat de plants et la mise en place du système d'irrigation.",
      fundingGoal: 4200,
      currentFunding: 2800,
      likes: 87,
      comments: 14,
      shares: 9,
      isLiked: true,
    },
    {
      id: "3",
      title: "Culture de légumes maraîchers",
      farmer: {
        id: "3",
        name: "Paul Randriamanana",
        username: "prandriamanana",
        avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200",
      },
      location: {
        region: "Itasy",
        district: "Miarinarivo",
        commune: "Soavinandriana"
      },
      cultivationArea: 1.5,
      cultivationType: "Légumes variés",
      farmingCost: 2000,
      expectedYield: 15, // tonnes par hectare
      expectedRevenue: 6000,
      creationDate: "2024-01-10",
      images: [
        "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&q=80&w=1200"
      ],
      description: "Projet de maraîchage biologique sur un terrain proche d'une source d'eau permanente. Les légumes produits seront vendus sur les marchés locaux. Recherche de financement pour les semences et le petit outillage.",
      fundingGoal: 2000,
      currentFunding: 800,
      likes: 124,
      comments: 32,
      shares: 18,
    },
  ]);
  
  const handleNewProject = (newProject: AgriculturalProject) => {
    setProjects([newProject, ...projects]);
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
        <h1 className="text-2xl font-bold text-gray-900">Projets agricoles</h1>
      </header>
      
      <Tabs defaultValue="for-you" className="mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted rounded-lg">
          <TabsTrigger value="for-you" className="rounded-md">Pour vous</TabsTrigger>
          <TabsTrigger value="following" className="rounded-md">Abonnements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="for-you" className="mt-4">
          <NewProject onProjectCreated={handleNewProject} />
          
          <motion.div
            className="space-y-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {projects.map((project) => (
              <motion.div key={project.id} variants={item}>
                <AgriculturalProjectCard project={project} />
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
        
        <TabsContent value="following" className="mt-4">
          <div className="flex items-center justify-center h-40 border rounded-lg border-dashed text-gray-500">
            Suivez des agriculteurs pour voir leurs projets
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Feed;
