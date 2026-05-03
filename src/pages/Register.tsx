import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "./Landing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { Eye, EyeOff, Mail, CheckCircle2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";

const registerSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters").max(80),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email address"),
  whatsappNumber: z.string().regex(/^(080|081|070|090|091|07)\d{8}$/, "Invalid Nigerian phone number format"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  businessCategory: z.string().optional(),
  otherBusinessCategory: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { login, fetchWithAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password", "");
  const businessCategoryValue = watch("businessCategory", "");

  const handleResendLink = async () => {
    if (!registeredEmail || isResending) return;
    
    setIsResending(true);
    setResendStatus("idle");
    
    try {
      const response = await fetchWithAuth("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      
      if (response.ok) {
        setResendStatus("success");
      } else {
        setResendStatus("error");
      }
    } catch (err) {
      setResendStatus("error");
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: RegisterValues) => {
    console.log("Register onSubmit called", data);
    setError(null);
    setIsSubmitting(true);
    try {
      const finalData = {
        ...data,
        businessCategory: data.businessCategory === "Other" ? data.otherBusinessCategory : data.businessCategory
      };
      const response = await fetchWithAuth("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      const result = await response.json();

      if (response.ok) {
        setRegisteredEmail(data.email);
        setShowVerificationModal(true);
      } else {
        setError(result.message || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch("/api/auth/google/url");
      const { url } = await response.json();
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;
      
      const popup = window.open(
        url,
        "google-login",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
          login(event.data.user, event.data.token);
          navigate("/dashboard");
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);
    } catch (err) {
      setError("Failed to initialize Google login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-6">
      <Logo className="mb-12 justify-center" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <Card className="border-orange-100 shadow-xl shadow-orange-100/20 rounded-3xl overflow-hidden">
          <CardHeader className="bg-white border-b border-orange-50 pb-8">
            <CardTitle className="text-3xl font-bold font-heading">Create your account</CardTitle>
            <CardDescription className="text-base">
              Join thousands of vendors managing their stockpiles professionally.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 bg-white/50">
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input 
                    id="businessName" 
                    placeholder="e.g. Adaeze's Grains" 
                    {...register("businessName")}
                    className={errors.businessName ? "border-destructive" : "border-orange-100"}
                  />
                  {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Full Name</Label>
                  <Input 
                    id="ownerName" 
                    placeholder="e.g. Adaeze Obi" 
                    {...register("ownerName")}
                    className={errors.ownerName ? "border-destructive" : "border-orange-100"}
                  />
                  {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="adaeze@example.com" 
                    {...register("email")}
                    className={errors.email ? "border-destructive" : "border-orange-100"}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Phone Number</Label>
                  <Input 
                    id="whatsappNumber" 
                    placeholder="e.g. 08012345678" 
                    {...register("whatsappNumber")}
                    className={errors.whatsappNumber ? "border-destructive" : "border-orange-100"}
                  />
                  {errors.whatsappNumber && <p className="text-xs text-destructive">{errors.whatsappNumber.message}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessCategory">Business Category (Optional)</Label>
                  <Select onValueChange={(value: string) => setValue("businessCategory", value)}>
                    <SelectTrigger className="w-full border-orange-100">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Fashion">Fashion</SelectItem>
                      <SelectItem value="Beauty">Beauty</SelectItem>
                      <SelectItem value="Baby Products">Baby Products</SelectItem>
                      <SelectItem value="Household">Household</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <AnimatePresence>
                  {businessCategoryValue === "Other" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <Label htmlFor="otherBusinessCategory">Please specify your business category</Label>
                      <Input 
                        id="otherBusinessCategory" 
                        placeholder="e.g. Electronics, Services, etc." 
                        {...register("otherBusinessCategory")}
                        className="border-orange-100"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      {...register("password")}
                      className={errors.password ? "border-destructive pr-10" : "border-orange-100 pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cartlist-orange transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={passwordValue} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      {...register("confirmPassword")}
                      className={errors.confirmPassword ? "border-destructive pr-10" : "border-orange-100 pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cartlist-orange transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 bg-cartlist-orange hover:bg-orange-600 text-white rounded-full text-lg font-semibold mt-4"
              >
                {isSubmitting ? "Creating Account..." : "Create Free Account"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-orange-100"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full h-12 border-orange-100 hover:bg-orange-50 rounded-full text-base font-medium flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign up with Google
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account? <Link to="/login" className="text-cartlist-orange font-semibold hover:underline">Login here</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {showVerificationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowVerificationModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-cartlist-orange" />
              </div>
              <h2 className="text-2xl font-bold font-heading mb-4">Verify your email</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                We've sent a verification link to <span className="font-bold text-gray-900">{registeredEmail}</span>. 
                Please check your inbox and click the link to activate your account.
              </p>
              <div className="space-y-4">
                <Button 
                  onClick={() => navigate("/login")}
                  className="w-full h-12 bg-cartlist-orange hover:bg-orange-600 text-white rounded-full font-bold shadow-lg shadow-orange-100"
                >
                  Go to Login
                </Button>
                <div className="text-xs text-muted-foreground">
                  {resendStatus === "success" ? (
                    <p className="text-green-600 font-medium flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Email resent successfully!
                    </p>
                  ) : resendStatus === "error" ? (
                    <p className="text-destructive font-medium">
                      Failed to resend. Please try again.
                    </p>
                  ) : (
                    <p>
                      Didn't receive the email? Check your spam folder or{" "}
                      <button 
                        onClick={handleResendLink}
                        disabled={isResending}
                        className="text-cartlist-orange font-bold hover:underline disabled:opacity-50"
                      >
                        {isResending ? "resending..." : "resend link"}
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
