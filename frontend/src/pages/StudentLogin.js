import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import { LogIn } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function StudentLogin({ setAuth }) {
  const [registerNumber, setRegisterNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/student/login`, {
        register_number: registerNumber,
        password: password
      });

      localStorage.setItem('student', JSON.stringify(response.data));
      setAuth(response.data);
      toast.success("Login successful!");
      navigate("/student/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex page-enter">
      {/* Left side - Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 gradient-bg items-center justify-center p-12"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1536982679170-1b2277759c92?crop=entropy&cs=srgb&fm=jpg&q=85)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="max-w-md text-white space-y-6">
          <div className="glass-effect rounded-xl p-8 border border-white/20">
            <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Outfit' }}>ACET</h1>
            <p className="text-xl opacity-90">AI-Powered Coding Evaluation Platform</p>
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <p className="text-sm">Master coding challenges</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <p className="text-sm">Track your progress</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <p className="text-sm">Advance through levels</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 subtle-gradient relative">
        <Button
          data-testid="admin-login-button"
          variant="outline"
          className="absolute top-6 right-6 shadow-sm"
          onClick={() => navigate("/admin/login")}
        >
          Admin Login
        </Button>

        <Card className="w-full max-w-md shadow-lg border-border hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }} data-testid="student-login-title">Student Login</CardTitle>
            <CardDescription className="text-base">Enter your register number to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="register" className="text-sm font-medium">Register Number</Label>
                <Input
                  data-testid="register-number-input"
                  id="register"
                  type="text"
                  placeholder="Enter your register number"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  required
                  className="h-11 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  data-testid="password-input"
                  id="password"
                  type="password"
                  placeholder="Same as register number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 transition-all duration-200"
                />
                <p className="text-xs text-muted-foreground">Your password is the same as your register number</p>
              </div>
              <Button 
                data-testid="student-login-submit"
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary/90 shadow-sm font-medium transition-all duration-200 active:scale-95"
                disabled={loading}
              >
                {loading ? "Logging in..." : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Login
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <footer className="absolute bottom-4 text-center text-xs text-muted-foreground">
          <p>Developed by Jana</p>
          <p>© Copyrights Claimed 2026</p>
        </footer>
      </div>
    </div>
  );
}