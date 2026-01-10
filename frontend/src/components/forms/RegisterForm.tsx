import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { AlertCircle, User, Mail, Lock, Shield, Sparkles, Cpu, Loader2, UserPlus, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { axiosPublic } from "../../api/axios";

// Custom Robot icon component
const RobotIcon = () => (
  <svg 
    className="h-6 w-6" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
    />
  </svg>
);

// Custom Dashboard icon
const DashboardIcon = () => (
  <svg 
    className="h-6 w-6" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

export const RegisterForm = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [emailValid, setEmailValid] = useState<boolean>(false);

  const navigate = useNavigate();

  // Basic email format validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Update email validation on change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailValid(validateEmail(value));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    // Frontend validation
    if (!name || name.length < 2) {
      const errorMsg = "Name must be at least 2 characters";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    if (!email || !emailValid) {
      const errorMsg = "Please enter a valid email address";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    if (password.length < 6) {
      const errorMsg = "Password must be at least 6 characters";
      toast.error(errorMsg);
      return;
    }
    
    if (password !== confirmPassword) {
      const errorMsg = "Passwords do not match";
      toast.error(errorMsg);
      return;
    }

    // Password strength check (warning only)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      toast.warning("For better security, include uppercase, lowercase, numbers, and special characters");
    }

    setLoading(true);

    try {
      const loadingToastId = toast.loading(
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 animate-pulse" />
          <span>Creating your AI monitoring account...</span>
        </div>
      );

      // IMPORTANT: This endpoint MUST check for duplicate emails on the backend
      const res = await axiosPublic.post("/api/auth/register", { 
        name, 
        email, 
        password 
      });

      toast.dismiss(loadingToastId);
      
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>Account created successfully! Welcome to RoboHealth AI.</span>
        </div>,
        { duration: 3000 }
      );
      
      // Show success message before redirect
      setTimeout(() => {
        toast.info("Redirecting to login...");
        navigate("/login", { replace: true });
      }, 1500);

    } catch (err: any) {
      // CRITICAL: Handle duplicate email error from backend
      let errorMessage = "Registration failed. Please try again.";
      
      if (err.response?.status === 409) {
        errorMessage = "This email is already registered. Please use a different email or login.";
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid registration data. Please check your inputs.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      toast.error(errorMessage, {
        icon: <AlertCircle className="h-4 w-4" />,
      });
      
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (): number => {
    if (password.length === 0) return 0;
    
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;
    
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  
  const getStrengthColor = (): string => {
    if (passwordStrength <= 25) return "bg-red-500";
    if (passwordStrength <= 50) return "bg-amber-500";
    if (passwordStrength <= 75) return "bg-blue-500";
    return "bg-emerald-500";
  };

  // Render email validation status
  const renderEmailStatus = () => {
    if (!email) return null;
    
    if (!emailValid) {
      return (
        <div className="flex items-center gap-2 text-xs text-amber-400 mt-1">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Please enter a valid email address</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-xs text-blue-400 mt-1">
        <Mail className="h-3.5 w-3.5" />
        <span>Email format is valid</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 px-4 py-12 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
      
      {/* Animated Icons */}
      <div className="absolute top-10 left-10 opacity-10 animate-float">
        <div className="h-24 w-24 text-blue-400">
          <RobotIcon />
        </div>
      </div>
      <div className="absolute bottom-10 right-10 opacity-10 animate-float" style={{ animationDelay: "1s" }}>
        <Cpu className="h-24 w-24 text-emerald-400" />
      </div>
      
      {/* Toast Component */}
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        expand={false}
        theme="dark"
      />
      
      <div className="w-full max-w-md relative z-10">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl">
              <DashboardIcon />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              RoboHealth AI
            </h1>
          </div>
          <p className="text-gray-400 text-sm">AI-Powered Robot Monitoring System</p>
        </div>
        
        <Card className="w-full border-gray-800 bg-gray-900/50 backdrop-blur-sm shadow-2xl shadow-blue-900/10">
          <CardHeader className="text-center space-y-1 pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-emerald-900/30 to-emerald-700/30 border border-emerald-800/30">
                <UserPlus className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
            <CardDescription className="text-gray-400">
              Join the AI monitoring platform
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-900/50 bg-red-900/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <label htmlFor="name" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-900/30">
                    <User className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <span>Full Name</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="email" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-900/30">
                      <Mail className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                    <span>Email Address</span>
                  </label>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="operator@robotics.ai"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading}
                  required
                  className={`w-full bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:border-blue-500 transition-all ${
                    emailValid && email ? "border-blue-500" : ""
                  }`}
                  autoComplete="email"
                />
                
                {/* Email validation status (format only) */}
                {renderEmailStatus()}
              </div>

              <div className="space-y-3">
                <label htmlFor="password" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-900/30">
                    <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span>Password</span>
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full pr-12 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Password strength:</span>
                      <span className={passwordStrength >= 75 ? "text-emerald-400" : passwordStrength >= 50 ? "text-blue-400" : "text-amber-400"}>
                        {passwordStrength >= 75 ? "Strong" : passwordStrength >= 50 ? "Good" : "Weak"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p className="flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                        At least 6 characters
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                        Uppercase & lowercase letters
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                        Numbers & special characters
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-900/30">
                    <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span>Confirm Password</span>
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full pr-12 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-amber-400">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="sr-only peer"
                />
                <label htmlFor="terms" className="flex items-center space-x-2 cursor-pointer">
                  <div className="relative">
                    <div className="w-4 h-4 rounded border border-gray-600 bg-gray-800 flex items-center justify-center peer-checked:border-blue-500 peer-checked:bg-blue-500/20">
                      <svg className="w-3 h-3 text-blue-400 opacity-0 peer-checked:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    I agree to the{" "}
                    <button 
                      type="button" 
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                      onClick={() => toast.info("Terms & Conditions will open in a new tab")}
                    >
                      Terms & Conditions
                    </button>{" "}
                    and{" "}
                    <button 
                      type="button" 
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                      onClick={() => toast.info("Privacy Policy will open in a new tab")}
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/25 border-0 mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    <span>Create Account</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <div className="text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link 
                  to="/login" 
                  className="font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                >
                  Sign in here
                </Link>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-center justify-center pt-4">
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Shield className="h-3 w-3" />
              <span>Enterprise-grade security & encryption</span>
            </div>
          </CardFooter>
        </Card>
        
        {/* System Status */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-900/30 px-4 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Registration System • Online</span>
          </div>
        </div>
      </div>
      
      {/* Add CSS animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};