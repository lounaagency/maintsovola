import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any | null>(null);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [subscriptionCount, setSubscriptionCount] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())
  const id = user?.id;

  useEffect(() => {
    if (id) {
      fetchProfile(id);
      fetchFollowerCount(id);
      fetchSubscriptionCount(id);
      fetchProjects(id);
      checkSubscription(id);
    }
  }, [id]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchProfile = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('*')
        .eq('id_utilisateur', id)
        .single();

      if (error) {
        throw error;
      }

      setUserProfile({
        ...data,
        id_utilisateur: data.id_utilisateur,
        // ...data,
      });
      setEditedProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowerCount = async (id: string) => {
    try {
      const { count: followerCount } = await supabase
        .rpc('get_follower_count', { user_id: id })
        .single();
      setFollowerCount(followerCount || 0);
    } catch (error) {
      console.error("Error fetching follower count:", error);
    }
  };

  const fetchSubscriptionCount = async (id: string) => {
    try {
      const { count: subscriptionCount } = await supabase
        .rpc('get_subscription_count', { user_id: id })
        .single();
      setSubscriptionCount(subscriptionCount || 0);
    } catch (error) {
      console.error("Error fetching subscription count:", error);
    }
  };

  const checkSubscription = async (profileId: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('abonnement')
        .select('*')
        .eq('id_abonne', user.id)
        .eq('id_suivi', profileId)
        .single();

      setIsSubscribed(!error && data !== null);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const fetchProjects = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('projet')
        .select('*')
        .eq('id_tantsaha', id);

      if (error) {
        throw error;
      }

      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleSubscription = async () => {
    if (!user || !userProfile) return;

    try {
      if (isSubscribed) {
        // Unsubscribe
        const { error } = await supabase
          .from('abonnement')
          .delete()
          .eq('id_abonne', user.id)
          .eq('id_suivi', userProfile.id_utilisateur);

        if (error) throw error;
        setIsSubscribed(false);
        setSubscriptionCount(prev => prev > 0 ? prev - 1 : 0);
        toast.success("Vous vous êtes désabonné de ce profil.");
      } else {
        // Subscribe
        await supabase
          .from('abonnement')
          .insert({
            id_abonne: user.id,
            id_suivi: userProfile.id_utilisateur
          });
        setIsSubscribed(true);
        setSubscriptionCount(prev => prev + 1);
        toast.success("Vous êtes maintenant abonné à ce profil.");
      }
    } catch (error) {
      console.error("Error toggling subscription:", error);
      toast.error("Une erreur s'est produite lors de la modification de l'abonnement.");
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('utilisateur')
        .update(editedProfile)
        .eq('id_utilisateur', id);

      if (error) {
        throw error;
      }

      setUserProfile(editedProfile);
      setIsEditing(false);
      toast.success("Profil mis à jour avec succès!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Une erreur s'est produite lors de la mise à jour du profil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Profil</h1>
        {userProfile && (
          <Button onClick={toggleSubscription}>
            {isSubscribed ? "Se désabonner" : "S'abonner"}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : userProfile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du profil</CardTitle>
              <CardDescription>
                {isEditing ? "Modifier vos informations personnelles" : "Vos informations personnelles"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      type="text"
                      id="nom"
                      name="nom"
                      value={editedProfile?.nom || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="prenoms">Prénoms</Label>
                    <Input
                      type="text"
                      id="prenoms"
                      name="prenoms"
                      value={editedProfile?.prenoms || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={editedProfile?.email || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      type="tel"
                      id="telephone"
                      name="telephone"
                      value={editedProfile?.telephone || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input
                      type="text"
                      id="adresse"
                      name="adresse"
                      value={editedProfile?.adresse || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={editedProfile?.bio || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={userProfile.photo_profil} alt={userProfile.nom} />
                      <AvatarFallback>{userProfile.nom?.charAt(0)}{userProfile.prenoms?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-lg font-semibold">{userProfile.nom} {userProfile.prenoms}</h2>
                      <p className="text-sm text-gray-500">{userProfile.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold">Téléphone:</span> {userProfile.telephone || 'Non renseigné'}
                    </div>
                    <div>
                      <span className="font-semibold">Adresse:</span> {userProfile.adresse || 'Non renseignée'}
                    </div>
                    <div>
                      <span className="font-semibold">Bio:</span> {userProfile.bio || 'Non renseignée'}
                    </div>
                    <div>
                      <span className="font-semibold">Abonnés:</span> {followerCount}
                    </div>
                    <div>
                      <span className="font-semibold">Abonnements:</span> {subscriptionCount}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              {isEditing ? (
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setEditedProfile(userProfile);
                    setIsEditing(false);
                  }}>
                    Annuler
                  </Button>
                  <Button onClick={saveProfile} disabled={loading}>
                    Enregistrer
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Modifier le profil
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Projects Section */}
          <Card>
            <CardHeader>
              <CardTitle>Vos Projets</CardTitle>
              <CardDescription>
                Aperçu de vos projets agricoles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <div key={project.id_projet} className="mb-4">
                      <Link to={`/projet?id=${project.id_projet}`} className="block">
                        <h3 className="font-semibold">{project.titre}</h3>
                        <p className="text-sm text-gray-500">
                          Financement: {project.montant_collecte || 0} / {project.cout_total} Ar
                        </p>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Aucun projet trouvé.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Profil non trouvé.
        </div>
      )}
    </div>
  );
};

export default Profile;
