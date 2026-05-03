import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RemoveCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dontShowAgain: boolean) => void;
  title?: string;
  description?: string;
}

export const RemoveCustomerModal: React.FC<RemoveCustomerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Remove Customer",
  description = "This action will permanently remove the customer's profile and all associated data records. This cannot be undone."
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden relative z-10"
          >
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <button 
                  onClick={() => setDontShowAgain(!dontShowAgain)}
                  className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                    dontShowAgain 
                      ? "bg-cartlist-orange border-cartlist-orange shadow-lg shadow-orange-100" 
                      : "border-gray-200 hover:border-orange-200"
                  }`}
                >
                  {dontShowAgain && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
                <span className="text-sm text-gray-600 font-semibold cursor-pointer select-none" onClick={() => setDontShowAgain(!dontShowAgain)}>
                  Don't show this confirmation again
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  onClick={onClose}
                  className="h-14 rounded-2xl border-gray-100 font-bold hover:bg-gray-50 text-gray-500"
                >
                  Dismiss
                </Button>
                <Button 
                  onClick={() => onConfirm(dontShowAgain)}
                  className="h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-100"
                >
                  Remove Client
                </Button>
              </div>
            </div>
            
            {/* Warning strip */}
            <div className="bg-red-500 h-1.5 w-full" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
