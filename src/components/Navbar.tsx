
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MessageCircle, User, Settings } from "lucide-react";

const Navbar: React.FC = () => {
  const location = useLocation();
  
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
          <span className="mt-1">Feed</span>
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
          to="/profile" 
          className={`bottom-nav-item ${isActive("/profile") ? "active" : ""}`}
        >
          <div className="relative">
            <User size={20} strokeWidth={2} />
          </div>
          <span className="mt-1">Profile</span>
        </Link>
        
        <Link 
          to="/settings" 
          className={`bottom-nav-item ${isActive("/settings") ? "active" : ""}`}
        >
          <div className="relative">
            <Settings size={20} strokeWidth={2} />
          </div>
          <span className="mt-1">Settings</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
