
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
  const [saving, setSaving] = useState(false);
  
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate saving
    setTimeout(() => {
      setSaving(false);
      toast.success("Profile updated successfully!");
    }, 1500);
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
            src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200"
            alt="Alex Morgan"
            size="lg"
          />
          
          <div className="ml-4">
            <p className="font-semibold">Alex Morgan</p>
            <p className="text-sm text-gray-500">@alexmorgan</p>
          </div>
          
          <Button variant="outline" size="sm" className="ml-auto">
            Change
          </Button>
        </div>
        
        <form onSubmit={handleSaveProfile}>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" defaultValue="Alex Morgan" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="alexmorgan" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                rows={3}
                defaultValue="Product Designer & Developer | Creating digital experiences that people love"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="alex@example.com" />
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="marketing" className="text-sm font-medium text-gray-700">
                Receive marketing emails
              </Label>
              <Switch id="marketing" defaultChecked />
            </div>
            
            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
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
              {group.items.map((item) => (
                <motion.div
                  key={item.label}
                  variants={item}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.action}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center">
                    <item.icon 
                      size={18} 
                      className={item.danger ? "text-red-500" : "text-gray-500"} 
                    />
                    <span 
                      className={`ml-3 ${item.danger ? "text-red-500" : "text-gray-800"}`}
                    >
                      {item.label}
                    </span>
                  </div>
                  
                  {!item.danger && <ChevronRight size={18} className="text-gray-400" />}
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
