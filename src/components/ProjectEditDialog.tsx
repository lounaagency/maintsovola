
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProjectForm from "./ProjectForm";

interface ProjectEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onSubmitSuccess: () => void;
  userId: string;
  userRole?: string;
}

const ProjectEditDialog: React.FC<ProjectEditDialogProps> = ({
  isOpen,
  onClose,
  project,
  onSubmitSuccess,
  userId,
  userRole
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
        </DialogHeader>
        <ProjectForm
          initialData={project}
          onSuccess={onSubmitSuccess}
          onCancel={onClose}
          isEditing={!!project}
          userId={userId}
          userRole={userRole}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProjectEditDialog;
