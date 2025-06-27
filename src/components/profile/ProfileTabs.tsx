
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Heart, MessageSquare, Calendar, MapPin, Cloud, TrendingUp, Briefcase, Book } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ProfileHeader from "./ProfileHeader";
import ProjectList from "./ProjectList";
import InvestmentsList from "./InvestmentsList";
import PaymentHistory from "./PaymentHistory";
import ActivityFeed from "./ActivityFeed";
import WeeklyPlanningTable from "./technicien/WeeklyPlanningTable";
import AssignedParcelsView from "./technicien/AssignedParcelsView";
import CompletedTasksList from "./technicien/CompletedTasksList";
import TechnicienPaymentHistory from "./technicien/TechnicienPaymentHistory";
import TechnicalResourcesLibrary from "./technicien/TechnicalResourcesLibrary";
import WeatherSection from "./technicien/WeatherSection";

interface ProfileTabsProps {
  userId: string;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ userId }) => {
  const { user, profile } = useAuth();
  const isOwnProfile = user?.id === userId;
  const userRole = profile?.nom_role?.toLowerCase() || 'simple';

  const getTabs = () => {
    if (userRole === 'technicien') {
      return [
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'planning', label: 'Planning', icon: Calendar },
        { id: 'parcels', label: 'Parcelles', icon: MapPin },
        { id: 'weather', label: 'Météo', icon: Cloud },
        { id: 'completed', label: 'Terminées', icon: TrendingUp },
        { id: 'payments', label: 'Paiements', icon: Briefcase },
        { id: 'resources', label: 'Ressources', icon: Book },
        { id: 'activity', label: 'Activité', icon: MessageSquare },
      ];
    } else if (userRole === 'investisseur') {
      return [
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'investments', label: 'Investissements', icon: Heart },
        { id: 'payments', label: 'Paiements', icon: TrendingUp },
        { id: 'activity', label: 'Activité', icon: MessageSquare },
      ];
    } else {
      return [
        { id: 'profile', label: 'Profil', icon: User },
        { id: 'projects', label: 'Projets', icon: Heart },
        { id: 'activity', label: 'Activité', icon: MessageSquare },
      ];
    }
  };

  const tabs = getTabs();

  return (
    <div className="w-full max-w-6xl mx-auto">
      <ProfileHeader userId={userId} />
      
      <div className="mt-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="profile">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">Profil utilisateur</h3>
                <p className="text-gray-600">Informations du profil à venir</p>
              </div>
            </TabsContent>

            {userRole === 'technicien' && (
              <>
                <TabsContent value="planning">
                  <WeeklyPlanningTable userId={userId} userRole={userRole} />
                </TabsContent>
                
                <TabsContent value="parcels">
                  <AssignedParcelsView userId={userId} userRole={userRole} />
                </TabsContent>
                
                <TabsContent value="weather">
                  <WeatherSection />
                </TabsContent>
                
                <TabsContent value="completed">
                  <CompletedTasksList userId={userId} userRole={userRole} />
                </TabsContent>
                
                <TabsContent value="payments">
                  <TechnicienPaymentHistory userId={userId} />
                </TabsContent>
                
                <TabsContent value="resources">
                  <TechnicalResourcesLibrary />
                </TabsContent>
              </>
            )}

            {userRole === 'investisseur' && (
              <>
                <TabsContent value="investments">
                  <InvestmentsList userId={userId} />
                </TabsContent>
                
                <TabsContent value="payments">
                  <PaymentHistory userId={userId} />
                </TabsContent>
              </>
            )}

            {userRole === 'simple' && (
              <TabsContent value="projects">
                <ProjectList userId={userId} />
              </TabsContent>
            )}

            <TabsContent value="activity">
              <ActivityFeed userId={userId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfileTabs;
