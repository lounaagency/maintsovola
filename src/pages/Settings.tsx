
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
import { User, Phone, Upload, Plus, Trash2, Check, X } from "lucide-react";
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
  const [newPhone, setNewPhone] = useState({
    numero: "",
    type: "principal" as const,
    est_whatsapp: false,
    est_mobile_banking: false
  });

  useEffect(() => {
    if (profile) {
      setUserProfile(profile);
      setNom(profile.nom || "");
      setPrenoms(profile.prenoms || "");
      setProfileImagePreview(profile.photo_profil || null);
      setCoverImagePreview(profile.photo_couverture || null);
      fetchPhoneNumbers();
    }
  }, [profile]);

  const fetchPhoneNumbers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('telephone')
        .select('*')
        .eq('id_utilisateur', user.id);

      if (error) throw error;
      setTelephones(data || []);
    } catch (error) {
      console.error("Error fetching phone numbers:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les numéros de téléphone",
        variant: "destructive"
      });
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Update profile info
      const { error } = await supabase
        .from('utilisateur')
        .update({
          nom,
          prenoms
        })
        .eq('id_utilisateur', user.id);

      if (error) throw error;

const { data, error } = await supabase.storage
  .from('avatars')
  .upload('avatar.png', file, {
    cacheControl: '3600',
    upsert: true,
  });



      
      // Upload profile image if changed
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${user.id}-profile-${Date.now()}.${fileExt}`;

// Modification apportée pour bien uploader les photos de profils et mettre à jour la table utilisateur
        const { data, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, profileImage, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        // Récupérer l'URL publique correcte
        const publicUrl = supabase.storage.from('avatars').getPublicUrl(fileName);
        
        const { error: updateError } = await supabase
          .from('utilisateur')
          .update({ photo_profil: publicUrl.publicUrl })
          .eq('id_utilisateur', user.id);
         if (updateError) throw updateError; 
      }
      
      // Upload cover image if changed
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const coverFileName = `${user.id}-cover-${Date.now()}.${fileExt}`;

        const { data, error: uploadError } = await supabase.storage
          .from('covers')
          .upload(coverFileName, coverImage, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        // Récupérer l'URL publique correcte
        const publicUrl = supabase.storage.from('covers').getPublicUrl(coverFileName);
        
        const { error: updateError } = await supabase
          .from('utilisateur')
          .update({ photo_couverture: publicUrl.publicUrl })
          .eq('id_utilisateur', user.id);
        
        if (updateError) throw updateError;

      }
   //   await refreshProfile();

      
      toast({
        title: "Succès",
        description: "Votre profil a été mis à jour",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addPhoneNumber = async () => {
    if (!user || !newPhone.numero) return;
    
    try {
      const { data, error } = await supabase
        .from('telephone')
        .insert({
          id_utilisateur: user.id,
          numero: newPhone.numero,
          type: newPhone.type,
          est_whatsapp: newPhone.est_whatsapp,
          est_mobile_banking: newPhone.est_mobile_banking
        })
        .select();

      if (error) throw error;
      
      setTelephones([...telephones, data[0]]);
      setNewPhone({
        numero: "",
        type: "principal",
        est_whatsapp: false,
        est_mobile_banking: false
      });
      
      toast({
        title: "Succès",
        description: "Numéro de téléphone ajouté",
      });
    } catch (error) {
      console.error("Error adding phone number:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le numéro de téléphone",
        variant: "destructive"
      });
    }
  };

  const deletePhoneNumber = async (id: number) => {
    try {
      const { error } = await supabase
        .from('telephone')
        .delete()
        .eq('id_telephone', id);

      if (error) throw error;
      
      setTelephones(telephones.filter(phone => phone.id_telephone !== id));
      
      toast({
        title: "Succès",
        description: "Numéro de téléphone supprimé",
      });
    } catch (error) {
      console.error("Error deleting phone number:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le numéro de téléphone",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <p>Veuillez vous connecter pour accéder aux paramètres</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <motion.h1 
        className="text-3xl font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Paramètres du compte
      </motion.h1>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="account">Compte</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Photos de profil</CardTitle>
              <CardDescription>
                Mettez à jour votre photo de profil et votre photo de couverture.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Photo de couverture</Label>
                <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
                  {coverImagePreview && (
                    <img 
                      src={coverImagePreview} 
                      alt="Cover preview" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-2 right-2">
                    <Label htmlFor="cover-upload" className="cursor-pointer">
                      <div className="h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                        <Upload size={18} />
                      </div>
                      <input
                        id="cover-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverImageChange}
                      />
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Photo de profil</Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 bg-gray-100 rounded-full overflow-hidden">
                    {profileImagePreview && (
                      <img 
                        src={profileImagePreview} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-0 right-0">
                      <Label htmlFor="profile-upload" className="cursor-pointer">
                        <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                          <Upload size={14} />
                        </div>
                        <input
                          id="profile-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfileImageChange}
                        />
                      </Label>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Formats acceptés: JPG, PNG, GIF</p>
                    <p>Taille maximale: 2Mo</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos informations personnelles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input 
                    id="nom" 
                    value={nom} 
                    onChange={(e) => setNom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenoms">Prénoms</Label>
                  <Input 
                    id="prenoms" 
                    value={prenoms} 
                    onChange={(e) => setPrenoms(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={updateProfile} disabled={isLoading}>
                {isLoading ? "Mise à jour..." : "Enregistrer les modifications"}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Numéros de téléphone</CardTitle>
              <CardDescription>
                Gérez vos numéros de téléphone pour les communications et les transactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {telephones.map((phone) => (
                  <div key={phone.id_telephone} className="flex items-center justify-between border p-3 rounded-md">
                    <div className="flex items-center gap-3">
                      <Phone size={18} />
                      <div>
                        <p className="font-medium">{phone.numero}</p>
                        <div className="flex gap-2 text-xs">
                          <span className="bg-muted px-2 py-0.5 rounded">{phone.type}</span>
                          {phone.est_whatsapp && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">WhatsApp</span>}
                          {phone.est_mobile_banking && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Mobile Banking</span>}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deletePhoneNumber(phone.id_telephone!)}
                    >
                      <Trash2 size={18} className="text-red-500" />
                    </Button>
                  </div>
                ))}
                
                <div className="border p-4 rounded-md space-y-3">
                  <h3 className="font-medium">Ajouter un numéro</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="numero">Numéro</Label>
                      <Input 
                        id="numero" 
                        placeholder="03X XX XXX XX" 
                        value={newPhone.numero}
                        onChange={(e) => setNewPhone({...newPhone, numero: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <select 
                        id="type"
                        className="w-full border rounded-md p-2"
                        value={newPhone.type}
                        onChange={(e) => setNewPhone({
                          ...newPhone, 
                          type: e.target.value as 'principal' | 'whatsapp' | 'mobile_banking' | 'autre'
                        })}
                      >
                        <option value="principal">Principal</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="mobile_banking">Mobile Banking</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="est_whatsapp" 
                        checked={newPhone.est_whatsapp}
                        onChange={(e) => setNewPhone({...newPhone, est_whatsapp: e.target.checked})}
                      />
                      <Label htmlFor="est_whatsapp">WhatsApp</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="est_mobile_banking" 
                        checked={newPhone.est_mobile_banking}
                        onChange={(e) => setNewPhone({...newPhone, est_mobile_banking: e.target.checked})}
                      />
                      <Label htmlFor="est_mobile_banking">Mobile Banking</Label>
                    </div>
                  </div>
                  
                  <Button onClick={addPhoneNumber} disabled={!newPhone.numero}>
                    <Plus size={16} className="mr-2" />
                    Ajouter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du compte</CardTitle>
              <CardDescription>
                Gérez les paramètres de votre compte et de confidentialité.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">Cette section sera disponible prochainement.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
              <CardDescription>
                Personnalisez vos préférences de notification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">Cette section sera disponible prochainement.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
