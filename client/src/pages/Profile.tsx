import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Mail, Calendar, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Profile() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [cartCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemCount={cartCount} />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Link href="/">
          <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 cursor-pointer" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4" />
            Back to store
          </div>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your account information
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="text-base font-medium" data-testid="text-user-name">{user.name}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="text-base font-medium" data-testid="text-user-email">{user.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Account Type</div>
                  <div className="mt-1">
                    <Badge variant={isAdmin ? "default" : "secondary"} data-testid="badge-user-role">
                      {isAdmin ? "Admin" : "User"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">Member Since</div>
                  <div className="text-base font-medium" data-testid="text-user-date">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
                <Link href="/orders" className="flex-1">
                  <Button variant="outline" className="w-full" data-testid="button-my-orders">
                    My Orders
                  </Button>
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="flex-1">
                    <Button variant="outline" className="w-full" data-testid="button-admin-dashboard">
                      Admin Dashboard
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  className="flex-1"
                  data-testid="button-logout"
                >
                  Log out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
