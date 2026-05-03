import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "./ui/button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false
}: ConfirmationModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden relative z-10 p-8"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                variant === "danger" ? "bg-red-50 text-red-500" : 
                variant === "warning" ? "bg-orange-50 text-orange-500" : 
                "bg-blue-50 text-blue-500"
              }`}>
                <AlertCircle className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="text-muted-foreground">{message}</p>
              </div>

              <div className="flex gap-3 w-full pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-12 rounded-xl border-gray-200 font-bold"
                  disabled={isLoading}
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={onConfirm}
                  className={`flex-1 h-12 rounded-xl font-bold text-white ${
                    variant === "danger" ? "bg-red-500 hover:bg-red-600" : 
                    variant === "warning" ? "bg-cartlist-orange hover:bg-orange-600" : 
                    "bg-blue-500 hover:bg-blue-600"
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
