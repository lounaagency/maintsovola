
export interface Location {
  region: string;
  district: string;
  commune: string;
}

export interface AgriculturalProject {
  id: string;
  title: string;
  farmer: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  location: Location;
  cultivationArea: number; // en hectares
  cultivationType: string;
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
}
