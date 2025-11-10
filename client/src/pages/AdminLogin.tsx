import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      setLocation("/admin");
    }
  }, [isAuthenticated, isAdmin, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email.trim(), password.trim());
      
      const response = await fetch('/api/auth/profile', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const user = await response.json();
        
        if (user.role === 'admin') {
          toast({
            title: "Admin login successful",
            description: "Welcome to the admin dashboard!",
            duration: 1000,
          });
          setLocation("/admin");
        } else {
          toast({
            title: "Access denied",
            description: "You do not have admin privileges",
            variant: "destructive",
            duration: 1000,
          });
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        }
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.body?.error || "Invalid admin credentials",
        variant: "destructive",
        duration: 1000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-2 rounded-md cursor-pointer" data-testid="link-home">
              <BookOpen className="w-8 h-8 text-primary" />
              <span className="font-serif text-2xl font-bold">BookHub</span>
            </div>
          </Link>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Admin Access</CardTitle>
            </div>
            <CardDescription>
              Sign in with your admin credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@bookhub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-admin-email"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-admin-password"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-admin-login">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Sign in as Admin
                  </>
                )}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/login">
                <span className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-user-login">
                  Sign in as customer
                </span>
              </Link>
            </div>
            <div className="mt-2 text-center">
              <Link href="/">
                <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer" data-testid="link-back-home">
                  Back to store
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
