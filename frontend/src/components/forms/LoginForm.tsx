import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { AlertCircle, Eye, EyeOff, LogIn, Shield, Cpu, Sparkles, Loader2, Mail, Lock } from "lucide-react";
import { useAuthContext } from "../../context/useAuthContext";
import { useAuth } from "../../context/useAuth";

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

interface ApiErrorResponse {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
}

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { state, dispatch } = useAuthContext();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (state.user) {
    const redirectPath = state.user.role === "admin" ? "/admin-dashboard" : "/engineer-dashboard";
    navigate(redirectPath, { replace: true });
    return null;
  }

  // Demo credentials for quick testing
  const handleDemoLogin = () => {
    setEmail("user@gmail.com");
    setPassword("securepass123");
    toast.info("Demo credentials filled. Click Sign In to proceed.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Basic validation
    if (!email || !email.includes("@")) {
      const errorMsg = "Please enter a valid email address";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    if (!password || password.length < 6) {
      const errorMsg = "Password must be at least 6 characters";
      toast.error(errorMsg);
      return;
    }

    setLoading(true);

    try {
      // const loadingToastId = toast.loading(
      //   <div className="flex items-center gap-2">
      //     <Cpu className="h-4 w-4 animate-pulse" />
      //     <span>Authenticating with AI system...</span>
      //   </div>
      // );

      // Use the useAuth hook's login function
      const { user, token } = await login(email, password);

      toast.dismiss(loadingToastId);
      
      toast.success(
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>Welcome back, {user.name || user.email}! Access granted to Robot Health Dashboard.</span>
        </div>,
        { duration: 3000 }
      );
      
      // Update context with the response (already done in useAuth, but we keep for consistency)
      dispatch({ 
        type: "LOGIN", 
        payload: { 
          user, 
          accessToken: token 
        } 
      });
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("userEmail", email);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("userEmail");
      }
      
      // In handleSubmit function after successful login:
      setTimeout(() => {
        if (user.role === "admin") {
          navigate("/admin-dashboard", { replace: true });
        } else {
          navigate("/engineer-dashboard", { replace: true });
        }
      }, 500);

    } catch (err: unknown) {
      let errorMessage = "Authentication failed. Please try again.";
      
      // Type-safe error handling
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Customize error messages based on error content
        if (errorMessage.toLowerCase().includes("invalid credential") || 
            errorMessage.toLowerCase().includes("credentials")) {
          errorMessage = "Invalid credentials. Access denied.";
        } else if (errorMessage.toLowerCase().includes("account is deactivated")) {
          errorMessage = "Account is deactivated. Please contact your administrator.";
        } else if (errorMessage.toLowerCase().includes("too many")) {
          errorMessage = "Too many authentication attempts. Please try again later.";
        }
      } else if (err && typeof err === 'object') {
        // Handle axios-like errors
        const apiError = err as ApiErrorResponse;
        
        if (apiError.response?.status === 401) {
          errorMessage = "Invalid credentials. Access denied.";
        } else if (apiError.response?.status === 429) {
          errorMessage = "Too many authentication attempts. System locked temporarily.";
        } else if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
      }

      setError(errorMessage);
      toast.error(errorMessage, {
        icon: <AlertCircle className="h-4 w-4" />,
      });
      
    } finally {
      setLoading(false);
    }
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
      
      {/* Render the Toaster component */}
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
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-900/30 to-blue-700/30 border border-blue-800/30">
                <LogIn className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Secure Authentication</CardTitle>
            <CardDescription className="text-gray-400">
              Access the AI monitoring dashboard
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
                <label htmlFor="email" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-900/30">
                    <Mail className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <span>Email Address</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-emerald-900/30">
                      <Lock className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <span>Password</span>
                  </label>
                  {/* <Link 
                    to="/forgot-password" 
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info("Password reset feature coming soon!");
                    }}
                  >
                    Forgot password?
                  </Link> */}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full pr-12 bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                      disabled={loading}
                    />
                    <div className={`w-4 h-4 rounded border ${rememberMe ? 'bg-blue-500 border-blue-500' : 'border-gray-600 bg-gray-800'} transition-colors`}>
                      {rememberMe && (
                        <svg className="absolute inset-0.5 w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">Remember me</span>
                </label>
                
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="text-sm text-amber-400 hover:text-amber-300 hover:underline transition-colors disabled:text-amber-700"
                  disabled={loading}
                >
                  Try Demo Credentials
                </button>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 border-0 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="h-5 w-5" />
                    <span>Sign In to Dashboard</span>
                  </div>
                )}
              </Button>
            </form>

           {/* <div className="mt-8 pt-6 border-t border-gray-800">
              <div className="text-center text-sm text-gray-400">
                Need access to the system?{" "}
                <Link 
                  to="/register" 
                  className="font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Registration feature coming soon!");
                  }}
                >
                  Request an account
                </Link>
              </div>
            </div> */}
           
          </CardContent>

          {/* <CardFooter className="flex flex-col items-center justify-center pt-4">
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Shield className="h-3 w-3" />
              <span>Your data is secured with AES-256 encryption</span>
            </div>
          </CardFooter> */}
        </Card>
        
        {/* System Status */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-900/30 px-4 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>AI Monitoring System • Online</span>
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