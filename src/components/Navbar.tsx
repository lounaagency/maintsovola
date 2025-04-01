
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageCircle, MapPin, Menu, Settings, Bell, ChevronDown, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "./UserAvatar";
import Notifications from "./Notifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Navigation items for mobile menu and desktop navigation
  const renderNavItems = () => (
    <>
      <Link 
        to="/" 
        className={`nav-item ${isActive("/") || isActive("/feed") ? "active" : ""}`}
      >
        <Home size={20} strokeWidth={isMobile ? 1.5 : 2} />
        <span className="text-sm">Accueil</span>
      </Link>
      
      <Link 
        to="/terrain" 
        className={`nav-item ${isActive("/terrain") ? "active" : ""}`}
      >
        <MapPin size={20} strokeWidth={isMobile ? 1.5 : 2} />
        <span className="text-sm">Terrain</span>
      </Link>
      
      <Link 
        to="/messages" 
        className={`nav-item ${isActive("/messages") ? "active" : ""}`}
      >
        <MessageCircle size={20} strokeWidth={isMobile ? 1.5 : 2} />
        <span className="text-sm">Messages</span>
      </Link>
      
      <Link 
        to="/settings" 
        className={`nav-item ${isActive("/settings") ? "active" : ""}`}
      >
        <Settings size={20} strokeWidth={isMobile ? 1.5 : 2} />
        <span className="text-sm">Réglages</span>
      </Link>
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-border shadow-sm h-14 md:h-16 z-50">
      <div className="h-full max-w-6xl mx-auto px-2 md:px-4 flex items-center justify-between">
        {/* Logo and brand - Always visible but smaller */}
        <div className="flex items-center">
          <Link to="/" className="text-lg font-bold text-green-600">
            Maintso Vola
          </Link>
        </div>
        
        {/* Central Navigation Icons - Desktop */}
        <div className="hidden md:flex items-center justify-center space-x-2 lg:space-x-6 flex-1 mx-4">
          <Link 
            to="/" 
            className={`p-2 rounded-md ${isActive("/") || isActive("/feed") ? "text-green-600 bg-gray-100" : "text-gray-700 hover:bg-gray-100"}`}
          >
            <Home size={22} />
          </Link>
          
          <Link 
            to="/terrain" 
            className={`p-2 rounded-md ${isActive("/terrain") ? "text-green-600 bg-gray-100" : "text-gray-700 hover:bg-gray-100"}`}
          >
            <MapPin size={22} />
          </Link>
          
          <Link 
            to="/messages" 
            className={`p-2 rounded-md ${isActive("/messages") ? "text-green-600 bg-gray-100" : "text-gray-700 hover:bg-gray-100"}`}
          >
            <MessageCircle size={22} />
          </Link>
          
          <Notifications />
        </div>
        
        {/* User controls - Always visible */}
        <div className="flex items-center space-x-1 md:space-x-3">
          {/* Mobile menu trigger */}
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-1 md:p-2 text-gray-700 hover:bg-gray-100 rounded-full">
                  <Menu size={24} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[250px] sm:w-[300px] pt-8">
                <div className="flex flex-col space-y-6">
                  <Link to="/" className="text-xl font-bold text-green-600 mb-4">
                    Maintso Vola
                  </Link>
                
                  <div className="flex flex-col space-y-5">
                    {renderNavItems()}
                  </div>
                  
                  <div className="pt-4 mt-4 border-t">
                    <Notifications />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          {/* Mobile notifications button */}
          {isMobile && (
            <Notifications />
          )}
          
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
                  <>
                    <span className="hidden md:inline-block text-sm font-medium">
                      {profile?.nom} {profile?.prenoms}
                    </span>
                    <ChevronDown size={16} className="hidden md:inline-block text-gray-500" />
                  </>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
