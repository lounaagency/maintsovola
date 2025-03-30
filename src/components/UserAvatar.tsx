
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "offline" | "away" | "busy" | "none";
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  src, 
  alt, 
  size = "md",
  status = "none"
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const getSize = () => {
    switch (size) {
      case "sm": return "h-8 w-8";
      case "md": return "h-10 w-10";
      case "lg": return "h-14 w-14";
      default: return "h-10 w-10";
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case "online": return "bg-green-500";
      case "offline": return "bg-gray-400";
      case "away": return "bg-yellow-500";
      case "busy": return "bg-red-500";
      default: return "hidden";
    }
  };
 /*
  const initialsFromName = (name: string) => {
    if (typeof name !== "string") {
        console.error("Invalid name value:", name);
        return "?"; // Valeur par défaut
    }
    const parts = name.trim().split(" ");
    return parts.length > 1 
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : parts[0][0].toUpperCase();
  };
*/
  const initialsFromName = (name?: string) => { 
    if (!name || typeof name !== "string" || name.trim() === "") {
        console.error("Invalid name value:", name);
        return "?"; // Valeur par défaut
    }

    const parts = name.trim().split(" ");
    return parts.length > 1 
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : parts[0][0].toUpperCase();
  };


  return (
    <div className="relative">
      <Avatar className={`${getSize()} border-2 border-white shadow-sm overflow-hidden transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {src && (
          <AvatarImage 
            src={src} 
            alt={alt} 
            onLoad={() => setIsLoaded(true)}
            className="object-cover"
          />
        )}
        <AvatarFallback 
          className={`bg-primary/10 text-primary font-medium ${!src ? 'opacity-100' : 'opacity-0'}`}
          delayMs={500}
        >
          {initialsFromName(alt)}
        </AvatarFallback>
      </Avatar>
      {status !== "none" && (
        <span className={`absolute bottom-0 right-0 h-3 w-3 ${getStatusColor()} rounded-full ring-2 ring-white`}></span>
      )}
    </div>
  );
};

export default UserAvatar;
