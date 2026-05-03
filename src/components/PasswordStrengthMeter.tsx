import { motion } from "motion/react";
import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const getStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const strength = getStrength(password);

  const getColor = (s: number) => {
    if (s === 0) return "bg-gray-200";
    if (s === 1) return "bg-red-500";
    if (s === 2) return "bg-orange-500";
    if (s === 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getLabel = (s: number) => {
    if (s === 0) return "Very Weak";
    if (s === 1) return "Weak";
    if (s === 2) return "Fair";
    if (s === 3) return "Good";
    return "Strong";
  };

  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains number", met: /[0-9]/.test(password) },
    { label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-muted-foreground">Password Strength</span>
        <span className={`text-xs font-bold ${
          strength <= 1 ? "text-red-500" : 
          strength === 2 ? "text-orange-500" : 
          strength === 3 ? "text-yellow-600" : "text-green-600"
        }`}>
          {getLabel(strength)}
        </span>
      </div>
      
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <motion.div
            key={level}
            initial={{ width: 0 }}
            animate={{ width: "25%" }}
            className={`h-full transition-colors duration-300 ${
              strength >= level ? getColor(strength) : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2">
            {req.met ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <X className="w-3 h-3 text-gray-300" />
            )}
            <span className={`text-[10px] ${req.met ? "text-green-600 font-medium" : "text-muted-foreground"}`}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
