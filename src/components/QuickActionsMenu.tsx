import React, { useState } from 'react';
import { Plus, MapPin, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import TerrainEditDialog from '@/components/TerrainEditDialog';
import { useAuth } from '@/contexts/AuthContext';

interface QuickActionsMenuProps {
  className?: string;
}

const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({ className }) => {
  const [terrainDialogOpen, setTerrainDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNewTerrain = () => {
    setTerrainDialogOpen(true);
  };

  const handleNewProject = () => {
    navigate('/projects');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`
              h-10 w-10 p-0 rounded-full 
              bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
              border-0 shadow-lg hover:shadow-xl
              text-white hover:text-white
              transform hover:scale-105 transition-all duration-200
              ${className}
            `}
          >
            <Plus className="h-5 w-5 font-bold" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleNewTerrain} className="cursor-pointer">
            <MapPin className="mr-2 h-4 w-4" />
            Nouveau terrain
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNewProject} className="cursor-pointer">
            <FolderPlus className="mr-2 h-4 w-4" />
            Nouveau projet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {user && (
        <TerrainEditDialog
          isOpen={terrainDialogOpen}
          onClose={() => setTerrainDialogOpen(false)}
          userId={user.id}
          onSubmitSuccess={() => {
            setTerrainDialogOpen(false);
          }}
        />
      )}
    </>
  );
};

export default QuickActionsMenu;