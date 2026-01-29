import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import { ShieldAlert, ArrowLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminLogin({ setAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, {
        username,
        password
      });

      localStorage.setItem('admin', JSON.stringify(response.data));
      setAuth(response.data);
      toast.success("Admin login successful!");
      navigate("/admin/dashboard");
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
            <p className="text-xl opacity-90">Admin Portal</p>
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <p className="text-sm">Manage students</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <p className="text-sm">View analytics</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <p className="text-sm">Track performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 subtle-gradient relative">
        <Button
          data-testid="back-to-student-login"
          variant="outline"
          className="absolute top-6 left-6 shadow-sm"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Student Login
        </Button>

        <Card className="w-full max-w-md shadow-lg border-border hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-primary" />
              <CardTitle className="text-3xl font-bold" style={{ fontFamily: 'Outfit' }} data-testid="admin-login-title">Admin Login</CardTitle>
            </div>
            <CardDescription className="text-base">Secure access for teachers and administrators</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input
                  data-testid="admin-username-input"
                  id="username"
                  type="text"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  data-testid="admin-password-input"
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 transition-all duration-200"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
                <p className="text-amber-800"><strong>Default credentials:</strong></p>
                <p className="text-amber-700 text-xs mt-1">Username: admin | Password: admin123</p>
              </div>
              <Button 
                data-testid="admin-login-submit"
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary/90 shadow-sm font-medium transition-all duration-200 active:scale-95"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login as Admin"}
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