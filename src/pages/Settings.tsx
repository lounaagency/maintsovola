import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserTelephone } from "@/types/userProfile";
import { Loader2 } from "lucide-react";

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setUserProfile(profile);
      setName(`${profile.nom} ${profile.prenoms || ''}`);
      setPhone(profile.telephone || "");
      setAddress(profile.adresse || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("utilisateur")
        .update({
          adresse: address,
          bio: bio,
        })
        .eq("id_utilisateur", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      await refreshProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhone = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create a UserTelephone object with all required properties
      const telefono: UserTelephone = {
        id_telephone: 0, // This will be assigned by the DB
        id_utilisateur: user.id,
        numero: phone,
        type: "principal",
        est_whatsapp: false,
        est_mobile_banking: false,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString()
      };

      const { data: existingPhone, error: selectError } = await supabase
        .from('telephone')
        .select('*')
        .eq('id_utilisateur', user.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      if (existingPhone) {
        const { error: updateError } = await supabase
          .from('telephone')
          .update({ numero: phone })
          .eq('id_utilisateur', user.id);

        if (updateError) throw updateError;
        toast.success("Phone number updated successfully!");
      } else {
        const { error: insertError } = await supabase
          .from("telephone")
          .insert([telefono]);

        if (insertError) throw insertError;
        toast.success("Phone number added successfully!");
      }

      await refreshProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update phone number");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              type="text"
              id="name"
              value={name}
              disabled
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone Number
            </Label>
            <Input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="col-span-3"
            />
            <Button
              variant="outline"
              className="col-start-4"
              onClick={handleUpdatePhone}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                "Update Phone"
              )}
            </Button>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Address
            </Label>
            <Input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bio" className="text-right">
              Bio
            </Label>
            <Input
              type="text"
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="col-span-3"
            />
            <Button
              variant="outline"
              className="col-start-4"
              onClick={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                "Update Profile"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
