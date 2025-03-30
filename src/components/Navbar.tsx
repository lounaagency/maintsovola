
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageCircle, User, Settings, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "./UserAvatar";
import Notifications from "./Notifications";

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-border shadow-sm h-16 z-50">
      <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
        {/* Logo and brand */}
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold text-green-600">
            Maintso Vola
          </Link>
        </div>
        
        {/* Main navigation */}
        <div className="flex items-center justify-center space-x-6">
          <Link 
            to="/" 
            className={`nav-item ${isActive("/") || isActive("/feed") ? "active" : ""}`}
          >
            <Home size={20} strokeWidth={2} />
            <span className="text-sm">Accueil</span>
          </Link>
          
          <Link 
            to="/terrain" 
            className={`nav-item ${isActive("/terrain") ? "active" : ""}`}
          >
            <MapPin size={20} strokeWidth={2} />
            <span className="text-sm">Terrain</span>
          </Link>
          
          <Link 
            to="/messages" 
            className={`nav-item ${isActive("/messages") ? "active" : ""}`}
          >
            <MessageCircle size={20} strokeWidth={2} />
            <span className="text-sm">Messages</span>
          </Link>
          
          <Link 
            to="/settings" 
            className={`nav-item ${isActive("/settings") ? "active" : ""}`}
          >
            <Settings size={20} strokeWidth={2} />
            <span className="text-sm">Réglages</span>
          </Link>
        </div>
        
        {/* User controls */}
        <div className="flex items-center space-x-2">
          <Notifications />
          
          <Link to="/profile" className="flex items-center space-x-2 pl-2">
            <UserAvatar
              src={profile?.photo_profil}
              alt={profile?.nom || "Profile"}
              size="sm"
              status="online"
            />
            <span className="text-sm font-medium hidden md:inline-block">
              {profile?.nom} {profile?.prenoms}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
