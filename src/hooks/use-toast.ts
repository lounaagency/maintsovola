
import { Toast, ToastActionElement } from "@/components/ui/toast";
import {
  useToast as useToastPrimitive
} from "@/components/ui/toast/use-toast";

export const useToast = useToastPrimitive;

// Create a reusable toast function
export const toast = {
  error: (message: string) => {
    useToastPrimitive().toast({
      variant: "destructive",
      title: "Error",
      description: message,
    });
  },
  success: (message: string) => {
    useToastPrimitive().toast({
      title: "Success",
      description: message,
    });
  },
  info: (message: string) => {
    useToastPrimitive().toast({
      description: message,
    });
  }
};

export type { Toast, ToastActionElement };
