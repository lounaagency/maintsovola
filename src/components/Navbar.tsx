
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MapPin, LogOut, Settings, Bell, User, FileText, Wifi, WifiOff, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "./UserAvatar";
import Notifications from "./Notifications";
import { useIsMobile } from "@/hooks/use-mobile";
import Logo from "./Logo";
import { WeatherAlertNotification } from "./weather/WeatherAlertNotification";
import MessageBadge from "./MessageBadge";
import { useOffline } from "@/hooks/use-offline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { isOnline } = useOffline();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-border shadow-sm h-14 md:h-16 z-50">
      <div className="h-full max-w-6xl mx-auto px-6 lg:space-x-6 md:px-4 flex items-center justify-between">
        {/* Logo - now links to home (/) instead of feed */}
        <div className="flex items-center">
          <Logo 
            size={isMobile ? "sm" : "sm"} 
            showText={!isMobile} 
            imageClassName="h-12 w-auto"
            to="/"
          />
          
          {/* Network status indicator */}
          <div className="ml-2">
            {isOnline ? (
              <div className="flex items-center text-green-600 text-xs">
                <Wifi size={14} className="mr-1" />
                {!isMobile && <span>En ligne</span>}
              </div>
            ) : (
              <div className="flex items-center text-amber-600 text-xs">
                <WifiOff size={14} className="mr-1" />
                {!isMobile && <span>Hors ligne</span>}
              </div>
            )}
          </div>
        </div>
        
        {/* Central Navigation Icons */}
          <Link 
            to="/feed" 
            className={`p-2 rounded-md ${isActive("/feed") ? "text-green-600 bg-gray-100" : "text-gray-700 hover:bg-gray-100"}`}
            title="Accueil"
          >
            <Home size={22} />
          </Link>
          
          <Link 
            to="/terrain" 
            className={`p-2 rounded-md ${isActive("/terrain") ? "text-green-600 bg-gray-100" : "text-gray-700 hover:bg-gray-100"}`}
            title="Terrains"
          > 
            <MapPin size={22} />
          </Link>

          <Link 
            to="/projects" 
            className={`p-2 rounded-md ${isActive("/projects") ? "text-green-600 bg-gray-100" : "text-gray-700 hover:bg-gray-100"}`}
            title="Projets"
          >
            <FileText size={22} />
          </Link>
          
        {profile?.nom_role === "financier" && (
          <Link 
            to="/financier" 
            className={`p-2 rounded-md ${isActive("/financier") ? "text-green-600 bg-gray-100" : "text-gray-700 hover:bg-gray-100"}`}
            title="Finances"
          >
            <DollarSign size={22} />
          </Link> 
        )}
          <MessageBadge isActive={isActive("/messages")} />
          
          <Notifications />
          
          <WeatherAlertNotification />
        
        {/* User profile dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 focus:outline-none">
              <UserAvatar
                src={profile?.photo_profil}
                alt={profile?.nom || "Profile"}
                size="sm"
                status="online"
              />
              {!isMobile && (
                <span className="hidden md:inline-block text-sm font-medium truncate max-w-[120px]">
                  {profile?.nom} {profile?.prenoms}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center space-x-2 cursor-pointer w-full">
                <User size={16} />
                <span>Mon Profil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center space-x-2 cursor-pointer w-full">
                <Settings size={16} />
                <span>Réglages</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="flex items-center space-x-2 cursor-pointer">
              <LogOut size={16} />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
