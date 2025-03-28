
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageCircle, User, Settings, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-sm h-16 z-50">
      <div className="h-full max-w-md mx-auto px-4 flex items-center justify-around">
        <Link 
          to="/" 
          className={`bottom-nav-item ${isActive("/") ? "active" : ""}`}
        >
          <div className="relative">
            <Home size={20} strokeWidth={2} />
          </div>
          <span className="mt-1">Accueil</span>
        </Link>
        
        <Link 
          to="/terrain" 
          className={`bottom-nav-item ${isActive("/terrain") ? "active" : ""}`}
        >
          <div className="relative">
            <MapPin size={20} strokeWidth={2} />
          </div>
          <span className="mt-1">Terrain</span>
        </Link>
        
        <Link 
          to="/messages" 
          className={`bottom-nav-item ${isActive("/messages") ? "active" : ""}`}
        >
          <div className="relative">
            <MessageCircle size={20} strokeWidth={2} />
          </div>
          <span className="mt-1">Messages</span>
        </Link>
        
        <Link 
          to={user ? "/profile" : "/auth"} 
          className={`bottom-nav-item ${isActive("/profile") || isActive("/auth") ? "active" : ""}`}
        >
          <div className="relative">
            <User size={20} strokeWidth={2} />
          </div>
          <span className="mt-1">Profil</span>
        </Link>
        
        <Link 
          to="/settings" 
          className={`bottom-nav-item ${isActive("/settings") ? "active" : ""}`}
        >
          <div className="relative">
            <Settings size={20} strokeWidth={2} />
          </div>
          <span className="mt-1">Réglages</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
