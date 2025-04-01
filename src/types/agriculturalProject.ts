
import { ReactNode } from 'react';

export interface Location {
  region: string | ReactNode;
  district: string | ReactNode;
  commune: string | ReactNode;
}

export interface AgriculturalProject {
  id: string;
  title: string;
  farmer: {
    id: string;
    name: string | ReactNode;
    username: string;
    avatar?: string;
  };
  location: Location;
  cultivationArea: number; // en hectares
  cultivationType: string | ReactNode;
  farmingCost: number;
  expectedYield: number;
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
  technicienId?: string; // ID du technicien responsable du projet
}
