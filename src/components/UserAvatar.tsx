
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface UserAvatarProps {
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away" | "busy" | "none";
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ src, alt, size = "md", status = "none", className }) => {
  // Size mapping
  const sizeClass = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }[size];

  // Status mapping
  const statusColor = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
    busy: "bg-red-500",
    none: "hidden",
  }[status];

  // Get initials from alt text
  const getInitials = () => {
    const names = alt.split(" ");
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return alt.charAt(0).toUpperCase();
  };

  return (
    <div className={cn("relative", className)}>
      <Avatar className={cn(sizeClass, "border border-border")}>
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      {status !== "none" && (
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${statusColor}`}
        />
      )}
    </div>
  );
};

export default UserAvatar;
