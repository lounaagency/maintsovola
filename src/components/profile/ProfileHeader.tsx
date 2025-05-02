
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, MapPin, Phone, User2, Edit, Users } from 'lucide-react';
import { UserProfile } from '@/types/userProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileHeaderProps {
  profile: UserProfile;
  isCurrentUser: boolean;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  projectsCount: number;
  onFollowToggle: () => Promise<void>;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isCurrentUser,
  isFollowing,
  followersCount,
  followingCount,
  projectsCount,
  onFollowToggle
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <Avatar className="h-24 w-24 rounded-full border-4 border-background">
        {profile.photo_profil ? (
          <img 
            src={profile.photo_profil} 
            alt={profile.nom} 
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <User2 className="h-12 w-12" />
        )}
      </Avatar>
      
      <div className="flex-1">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <h1 className="text-2xl font-bold">
            {`${profile.nom} ${profile.prenoms || ''}`}
          </h1>
          
          <div className="flex items-center">
            <span className="text-sm px-2 py-0.5 bg-muted rounded-full">
              {profile.nom_role?.charAt(0).toUpperCase() + profile.nom_role?.slice(1)}
            </span>
          </div>
        </div>
        
        {profile.bio && (
          <p className="mt-2 text-muted-foreground">{profile.bio}</p>
        )}
        
        <div className="flex flex-wrap gap-4 mt-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin size={16} className="mr-1" />
            <span>{profile.adresse || 'Aucune adresse'}</span>
          </div>
          
          {profile.telephone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone size={16} className="mr-1" />
              <span>{profile.telephone}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail size={16} className="mr-1" />
            <span>{profile.email}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center gap-1">
            <span className="font-semibold">{projectsCount}</span>
            <span className="text-muted-foreground text-sm">projets</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="font-semibold">{followersCount}</span>
            <span className="text-muted-foreground text-sm">abonnés</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="font-semibold">{followingCount}</span>
            <span className="text-muted-foreground text-sm">abonnements</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        {isCurrentUser ? (
          <Button 
            variant="outline" 
            onClick={() => navigate('/settings')}
            className="flex items-center"
          >
            <Edit size={16} className="mr-2" />
            Modifier profil
          </Button>
        ) : (
          <>
            <Button 
              variant={isFollowing ? "outline" : "default"}
              onClick={onFollowToggle}
            >
              {isFollowing ? (
                <>
                  <Users size={16} className="mr-2" />
                  Abonné
                </>
              ) : (
                <>
                  <Users size={16} className="mr-2" />
                  Suivre
                </>
              )}
            </Button>
            <Button variant="outline">
              <Mail size={16} className="mr-2" />
              Message
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
