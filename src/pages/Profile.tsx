import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { TerrainData } from "@/types/terrain";
import ProjectEditDialog from "@/components/ProjectEditDialog";

const subscriptionSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { profileUserId } = useParams<{ profileUserId: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCurrentUserProfile, setIsCurrentUserProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [subscriptionsCount, setSubscriptionsCount] = useState(0);
  const [followActionInProgress, setFollowActionInProgress] = useState(false);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profileUserId) {
      setIsCurrentUserProfile(user.id === profileUserId);
    } else {
      setIsCurrentUserProfile(true);
    }
  }, [user, profileUserId, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserProjects();
    }
  }, [user]);

  useEffect(() => {
    if (user && profileUserId) {
      fetchFollowState();
      fetchFollowersCount();
      fetchSubscriptionsCount();
    }
  }, [user, profileUserId]);

  // Fix the telephone property access
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const { data, error } = await supabase
        .from('utilisateur')
        .select('*')
        .eq('id_utilisateur', user.id)
        .single();

      if (error) throw error;

      if (data) {
        // Fetch telephones separately
        const { data: telephones, error: telephoneError } = await supabase
          .from('telephone')
          .select('*')
          .eq('id_utilisateur', user.id);

        if (telephoneError) throw telephoneError;

        setProfile({
          ...data,
          telephones: telephones || []
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProjects = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('projet')
        .select('*')
        .eq('id_tantsaha', user.id);

      if (error) throw error;

      setUserProjects(data || []);
    } catch (error) {
      console.error('Error fetching user projects:', error);
    }
  };

  const fetchFollowState = async () => {
    try {
      if (!user || !profileUserId) return;

      const { data, error } = await supabase
        .from('abonnement')
        .select('*')
        .eq('id_suivi', profileUserId)
        .eq('id_abonne', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error fetching follow state:', error);
    }
  };

  // Fix the RPC calls
  const fetchFollowersCount = async () => {
    try {
      const { data, error } = await supabase
        .rpc('count_followers', { user_id: user?.id });

      if (error) throw error;
      setFollowersCount(data || 0);
    } catch (error) {
      console.error('Error fetching followers count:', error);
    }
  };

  const fetchSubscriptionsCount = async () => {
    try {
      const { data, error } = await supabase
        .rpc('count_subscriptions', { user_id: user?.id });

      if (error) throw error;
      setSubscriptionsCount(data || 0);
    } catch (error) {
      console.error('Error fetching subscriptions count:', error);
    }
  };

  const handleViewProjectDetails = (project: any) => {
    setSelectedProject(project);
    setShowProjectDialog(true);
  };

  const handleCloseProjectDialog = () => {
    setShowProjectDialog(false);
    setSelectedProject(null);
  };

  // Fix the create_subscription RPC call
  const handleFollow = async () => {
    try {
      setFollowActionInProgress(true);
      if (!isFollowing) {
        const { error } = await supabase
          .from('abonnement')
          .insert({
            id_suivi: profileUserId,
            id_abonne: user?.id
          });

        if (error) throw error;
      
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      } else {
        const { error } = await supabase
          .from('abonnement')
          .delete()
          .eq('id_suivi', profileUserId)
          .eq('id_abonne', user?.id);

        if (error) throw error;
      
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast.error("Une erreur est survenue");
    } finally {
      setFollowActionInProgress(false);
    }
  };

  const handleAddProject = () => {
    setSelectedProject(null);
    setShowProjectDialog(true);
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setShowProjectDialog(true);
  };

  const handleProjectSubmitSuccess = () => {
    fetchUserProjects();
    handleCloseProjectDialog();
  };

  return (
    <div className="container mx-auto py-6">
      {loading ? (
        <div className="flex justify-center items-center h-48">
          Chargement du profil...
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>{profile?.nom?.charAt(0)}{profile?.prenoms?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{profile?.nom} {profile?.prenoms}</h1>
                <p className="text-sm text-gray-500">{profile?.email}</p>
              </div>
            </div>
            {!isCurrentUserProfile && (
              <Button
                variant="outline"
                disabled={followActionInProgress}
                onClick={handleFollow}
              >
                {isFollowing ? "Se désabonner" : "S'abonner"}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <h2 className="text-lg font-medium mb-2">Informations</h2>
              <p>Role: {profile?.nom_role}</p>
              <p>Téléphone: {profile?.telephones?.map((tel: any) => tel.numero).join(', ') || 'Non renseigné'}</p>
              <p>Abonnés: {followersCount}</p>
              <p>Abonnements: {subscriptionsCount}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <h2 className="text-lg font-medium mb-2">Projets</h2>
              <Button variant="outline" size="sm" onClick={handleAddProject}>
                Ajouter un projet
              </Button>
              <ScrollArea className="h-[200px] mt-3">
                {userProjects.length > 0 ? (
                  // Fix the financement_actuel property access in project listings
                  userProjects.map((project) => (
                    <div key={project.id_projet} className="p-4 border rounded-lg">
                      <h3 className="text-lg font-medium">{project.titre}</h3>
                      <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          {/* Use optional chaining and default to 0 */}
                          Financement: {project.financement_actuel || 0}/{project.cout_total || 0} Ar
                        </span>
                        <Button variant="outline" size="sm" onClick={() => handleViewProjectDetails(project)}>
                          Détails
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Aucun projet trouvé.</p>
                )}
              </ScrollArea>
            </div>
          </div>
        </>
      )}

      <ProjectEditDialog
        isOpen={showProjectDialog}
        onClose={handleCloseProjectDialog}
        project={selectedProject}
        onSubmitSuccess={handleProjectSubmitSuccess}
        userId={user?.id || ""}
      />
    </div>
  );
};

export default Profile;
