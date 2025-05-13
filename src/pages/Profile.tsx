import React, { useState, useEffect } from "react";
import { useParams, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ProjectFeed from "@/components/ProjectFeed";
import { ProjectFilter } from "@/hooks/use-project-data";

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newNom, setNewNom] = useState("");
  const [newPrenoms, setNewPrenoms] = useState("");
  const [newBio, setNewBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState<ProjectFilter>({});

  useEffect(() => {
    const newFilters: ProjectFilter = {};
    
    if (searchParams.has('id_projet')) {
      newFilters.projectId = searchParams.get('id_projet') || undefined;
    }
    
    setFilters(newFilters);
  }, [searchParams]);

  useEffect(() => {
    if (profile) {
      setNewNom(profile.nom);
      setNewPrenoms(profile.prenoms || "");
      setNewBio(profile.bio || "");
      setAvatarUrl(profile.photo_profil || null);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (id && user && id !== user.id) {
      setEditing(false);
    } else if (user) {
      setEditing(true);
    }
  }, [id, user]);

  if (!user) {
    return <Navigate to={`/auth${location.search}`} replace />;
  }

  if (loading) {
    return <div className="text-center mt-8">Chargement du profil...</div>;
  }

  const isCurrentUserProfile = user.id === id;

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const updates = {
        id: user.id,
        nom: newNom,
        prenoms: newPrenoms,
        bio: newBio,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("utilisateur").upsert(updates, {
        returning: "minimal", // Do not return values after inserting
      });

      if (error) {
        throw error;
      }

      await updateProfile();
      toast.success("Profil mis à jour avec succès!");
      setEditing(false);
    } catch (error: any) {
      toast.error(`Erreur lors de la mise à jour du profil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: getUrl } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicURL = getUrl.publicUrl;

      const { error: updateError } = await supabase
        .from("utilisateur")
        .update({ photo_profil: publicURL })
        .eq("id_utilisateur", user.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicURL);
      await updateProfile();
      toast.success("Avatar mis à jour!");
    } catch (error: any) {
      toast.error(`Erreur lors du chargement de l'avatar: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  const handleFilterChange = (newFilters: ProjectFilter) => {
    const params = new URLSearchParams();
    
    if (newFilters.projectId) {
      params.set('id_projet', String(newFilters.projectId));
    }
    
    setSearchParams(params);
  };

  return (
    <div className="container mx-auto mt-8 p-4">
      <div className="md:flex md:items-center md:justify-between">
        <div className="md:flex md:items-center">
          <Avatar className="h-24 w-24">
            {avatarUrl && <img src={avatarUrl} alt="Avatar" className="object-cover" />}
          </Avatar>
          <div className="ml-4">
            <h1 className="text-2xl font-semibold">{profile?.nom} {profile?.prenoms}</h1>
            <p className="text-gray-500">@{profile?.username}</p>
          </div>
        </div>

        {isCurrentUserProfile && (
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            {editing ? "Voir le profil" : "Modifier le profil"}
          </Button>
        )}
      </div>

      <div className="mt-6">
        {editing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="nom">Nom</Label>
              <Input
                type="text"
                id="nom"
                value={newNom}
                onChange={(e) => setNewNom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="prenoms">Prénoms</Label>
              <Input
                type="text"
                id="prenoms"
                value={newPrenoms}
                onChange={(e) => setNewPrenoms(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="avatar">Changer l'avatar</Label>
              <Input type="file" id="avatar" accept="image/*" onChange={handleAvatarChange} />
              {uploading && <div className="mt-2">Téléchargement...</div>}
            </div>
            <Button onClick={handleUpdateProfile} disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </div>
        ) : (
          <>
            <p className="text-gray-700">{profile?.bio || "Aucune bio"}</p>
            <ProjectFeed
              filters={{ ...filters, userId: id }}
              showFilters={false}
              showFollowingTab={false}
              title="Projets de cet agriculteur"
              onFilterChange={handleFilterChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
