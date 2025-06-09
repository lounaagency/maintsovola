
import React from 'react';
import { useUserActivity } from '@/hooks/useUserActivity';
import ActivityItem from './ActivityItem';
import { Activity } from 'lucide-react';

interface ActivityFeedProps {
  userId: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ userId }) => {
  const { activities, loading, error } = useUserActivity(userId);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Aucune activité récente à afficher.</p>
        <p className="text-sm mt-1">Vos actions apparaîtront ici au fur et à mesure.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="border-l-2 border-gray-200 ml-4 pl-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className={index < activities.length - 1 ? 'border-b border-gray-100' : ''}>
            <ActivityItem activity={activity} />
          </div>
        ))}
      </div>
      
      {activities.length >= 20 && (
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Affichage des 20 activités les plus récentes
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
