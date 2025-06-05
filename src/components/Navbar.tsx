import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, User, Settings, DollarSign } from "lucide-react";
import Logo from "./Logo";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Logo />
            
            {/* Navigation Links */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-8">
              <Link
                to="/feed"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === "/feed"
                    ? "text-primary bg-primary/10"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Flux
              </Link>
              <Link
                to="/terrain"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === "/terrain"
                    ? "text-primary bg-primary/10"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Terrains
              </Link>
              <Link
                to="/projects"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === "/projects"
                    ? "text-primary bg-primary/10"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Projets
              </Link>
              
              {/* Lien Financier - visible uniquement pour les utilisateurs financiers */}
              {profile?.nom_role === "financier" && (
                <Link
                  to="/financier"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === "/financier"
                      ? "text-primary bg-primary/10"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Financier
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Profile Dropdown */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.photo_profil || `https://avatar.vercel.sh/${user?.email}.png`} alt={user?.email || "Avatar"} />
                      <AvatarFallback>{profile?.nom?.[0]}{profile?.prenoms?.[0]}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{profile?.nom} {profile?.prenoms}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button>Se connecter</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            <Link
              to="/feed"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                location.pathname === "/feed"
                  ? "text-primary bg-primary/10"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Flux
            </Link>
            <Link
              to="/terrain"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                location.pathname === "/terrain"
                  ? "text-primary bg-primary/10"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Terrains
            </Link>
            <Link
              to="/projects"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                location.pathname === "/projects"
                  ? "text-primary bg-primary/10"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Projets
            </Link>
            
            {profile?.nom_role === "financier" && (
              <Link
                to="/financier"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  location.pathname === "/financier"
                    ? "text-primary bg-primary/10"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <DollarSign className="w-4 h-4 inline mr-1" />
                Financier
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
