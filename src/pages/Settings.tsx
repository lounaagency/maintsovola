import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserTelephone } from "@/types/userProfile";
import { motion } from "framer-motion";
import { User, Phone, Upload, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [telephones, setTelephones] = useState<UserTelephone[]>([]);
  
  useEffect(() => {
    if (profile) {
      setUserProfile(profile);
      setNom(profile.nom || "");
      setPrenoms(profile.prenoms || "");
      setProfileImagePreview(profile.photo_profil || null);
      setCoverImagePreview(profile.photo_couverture || null);
    }
  }, [profile]);

  const uploadImage = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${path}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(path === 'profile' ? 'avatars' : 'covers')
      .upload(fileName, file, { upsert: true });
    
    if (error) throw error;
    return supabase.storage.from(path === 'profile' ? 'avatars' : 'covers').getPublicUrl(fileName).data.publicUrl;
  };

  const updateProfile = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      let profileImageUrl = profile?.photo_profil;
      let coverImageUrl = profile?.photo_couverture;

      if (profileImage) {
        profileImageUrl = await uploadImage(profileImage, "profile");
      }
      if (coverImage) {
        coverImageUrl = await uploadImage(coverImage, "cover");
      }

      const { error } = await supabase.from('utilisateur').update({
        nom,
        prenoms,
        photo_profil: profileImageUrl,
        photo_couverture: coverImageUrl,
      }).eq('id_utilisateur', user.id);

      if (error) throw error;
      await refreshProfile();
      toast({ title: "Succès", description: "Votre profil a été mis à jour" });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le profil", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <motion.h1 className="text-3xl font-bold mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        Paramètres du compte
      </motion.h1>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Photos de profil</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Photo de couverture</Label>
              <input type="file" accept="image/*" onChange={(e) => e.target.files && setCoverImage(e.target.files[0])} />
              <Label>Photo de profil</Label>
              <input type="file" accept="image/*" onChange={(e) => e.target.files && setProfileImage(e.target.files[0])} />
            </CardContent>
            <CardFooter>
              <Button onClick={updateProfile} disabled={isLoading}>{isLoading ? "Mise à jour..." : "Enregistrer"}</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
