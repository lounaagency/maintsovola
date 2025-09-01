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
            className={`h-9 w-9 p-0 ${className}`}
          >
            <Plus className="h-4 w-4" />
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