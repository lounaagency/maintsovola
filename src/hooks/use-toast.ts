
// This file was created to fix a re-export issue.
// Re-export the toast components from the shadcn/ui library
import { toast } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

export { toast, useToast };
