import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Store, Bell, Database, Palette, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Settings as SettingsType, TimeUnit } from "@shared/schema";

export default function AdminSettings() {
  const { toast } = useToast();
  const [storeName, setStoreName] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [newArrivalDuration, setNewArrivalDuration] = useState(30);
  const [newArrivalUnit, setNewArrivalUnit] = useState<TimeUnit>("days");
  const [recentlyUpdatedDuration, setRecentlyUpdatedDuration] = useState(14);
  const [recentlyUpdatedUnit, setRecentlyUpdatedUnit] = useState<TimeUnit>("days");

  const { data: settings, isLoading } = useQuery<SettingsType>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName);
      setStoreEmail(settings.storeEmail);
      setStorePhone(settings.storePhone);
      setEmailNotifications(settings.emailNotifications);
      setOrderNotifications(settings.orderNotifications);
      setLowStockAlerts(settings.lowStockAlerts);
      setNewArrivalDuration(settings.newArrivalDuration);
      setNewArrivalUnit(settings.newArrivalUnit as TimeUnit);
      setRecentlyUpdatedDuration(settings.recentlyUpdatedDuration);
      setRecentlyUpdatedUnit(settings.recentlyUpdatedUnit as TimeUnit);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<SettingsType>) => {
      return await apiRequest("PUT", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings saved successfully",
        duration: 1000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
        duration: 1000,
      });
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      storeName,
      storeEmail,
      storePhone,
      emailNotifications,
      orderNotifications,
      lowStockAlerts,
      newArrivalDuration,
      newArrivalUnit,
      recentlyUpdatedDuration,
      recentlyUpdatedUnit,
    });
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-settings">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your store settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Store Information
              </CardTitle>
              <CardDescription>
                Basic information about your bookstore
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input
                  id="store-name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  data-testid="input-store-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-email">Contact Email</Label>
                <Input
                  id="store-email"
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  data-testid="input-store-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-phone">Phone Number</Label>
                <Input
                  id="store-phone"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  data-testid="input-store-phone"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage email and system notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your store
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  data-testid="switch-email-notifications"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="order-notifications">Order Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new orders are placed
                  </p>
                </div>
                <Switch
                  id="order-notifications"
                  checked={orderNotifications}
                  onCheckedChange={setOrderNotifications}
                  data-testid="switch-order-notifications"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="low-stock-alerts">Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Alerts when book inventory is running low
                  </p>
                </div>
                <Switch
                  id="low-stock-alerts"
                  checked={lowStockAlerts}
                  onCheckedChange={setLowStockAlerts}
                  data-testid="switch-low-stock-alerts"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Discovery Rules
              </CardTitle>
              <CardDescription>
                Control how books are featured on your store with precise timing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>New Arrival Duration</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={newArrivalDuration}
                    onChange={(e) => setNewArrivalDuration(parseInt(e.target.value) || 1)}
                    className="flex-1"
                    data-testid="input-new-arrival-duration"
                  />
                  <Select value={newArrivalUnit} onValueChange={(value) => setNewArrivalUnit(value as TimeUnit)}>
                    <SelectTrigger className="w-32" data-testid="select-new-arrival-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Seconds</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Books will show "New" badge for {newArrivalDuration} {newArrivalUnit} after being added
                </p>
              </div>
              
              <div className="space-y-3">
                <Label>Recently Updated Duration</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={recentlyUpdatedDuration}
                    onChange={(e) => setRecentlyUpdatedDuration(parseInt(e.target.value) || 1)}
                    className="flex-1"
                    data-testid="input-recently-updated-duration"
                  />
                  <Select value={recentlyUpdatedUnit} onValueChange={(value) => setRecentlyUpdatedUnit(value as TimeUnit)}>
                    <SelectTrigger className="w-32" data-testid="select-recently-updated-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Seconds</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Books will show "Updated" badge for {recentlyUpdatedDuration} {recentlyUpdatedUnit} after content changes
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 border-t">
              <Button
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="ml-auto"
                data-testid="button-save-discovery-rules"
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Save Discovery Rules
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database
              </CardTitle>
              <CardDescription>
                Database configuration and management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Database Type</Label>
                <div className="p-3 rounded-md bg-muted">
                  <p className="text-sm font-medium">MongoDB</p>
                  <p className="text-xs text-muted-foreground">Connected and operational</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Database Status</Label>
                <div className="flex items-center gap-2 p-3 rounded-md bg-green-100 dark:bg-green-900/30">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-400">
                    Connected
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full" data-testid="button-backup-database">
                Backup Database
              </Button>
            </CardContent>
          </Card>


          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your admin panel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      defaultValue="#0f172a"
                      className="w-20 h-10"
                      data-testid="input-primary-color"
                    />
                    <Input
                      defaultValue="#0f172a"
                      className="flex-1"
                      data-testid="input-primary-color-hex"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      defaultValue="#64748b"
                      className="w-20 h-10"
                      data-testid="input-secondary-color"
                    />
                    <Input
                      defaultValue="#64748b"
                      className="flex-1"
                      data-testid="input-secondary-color-hex"
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing and show more content
                  </p>
                </div>
                <Switch data-testid="switch-compact-mode" />
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="outline" data-testid="button-reset">
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending}
              data-testid="button-save-settings"
            >
              {updateSettingsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
