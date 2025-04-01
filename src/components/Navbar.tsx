
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MapPin, MessageCircle, Settings, Bell, ChevronDown, User, LogOut } from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  
  const handleLogout = async () => {
    await signOut();
  };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-border shadow-sm h-14 md:h-16 z-50">
      <div className="h-full max-w-6xl mx-auto px-2 md:px-4 flex items-center justify-between">
        {/* Logo - Smaller */}
        <Link to="/" className="text-base font-bold text-green-600">
          Maintso Vola
        </Link>
        
        {/* Central Navigation Icons */}
        <div className="flex items-center justify-center space-x-4 lg:space-x-8">
          <Link 
            to="/" 
            className={cn(
              "p-2 rounded-full transition-colors", 
              isActive("/") ? "bg-gray-100 text-green-600" : "text-gray-600 hover:bg-gray-100"
            )}
            title="Accueil"
          >
            <Home size={22} />
          </Link>
          
          <Link 
            to="/terrain" 
            className={cn(
              "p-2 rounded-full transition-colors", 
              isActive("/terrain") ? "bg-gray-100 text-green-600" : "text-gray-600 hover:bg-gray-100"
            )}
            title="Terrains"
          >
            <MapPin size={22} />
          </Link>
          
          <Link 
            to="/messages" 
            className={cn(
              "p-2 rounded-full transition-colors", 
              isActive("/messages") ? "bg-gray-100 text-green-600" : "text-gray-600 hover:bg-gray-100"
            )}
            title="Messages"
          >
            <MessageCircle size={22} />
          </Link>
          
          <Notifications />
        </div>
        
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 focus:outline-none">
              <UserAvatar
                src={profile?.photo_profil}
                alt={profile?.nom || "Profile"}
                size="sm"
                status="online"
              />
              {!isMobile && profile && (
                <span className="hidden md:inline-block text-sm font-medium">
                  {profile.nom} {profile.prenoms}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
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
            <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 cursor-pointer">
              <LogOut size={16} />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Mobile Menu */}
      {isMobile && (
        <Sheet>
          <SheetTrigger className="md:hidden fixed bottom-4 right-4 bg-green-600 text-white p-3 rounded-full shadow-lg">
            <div className="h-6 w-6 flex flex-col items-center justify-center gap-1.5">
              <span className="sr-only">Menu</span>
              <span className="block w-5 h-0.5 bg-white"></span>
              <span className="block w-5 h-0.5 bg-white"></span>
              <span className="block w-5 h-0.5 bg-white"></span>
            </div>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] sm:w-[300px]">
            <div className="flex flex-col h-full">
              <div className="py-6">
                <div className="flex items-center space-x-3 mb-6">
                  <UserAvatar
                    src={profile?.photo_profil}
                    alt={profile?.nom || "Profile"}
                    size="md"
                  />
                  <div>
                    <p className="font-medium">{profile?.nom} {profile?.prenoms}</p>
                    <p className="text-sm text-gray-500">{profile?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100"
                  >
                    <User size={20} />
                    <span>Mon Profil</span>
                  </Link>
                  
                  <Link 
                    to="/settings" 
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100"
                  >
                    <Settings size={20} />
                    <span>Réglages</span>
                  </Link>
                </div>
              </div>
              
              <div className="mt-auto">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 text-red-600"
                >
                  <LogOut size={20} />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </nav>
  );
};

export default Navbar;
