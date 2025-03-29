
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  Lock, 
  Shield, 
  EyeOff, 
  MessageCircle, 
  HelpCircle, 
  LogOut,
  User,
  ChevronRight
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import UserAvatar from "@/components/UserAvatar";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Settings: React.FC = () => {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    prenoms: "",
    email: "",
    bio: "",
    telephones: [] as {
      id_telephone?: number;
      numero: string;
      type: 'principal' | 'whatsapp' | 'mobile_banking' | 'autre';
      est_whatsapp: boolean;
      est_mobile_banking: boolean;
    }[]
  });
  
  useEffect(() => {
    if (profile) {
      setFormData({
        nom: profile.nom || "",
        prenoms: profile.prenoms || "",
        email: profile.email || "",
        bio: "",
        telephones: []
      });
      
      // Charger les téléphones
      fetchTelephones();
    }
  }, [profile]);
  
  const fetchTelephones = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('telephone')
        .select('*')
        .eq('id_utilisateur', user.id);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          telephones: data.map(tel => ({
            id_telephone: tel.id_telephone,
            numero: tel.numero,
            type: tel.type || 'principal',
            est_whatsapp: tel.est_whatsapp || false,
            est_mobile_banking: tel.est_mobile_banking || false
          }))
        }));
      } else {
        // Ajouter un téléphone vide par défaut
        setFormData(prev => ({
          ...prev,
          telephones: [{
            numero: "",
            type: 'principal',
            est_whatsapp: false,
            est_mobile_banking: false
          }]
        }));
      }
    } catch (error) {
      console.error("Erreur lors du chargement des téléphones:", error);
      toast.error("Impossible de charger les numéros de téléphone");
    }
  };
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    
    try {
      // Mettre à jour le profil utilisateur
      const { error: profileError } = await supabase
        .from('utilisateur')
        .update({
          nom: formData.nom,
          prenoms: formData.prenoms
        })
        .eq('id_utilisateur', user.id);
        
      if (profileError) throw profileError;
      
      // Gérer les téléphones
      for (const telephone of formData.telephones) {
        if (telephone.id_telephone) {
          // Mettre à jour un téléphone existant
          const { error: telError } = await supabase
            .from('telephone')
            .update({
              numero: telephone.numero,
              type: telephone.type,
              est_whatsapp: telephone.est_whatsapp,
              est_mobile_banking: telephone.est_mobile_banking
            })
            .eq('id_telephone', telephone.id_telephone);
            
          if (telError) throw telError;
        } else if (telephone.numero.trim()) {
          // Créer un nouveau téléphone
          const { error: telError } = await supabase
            .from('telephone')
            .insert({
              id_utilisateur: user.id,
              numero: telephone.numero,
              type: telephone.type,
              est_whatsapp: telephone.est_whatsapp,
              est_mobile_banking: telephone.est_mobile_banking
            });
            
          if (telError) throw telError;
        }
      }
      
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast.error("Impossible de mettre à jour le profil");
    } finally {
      setSaving(false);
    }
  };
  
  const addPhoneNumber = () => {
    setFormData(prev => ({
      ...prev,
      telephones: [
        ...prev.telephones,
        {
          numero: "",
          type: 'autre',
          est_whatsapp: false,
          est_mobile_banking: false
        }
      ]
    }));
  };
  
  const removePhoneNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      telephones: prev.telephones.filter((_, i) => i !== index)
    }));
  };
  
  const updatePhoneNumber = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const telephones = [...prev.telephones];
      telephones[index] = {
        ...telephones[index],
        [field]: value
      };
      return {
        ...prev,
        telephones
      };
    });
  };
  
  const settingsGroups = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Personal Information", action: () => {} },
        { icon: Lock, label: "Security", action: () => {} },
        { icon: Shield, label: "Privacy", action: () => {} },
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", action: () => {} },
        { icon: MessageCircle, label: "Chat & Messages", action: () => {} },
        { icon: EyeOff, label: "Blocking", action: () => {} },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", action: () => {} },
        { icon: LogOut, label: "Log Out", action: () => {}, danger: true },
      ]
    }
  ];
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </header>
      
      <div className="space-y-6 mb-8">
        <div className="flex items-center">
          <UserAvatar
            src={profile?.photo_profil || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200"}
            alt={profile?.nom || "User"}
            size="lg"
          />
          
          <div className="ml-4">
            <p className="font-semibold">{profile?.nom} {profile?.prenoms || ''}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
          
          <Button variant="outline" size="sm" className="ml-auto">
            Change
          </Button>
        </div>
        
        <form onSubmit={handleSaveProfile}>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input 
                id="name" 
                value={formData.nom} 
                onChange={(e) => setFormData({...formData, nom: e.target.value})} 
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="prenoms">Prénoms</Label>
              <Input 
                id="prenoms" 
                value={formData.prenoms} 
                onChange={(e) => setFormData({...formData, prenoms: e.target.value})} 
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email} 
                readOnly 
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Numéros de téléphone</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addPhoneNumber}
                >
                  Ajouter
                </Button>
              </div>
              
              {formData.telephones.map((telephone, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-md">
                  <div className="flex justify-between items-start">
                    <Label htmlFor={`phone-${index}`}>Numéro {index + 1}</Label>
                    {formData.telephones.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removePhoneNumber(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                  
                  <Input
                    id={`phone-${index}`}
                    placeholder="Ex: 034 12 345 67"
                    value={telephone.numero}
                    onChange={(e) => updatePhoneNumber(index, 'numero', e.target.value)}
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`whatsapp-${index}`}
                        checked={telephone.est_whatsapp}
                        onChange={(e) => updatePhoneNumber(index, 'est_whatsapp', e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`whatsapp-${index}`}>WhatsApp</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`banking-${index}`}
                        checked={telephone.est_mobile_banking}
                        onChange={(e) => updatePhoneNumber(index, 'est_mobile_banking', e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`banking-${index}`}>Mobile Banking</Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-2">
              <Button type="submit" className="w-full bg-maintso hover:bg-maintso-600" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </div>
          </div>
        </form>
      </div>
      
      <Separator className="my-6" />
      
      <motion.div 
        className="space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {settingsGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500">{group.title}</h3>
            
            <div className="space-y-1">
              {group.items.map((settingItem) => (
                <motion.div
                  key={settingItem.label}
                  variants={item}
                  whileTap={{ scale: 0.98 }}
                  onClick={settingItem.action}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center">
                    <settingItem.icon 
                      size={18} 
                      className={settingItem.danger ? "text-red-500" : "text-gray-500"} 
                    />
                    <span 
                      className={`ml-3 ${settingItem.danger ? "text-red-500" : "text-gray-800"}`}
                    >
                      {settingItem.label}
                    </span>
                  </div>
                  
                  {!settingItem.danger && <ChevronRight size={18} className="text-gray-400" />}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Settings;
