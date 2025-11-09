import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  ShoppingCart, 
  IndianRupee, 
  TrendingUp, 
  Loader2,
  Calendar,
  Download,
  RefreshCw,
  Activity,
  PackageCheck,
  Clock,
  XCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";
import type { DashboardStats } from "server/storage";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

type TimePeriod = "7d" | "30d" | "90d" | "1y";

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

interface RevenueChartData {
  date: string;
  revenue: number;
}

export default function AdminDashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", timePeriod],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/stats?period=${timePeriod}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: revenueChartData = [], isLoading: chartLoading } = useQuery<RevenueChartData[]>({
    queryKey: ["/api/dashboard/revenue-chart", timePeriod],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/revenue-chart?period=${timePeriod}`);
      if (!res.ok) throw new Error("Failed to fetch revenue chart");
      return res.json();
    },
  });

  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/recent"],
  });

  const { data: topBooks = [], isLoading: topBooksLoading } = useQuery<Array<{ title: string; sales: number; revenue: number }>>({
    queryKey: ["/api/dashboard/top-books"],
  });

  const stats = statsData ? [
    {
      title: "Total Books",
      value: statsData.totalBooks.toString(),
      icon: BookOpen,
      description: "In catalog",
      trend: { value: statsData.booksTrend, label: "from last month" },
    },
    {
      title: "Total Users",
      value: statsData.totalUsers.toString(),
      icon: Users,
      description: "Registered users",
      trend: { value: statsData.usersTrend, label: "from last month" },
    },
    {
      title: "Orders",
      value: statsData.totalOrders.toString(),
      icon: ShoppingCart,
      description: "Total orders",
      trend: { value: statsData.ordersTrend, label: "from last month" },
    },
    {
      title: "Revenue",
      value: `₹${statsData.totalRevenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      description: "Total revenue",
      trend: { value: statsData.revenueTrend, label: "from last month" },
    },
  ] : [];

  const orderStatusData = recentOrders.reduce((acc, order) => {
    const status = order.status;
    const existing = acc.find(item => item.status === status);
    if (existing) {
      existing.count += 1;
      existing.revenue += order.amount;
    } else {
      acc.push({ status, count: 1, revenue: order.amount });
    }
    return acc;
  }, [] as Array<{ status: string; count: number; revenue: number }>);

  const handleRefresh = () => {
    refetchStats();
  };

  const handleExportData = () => {
    const csvContent = `Dashboard Report\nGenerated: ${new Date().toLocaleString()}\n\nMetric,Value\nTotal Books,${statsData?.totalBooks}\nTotal Users,${statsData?.totalUsers}\nTotal Orders,${statsData?.totalOrders}\nTotal Revenue,₹${statsData?.totalRevenue}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${Date.now()}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return COLORS.success;
      case "processing":
        return COLORS.info;
      case "pending":
        return COLORS.warning;
      case "cancelled":
        return COLORS.danger;
      default:
        return COLORS.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <PackageCheck className="w-4 h-4" />;
      case "processing":
        return <Clock className="w-4 h-4" />;
      case "pending":
        return <Activity className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <ShoppingCart className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="heading-dashboard">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your store performance overview.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1 border rounded-md p-1">
              {(["7d", "30d", "90d", "1y"] as TimePeriod[]).map((period) => (
                <Button
                  key={period}
                  size="sm"
                  variant={timePeriod === period ? "default" : "ghost"}
                  onClick={() => setTimePeriod(period)}
                  data-testid={`button-period-${period}`}
                  className="h-8"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {period === "7d" && "7 Days"}
                  {period === "30d" && "30 Days"}
                  {period === "90d" && "90 Days"}
                  {period === "1y" && "1 Year"}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              data-testid="button-refresh"
              className="h-10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              data-testid="button-export"
              className="h-10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {statsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <StatsCard key={stat.title} {...stat} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Revenue & Orders Trend
                </span>
                <Badge variant="secondary">{timePeriod === "30d" ? "Last 30 days" : timePeriod}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="revenue" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none pb-0 bg-transparent">
                  <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
                  <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
                </TabsList>
                <TabsContent value="revenue" className="pt-4">
                  {chartLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke={COLORS.primary}
                          strokeWidth={2}
                          dot={{ fill: COLORS.primary }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </TabsContent>
                <TabsContent value="orders" className="pt-4">
                  <p className="text-center py-8 text-muted-foreground">Order trend chart coming soon</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderStatusData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No order data</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {orderStatusData.map((item) => (
                      <div
                        key={item.status}
                        className="flex items-center justify-between p-2 rounded-md border"
                      >
                        <div className="flex items-center gap-2">
                          <div style={{ color: getStatusColor(item.status) }}>
                            {getStatusIcon(item.status)}
                          </div>
                          <span className="text-sm font-medium">{item.status}</span>
                        </div>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm" data-testid="link-view-all-orders">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentOrders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No recent orders</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-md hover-elevate border"
                      data-testid={`order-${order.orderNumber}`}
                    >
                      <div className="flex items-center gap-3">
                        <div style={{ color: getStatusColor(order.status) }}>
                          {getStatusIcon(order.status)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {order.bookTitle}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-bold">₹{order.amount.toLocaleString('en-IN')}</p>
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${getStatusColor(order.status)}15`,
                            color: getStatusColor(order.status),
                          }}
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Selling Books
              </CardTitle>
              <Badge variant="secondary">Best Performers</Badge>
            </CardHeader>
            <CardContent>
              {topBooksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : topBooks.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No sales data available</p>
              ) : (
                <div className="space-y-3">
                  {topBooks.slice(0, 5).map((book, index) => (
                    <div
                      key={book.title}
                      className="flex items-center justify-between p-3 rounded-md hover-elevate border"
                      data-testid={`top-book-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{book.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {book.sales} sales
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">
                          ₹{book.revenue.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2" data-testid="quick-action-add-book" asChild>
                <Link href="/admin/books" className="flex flex-col items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-sm">Add Book</span>
                </Link>
              </Button>
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2" data-testid="quick-action-view-orders" asChild>
                <Link href="/admin/orders" className="flex flex-col items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-sm">View Orders</span>
                </Link>
              </Button>
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2" data-testid="quick-action-manage-users" asChild>
                <Link href="/admin/users" className="flex flex-col items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">Manage Users</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex-col gap-2"
                onClick={handleExportData}
                data-testid="quick-action-export-report"
              >
                <Download className="w-5 h-5" />
                <span className="text-sm">Export Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
