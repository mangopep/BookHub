import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminLoginDialog({ open, onOpenChange }: AdminLoginDialogProps) {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
          onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <DialogTitle>Admin Access</DialogTitle>
          </div>
          <DialogDescription>
            Sign in with your admin credentials to access the dashboard
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Email</Label>
            <Input
              id="admin-email"
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
            <Label htmlFor="admin-password">Admin Password</Label>
            <Input
              id="admin-password"
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
        <div className="mt-2 p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>Default Admin Credentials:</strong><br />
            Email: admin@bookhub.com<br />
            Password: admin123
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
