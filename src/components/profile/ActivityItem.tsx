
import React from 'react';
import { Activity } from '@/types/activity';
import { 
  Sprout, 
  Coins, 
  MapPin, 
  CheckCircle, 
  UserPlus, 
  Bell,
  LucideIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityItemProps {
  activity: Activity;
}

const iconMap: Record<string, LucideIcon> = {
  Sprout,
  Coins,
  MapPin,
  CheckCircle,
  UserPlus,
  Bell
};

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const IconComponent = iconMap[activity.icon] || Bell;
  
  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'project_created':
        return 'text-green-600 bg-green-100';
      case 'project_investment':
        return 'text-blue-600 bg-blue-100';
      case 'terrain_added':
        return 'text-orange-600 bg-orange-100';
      case 'milestone_completed':
        return 'text-purple-600 bg-purple-100';
      case 'follow':
        return 'text-pink-600 bg-pink-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const timeAgo = formatDistanceToNow(new Date(activity.date), {
    addSuffix: true,
    locale: fr
  });

  return (
    <div className="flex items-start space-x-3 py-3">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
        <IconComponent className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">
            {activity.title}
          </p>
          <p className="text-xs text-gray-500 flex-shrink-0">
            {timeAgo}
          </p>
        </div>
        
        <p className="text-sm text-gray-600 mt-1">
          {activity.description}
        </p>
      </div>
    </div>
  );
};

export default ActivityItem;
