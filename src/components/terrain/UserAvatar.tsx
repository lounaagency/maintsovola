
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ name, photoUrl, size = 'md' }) => {
  // Get initials from name
  const initials = name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
    
  // Determine avatar size
  const sizeClass = size === 'sm' 
    ? 'h-6 w-6 text-xs' 
    : size === 'lg' 
      ? 'h-12 w-12 text-lg' 
      : 'h-9 w-9 text-sm';

  return (
    <Avatar className={sizeClass}>
      {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
      <AvatarFallback className="bg-primary/10 text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
