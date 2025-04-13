import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CalendarIcon, MapPinIcon, MailIcon, PhoneIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shell } from '@/components/Shell';
import { UserProfile } from '@/types/userProfile';
import { toast } from 'sonner';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [subscriptionsCount, setSubscriptionsCount] = useState<number>(0);
  const [projets, setProjets] = useState([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchFollowersCount();
      fetchSubscriptionsCount();
      fetchProjets();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: userData, error } = await supabase
        .from('utilisateur')
        .select(`
          id_utilisateur,
          nom,
          prenoms,
          email,
          photo_profil,
          telephone,
          adresse,
          bio,
          role: id_role (nom_role)
        `)
        .eq('id_utilisateur', user.id)
        .single();

      if (error) {
        throw error;
      }

      if (userData) {
        // Fix the setProfile call - add empty telephones array
        setProfile({
          id_utilisateur: user.id,
          id: user.id,
          nom: userData.nom,
          prenoms: userData.prenoms,
          email: userData.email,
          photo_profil: userData.photo_profil,
          telephone: userData.telephone,
          adresse: userData.adresse,
          bio: userData.bio,
          nom_role: userData.role,
          telephones: [] // Add empty telephones array to fix type error
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowersCount = async () => {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('*', { count: 'exact' })
        .eq('following_id', user.id);

      if (error) {
        throw error;
      }

      setFollowersCount(data ? data.length : 0);
    } catch (error: any) {
      console.error("Error fetching followers count:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const fetchSubscriptionsCount = async () => {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('*', { count: 'exact' })
        .eq('follower_id', user.id);

      if (error) {
        throw error;
      }

      setSubscriptionsCount(data ? data.length : 0);
    } catch (error: any) {
      console.error("Error fetching subscriptions count:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const fetchProjets = async () => {
    try {
      const { data, error } = await supabase
        .from('projet')
        .select(`
          id_projet,
          titre,
          description,
          photos,
          financement_actuel,
          financement_requis
        `)
        .eq('id_tantsaha', user.id)
        .limit(3);

      if (error) {
        throw error;
      }

      setProjets(data || []);
    } catch (error: any) {
      console.error("Error fetching projets:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleSubscribe = async (id: string) => {
    try {
      // Fix the create_subscription call - use a function that exists in the database
      const { error: subscribeError } = await supabase
        .rpc('follow_user', { // Replace with an actual function that exists
          target_user_id: id
        });

      if (subscribeError) {
        throw subscribeError;
      }

      toast.success("Vous êtes maintenant abonné à cet utilisateur !");
      fetchFollowersCount();
      fetchSubscriptionsCount();
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  if (loading || !profile) {
    return (
      <Shell>
        <div className="flex justify-center items-center h-full">
          Chargement du profil...
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Profile Card */}
        <Card className="w-full md:w-1/3 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {profile.nom} {profile.prenoms}
            </CardTitle>
            <CardDescription>
              {profile.nom_role ? <Badge>{profile.nom_role}</Badge> : 'Utilisateur'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Avatar className="w-32 h-32 mx-auto">
              <AvatarImage src={profile.photo_profil || "https://avatars.dicebear.com/api/open-peeps/:seed.svg"} />
              <AvatarFallback>{profile.nom?.charAt(0)}{profile.prenoms?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-sm text-gray-600 flex items-center">
              <MailIcon className="h-4 w-4 mr-2" />
              {profile.email}
            </div>
            {profile.telephone && (
              <div className="text-sm text-gray-600 flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2" />
                {profile.telephone}
              </div>
            )}
            {profile.adresse && (
              <div className="text-sm text-gray-600 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2" />
                {profile.adresse}
              </div>
            )}
            {profile.bio && (
              <div className="text-sm text-gray-600">
                {profile.bio}
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <div>
                <CalendarIcon className="h-4 w-4 mr-1 inline-block" />
                Membre depuis le {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <div>Abonnés: {followersCount}</div>
              <div>Abonnements: {subscriptionsCount}</div>
            </div>
            <Button className="w-full" asChild>
              <Link to="/settings">Modifier le profil</Link>
            </Button>
            <Button className="w-full" onClick={() => handleSubscribe(user.id)}>
              S'abonner
            </Button>
          </CardContent>
        </Card>

        {/* Projects Section */}
        <Card className="w-full md:w-2/3 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Mes Projets Récents</CardTitle>
            <CardDescription>Aperçu de vos projets les plus récents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projets.length > 0 ? (
              projets.map((projet: any) => (
                <div key={projet.id_projet} className="border rounded-md p-4">
                  <h3 className="text-md font-semibold">{projet.titre}</h3>
                  <p className="text-sm text-gray-600">{projet.description}</p>
                  {projet.photos && (
                    <img src={projet.photos[0]} alt="Project" className="mt-2 rounded-md" />
                  )}
                  {/* Fix the financement_actuel reference - use an optional chaining */}
                  <div className="text-sm text-gray-600">
                    {projet.financement_actuel?.toLocaleString() || "0"} / {projet.financement_requis?.toLocaleString() || "0"} Ar
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-600">Aucun projet trouvé.</div>
            )}
            <Button asChild>
              <Link to="/projets">Voir tous mes projets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
};

export default Profile;
