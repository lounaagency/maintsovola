import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { 
  Loader2, 
  UserPlus, 
  Calendar, 
  Phone, 
  MapPin, 
  Mail, 
  Edit, 
  MessageSquare, 
  MoreHorizontal,
  UserMinus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MessageDialog from '@/components/MessageDialog';

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [userData, setUserData] = useState<{
    id_utilisateur: string;
    nom: string;
    prenoms?: string;
    email: string;
    photo_profil?: string;
    nom_role?: string;
  } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showContactDialog, setShowContactDialog] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms, email, photo_profil, roles(nom_role)')
        .eq('id_utilisateur', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUserData({
          id_utilisateur: data.id_utilisateur,
          nom: data.nom,
          prenoms: data.prenoms,
          email: data.email,
          photo_profil: data.photo_profil,
          nom_role: data.roles?.nom_role
        });
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  async function fetchFollowStatus() {
    if (!user?.id || !userId) return;

    try {
      const { data, error } = await supabase
        .from('abonnement')
        .select('*')
        .eq('id_abonne', user.id)
        .eq('id_suivi', userId)
        .single();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error fetching follow status:', error);
      toast.error("Erreur lors du chargement du statut d'abonnement");
    }
  }

  async function fetchFollowersCount() {
    try {
      const { data, error } = await supabase.rpc('count_followers', { user_id: userId });
      if (error) throw error;
      setFollowersCount(data as number || 0);
    } catch (error) {
      console.error('Error fetching followers count:', error);
      toast.error("Erreur lors du chargement des abonnés");
    }
  }

  async function fetchFollowingCount() {
    try {
      const { data, error } = await supabase.rpc('count_subscriptions', { user_id: userId });
      if (error) throw error;
      setFollowingCount(data as number || 0);
    } catch (error) {
      console.error('Error fetching following count:', error);
      toast.error("Erreur lors du chargement des abonnements");
    }
  }

  useEffect(() => {
    fetchProfileData();
    fetchFollowStatus();
    fetchFollowersCount();
    fetchFollowingCount();
  }, [userId, user, fetchProfileData]);

  const handleFollowUser = async () => {
    if (!user?.id) {
      toast.error("Vous devez être connecté pour vous abonner");
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('abonnement')
          .delete()
          .eq('id_abonne', user.id)
          .eq('id_suivi', userId);

        if (error) throw error;
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast.success(`Vous ne suivez plus ${userData?.nom || 'cet utilisateur'}`);
      } else {
        // Follow
        const { error } = await supabase.rpc('create_subscription', {
          follower_id: user.id,
          followed_id: userId
        });

        if (error) throw error;
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success(`Vous suivez maintenant ${userData?.nom || 'cet utilisateur'}`);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error("Une erreur est survenue");
    }
  };

  const handleContactUser = () => {
    setShowContactDialog(true);
  };

  const handleCloseContactDialog = () => {
    setShowContactDialog(false);
  };

  if (loading) {
    return <div className="text-center">Chargement du profil...</div>;
  }

  if (!userData) {
    return <div className="text-center">Profil non trouvé.</div>;
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={userData.photo_profil} alt={userData.nom} />
                <AvatarFallback>{userData.nom.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold">{userData.nom} {userData.prenoms}</h2>
                <p className="text-sm text-gray-500">{userData.email}</p>
                {userData.nom_role && (
                  <p className="text-sm text-gray-500">Role: {userData.nom_role}</p>
                )}
              </div>
            </div>
            <div>
              {isOwnProfile ? (
                <Link to="/settings">
                  <Button variant="outline" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Ouvrir le menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleContactUser}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contacter
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleFollowUser}>
                      {isFollowing ? (
                        <>
                          <UserMinus className="mr-2 h-4 w-4" />
                          Ne plus suivre
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Suivre
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="flex justify-around mt-6">
            <div>
              <p className="text-center font-bold">{followersCount}</p>
              <p className="text-center text-gray-500">Abonnés</p>
            </div>
            <div>
              <p className="text-center font-bold">{followingCount}</p>
              <p className="text-center text-gray-500">Abonnements</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {showContactDialog && (
        <MessageDialog
          isOpen={showContactDialog}
          onClose={handleCloseContactDialog}
          recipient={{
            id: userData.id_utilisateur,
            name: `${userData.nom} ${userData.prenoms || ''}`
          }}
          subject="Contact depuis votre profil"
        />
      )}
    </div>
  );
};

export default Profile;
