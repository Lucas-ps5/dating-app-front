// Simplified hook wrapper around sonner or state for shadcn compatibility
import * as React from "react";
import { toast as sonnerToast } from "sonner";

export interface ToastActionElement {
  altText: string;
}

export type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const TOAST_LIMIT = 5;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

export function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([]);

  const toast = React.useCallback(
    ({ title, description, ...props }: ToastProps) => {
      const id = String(Date.now());
      setToasts((prev) => [...prev.slice(-(TOAST_LIMIT - 1)), { id, title, description, ...props }]);
      if (typeof title === "string") {
        sonnerToast(title, { description: typeof description === "string" ? description : undefined });
      }
      return { id };
    },
    [],
  );

  const dismiss = React.useCallback((toastId?: string) => {
    setToasts((prev) => (toastId ? prev.filter((t) => t.id !== toastId) : []));
  }, []);

  return {
    toasts,
    toast,
    dismiss,
  };
}

export const toast = (props: ToastProps) => {
  if (typeof props.title === "string") {
    sonnerToast(props.title, { description: typeof props.description === "string" ? props.description : undefined });
  }
};
