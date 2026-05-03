import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "./Landing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailValues = z.infer<typeof emailSchema>;
type OtpValues = z.infer<typeof otpSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema) });
  const otpForm = useForm<OtpValues>({ resolver: zodResolver(otpSchema) });
  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const passwordValue = passwordForm.watch("password", "");

  const onEmailSubmit = async (data: EmailValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetchWithAuth("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setEmail(data.email);
        setStep("otp");
        setResendTimer(60);
      } else {
        const result = await response.json();
        setError(result.message || "Something went wrong");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSubmitting) return;
    
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetchWithAuth("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setResendTimer(60);
      } else {
        setError(result.message || "Failed to resend OTP");
        if (result.retryAfter) {
          setResendTimer(result.retryAfter);
        }
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOtpSubmit = async (data: OtpValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetchWithAuth("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: data.otp }),
      });
      if (response.ok) {
        setOtp(data.otp);
        setStep("reset");
      } else {
        const result = await response.json();
        setError(result.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetchWithAuth("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: data.password }),
      });
      if (response.ok) {
        navigate("/login", { state: { message: "Password reset successfully. Please login with your new password." } });
      } else {
        const result = await response.json();
        setError(result.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] flex flex-col items-center justify-center py-12 px-6 font-sans">
      <Logo className="mb-12 justify-center" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Forgot Password</h1>
          <p className="text-muted-foreground font-medium">
            {step === "email" && "Enter your email to receive a reset OTP"}
            {step === "otp" && `Enter the 6-digit OTP sent to ${email}`}
            {step === "reset" && "Create a new secure password for your account"}
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-orange-100/50 rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </motion.div>
              )}

              {step === "email" && (
                <motion.form
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        className="pl-12 h-14 bg-[#FDF8F3]/50 border-orange-50 rounded-2xl focus:ring-cartlist-orange/20 focus:border-cartlist-orange transition-all font-medium"
                        {...emailForm.register("email")}
                      />
                    </div>
                    {emailForm.formState.errors.email && (
                      <p className="text-xs text-red-500 font-bold ml-1">{emailForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-cartlist-orange hover:bg-orange-600 text-white rounded-full font-bold text-lg shadow-lg shadow-orange-200 transition-all"
                  >
                    {isSubmitting ? "Sending..." : "Send OTP"}
                  </Button>
                </motion.form>
              )}

              {step === "otp" && (
                <motion.form
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-bold text-gray-700 ml-1">6-Digit OTP</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="otp"
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        className="pl-12 h-14 bg-[#FDF8F3]/50 border-orange-50 rounded-2xl focus:ring-cartlist-orange/20 focus:border-cartlist-orange transition-all font-bold tracking-[0.5em] text-center text-xl"
                        {...otpForm.register("otp")}
                      />
                    </div>
                    {otpForm.formState.errors.otp && (
                      <p className="text-xs text-red-500 font-bold ml-1">{otpForm.formState.errors.otp.message}</p>
                    )}
                  </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 bg-cartlist-orange hover:bg-orange-600 text-white rounded-full font-bold text-lg shadow-lg shadow-orange-200 transition-all"
                    >
                      {isSubmitting ? "Verifying..." : "Verify OTP"}
                    </Button>

                    <div className="flex flex-col gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={resendTimer > 0 || isSubmitting}
                        onClick={handleResendOtp}
                        className="w-full h-12 text-cartlist-orange font-bold hover:bg-orange-50 rounded-full disabled:text-gray-400"
                      >
                        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep("email")}
                        className="w-full h-12 text-gray-500 font-bold hover:bg-orange-50 rounded-full"
                      >
                        Change Email
                      </Button>
                    </div>
                  </motion.form>
              )}

              {step === "reset" && (
                <motion.form
                  key="reset"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-12 pr-12 h-14 bg-[#FDF8F3]/50 border-orange-50 rounded-2xl focus:ring-cartlist-orange/20 focus:border-cartlist-orange transition-all font-medium"
                        {...passwordForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <PasswordStrengthMeter password={passwordValue} />
                    {passwordForm.formState.errors.password && (
                      <p className="text-xs text-red-500 font-bold ml-1">{passwordForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700 ml-1">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-12 pr-12 h-14 bg-[#FDF8F3]/50 border-orange-50 rounded-2xl focus:ring-cartlist-orange/20 focus:border-cartlist-orange transition-all font-medium"
                        {...passwordForm.register("confirmPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-red-500 font-bold ml-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-cartlist-orange hover:bg-orange-600 text-white rounded-full font-bold text-lg shadow-lg shadow-orange-200 transition-all"
                  >
                    {isSubmitting ? "Updating..." : "Update Password"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-cartlist-orange font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
