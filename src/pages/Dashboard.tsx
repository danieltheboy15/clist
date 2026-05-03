import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Users, 
  ShoppingBag, 
  Truck, 
  Clock, 
  Search,
  Bell,
  ChevronDown,
  MoreVertical,
  Zap,
  LayoutGrid,
  Menu,
  X,
  Settings as SettingsIcon,
  LogOut,
  Calendar as CalendarIcon,
  Eye,
  Bot,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { Logo } from "./Landing";
import { LogPurchaseDrawer } from "../components/LogPurchaseDrawer";
import { StockpileDetailsModal } from "../components/StockpileDetailsModal";
import { SuccessModal } from "../components/SuccessModal";
import { Header } from "../components/Header";

interface DashboardStats {
  totalValue: number;
  activeClients: number;
  totalOrders: number;
  unpaidDeliveries: number;
  closingSoon: number;
  logsToday: number;
}

interface PurchaseLog {
  _id: string;
  customerName: string;
  customerPhone: string;
  updatedAt: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  totalAmount: number;
  status: string;
}

const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string | number, icon: any, colorClass: string }) => (
  <Card className="border border-gray-100 shadow-none bg-white rounded-2xl p-4 w-full">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold font-heading leading-none mb-1">{value}</p>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
      </div>
    </div>
  </Card>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, fetchWithAuth } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPurchases, setRecentPurchases] = useState<PurchaseLog[]>([]);
  const [closingSoonList, setClosingSoonList] = useState<PurchaseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7days");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [selectedStockpile, setSelectedStockpile] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let url = `/api/dashboard/stats?period=${period}`;
      if (period === "custom" && dateRange.from && dateRange.to) {
        url += `&startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`;
      }
      const response = await fetchWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        console.log("Dashboard data fetched:", data);
        setStats(data.stats);
        setRecentPurchases(data.recentPurchases);
        setClosingSoonList(data.closingSoonList);
      } else {
        console.error("Failed to fetch dashboard data:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data (catch):", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== "custom" || (dateRange.from && dateRange.to)) {
      fetchDashboardData();
    }
  }, [period, dateRange]);

  useEffect(() => {
    const searchCustomers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetchWithAuth(`/api/customers/search?q=${searchQuery}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
          setShowSearchResults(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-bg">
        <div className="w-10 h-10 border-4 border-cartlist-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-bg font-sans">
      <Header />

      <main className="max-w-[1600px] mx-auto p-4 md:p-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold font-heading">Hello, {user?.businessName} 👋🏾</h1>
            </div>
            <p className="text-muted-foreground text-base md:text-lg">Here's what's happening today.</p>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium">You have made <span className="font-bold">({stats?.logsToday || 0})</span> logs today</p>
            <Button 
              onClick={() => setIsLogDrawerOpen(true)}
              className="bg-cartlist-orange hover:bg-orange-600 text-white rounded-full px-10 h-14 text-lg font-bold gap-3 shadow-xl shadow-orange-200 w-full md:w-auto"
            >
              <Plus className="w-6 h-6" />
              Log a purchase
            </Button>
          </div>
        </div>

        {/* Main Dashboard Grid: Ordered for Mobile (Stats -> Closing Soon -> Purchases -> Banner) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 1. Stats Section */}
          <div className="lg:col-span-2 order-1 lg:order-1">
            <Card className="h-full border-none shadow-sm bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8">
              <div className="flex items-center justify-between mb-0">
                <h2 className="text-lg md:text-xl font-bold text-muted-foreground">Total stockpile value</h2>
                <div className="flex items-center gap-3">
                  {period === "custom" && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={`w-[240px] justify-start text-left font-normal rounded-xl border-orange-50 bg-[#FDF8F3] h-9 md:h-11 ${
                            !dateRange.from && "text-muted-foreground"
                          }`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border-orange-50" align="end">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange.from}
                          selected={{
                            from: dateRange.from,
                            to: dateRange.to
                          }}
                          onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[110px] md:w-[140px] bg-[#FDF8F3] border-orange-50 rounded-xl font-bold text-xs md:text-sm h-9 md:h-11">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="7days">7 days</SelectItem>
                      <SelectItem value="thisMonth">This month</SelectItem>
                      <SelectItem value="allTime">All time</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mb-4 md:mb-6">
                <p className="text-4xl md:text-6xl font-black font-heading mb-1">₦{stats?.totalValue.toLocaleString() || "0"}</p>
                <p className="text-muted-foreground text-sm md:text-base font-medium">Total value of all your stockpiled orders (open and closed)</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <StatCard 
                  title="Active clients" 
                  value={stats?.activeClients || 0} 
                  icon={Users} 
                  colorClass="bg-pink-50 text-pink-500"
                />
                <StatCard 
                  title="Total orders" 
                  value={stats?.totalOrders || 0} 
                  icon={ShoppingBag} 
                  colorClass="bg-green-50 text-green-500"
                />
                <StatCard 
                  title="Unpaid deliveries" 
                  value={stats?.unpaidDeliveries || 0} 
                  icon={Truck} 
                  colorClass="bg-yellow-50 text-yellow-500"
                />
              </div>
            </Card>
          </div>

          {/* 2. Marketing Banner - Desktop: Top Right (Order 2) | Mobile: Bottom (Order 4) */}
          <div className="lg:col-span-1 order-4 lg:order-2">
            <Card className="h-full relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 rounded-[24px] md:rounded-[32px] p-6 text-white group cursor-pointer flex flex-col justify-between">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-[10px] font-bold mb-4">
                  <Zap className="w-3 h-3 fill-white" />
                  NEW FEATURE
                </div>
                <h3 className="text-2xl md:text-3xl font-black font-heading mb-2 leading-tight">Want to use our bot instead?</h3>
                <p className="text-orange-50 text-sm md:text-base opacity-90 mb-6">Automate your stockpile management with our WhatsApp bot.</p>
              </div>
              
              <div className="relative z-10 flex items-center justify-between gap-4 mt-auto">
                <div className="flex flex-col gap-2 w-full">
                  <Button className="bg-white text-cartlist-orange hover:bg-orange-50 rounded-full px-4 h-12 font-bold text-sm shadow-xl shadow-black/10 group-hover:scale-[1.02] transition-transform w-full justify-center">
                    Get Started
                  </Button>
                  <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-full px-4 h-12 font-bold text-sm backdrop-blur-sm transition-all w-full">
                    View Tutorial
                  </Button>
                </div>
                <div className="hidden xl:flex w-14 h-14 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30 shadow-2xl shrink-0">
                  <Bot className="w-7 h-7 text-white" />
                </div>
              </div>

              {/* Background patterns */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-black/10 rounded-full blur-2xl" />
            </Card>
          </div>

          {/* 3. Logged Purchases - Desktop: Bottom Left (Order 3) | Mobile: Middle (Order 3) */}
          <div className="lg:col-span-2 order-3 lg:order-3">
            <Card className="border-none shadow-sm bg-white rounded-[24px] md:rounded-[32px] overflow-hidden">
              <CardHeader className="px-6 md:px-8 pt-6 md:pt-8 pb-4 flex flex-row items-center justify-between">
                <h3 className="text-lg md:text-xl font-bold text-foreground">Logged purchases</h3>
                <Link to="/stockpile">
                  <Button variant="ghost" className="text-xs md:text-sm font-bold text-muted-foreground bg-gray-50 rounded-full px-4 md:px-6">See All</Button>
                </Link>
              </CardHeader>
              
              <div className="mt-0">
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 text-muted-foreground text-[10px] uppercase tracking-wider font-bold">
                          <th className="px-6 md:px-8 py-4">Clients</th>
                          <th className="px-4 py-4">Date stockpiled</th>
                          <th className="hidden md:table-cell px-4 py-4">Item name</th>
                          <th className="hidden md:table-cell px-4 py-4">Amount</th>
                          <th className="hidden md:table-cell px-4 py-4">Progress</th>
                          <th className="hidden md:table-cell px-4 py-4">Status</th>
                          <th className="px-6 md:px-8 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentPurchases.length > 0 ? recentPurchases.map((log) => (
                          <tr 
                            key={log._id} 
                            className="hover:bg-orange-50/30 transition-colors group cursor-pointer"
                            onClick={() => {
                              setSelectedStockpile(log);
                              setIsDetailsModalOpen(true);
                            }}
                          >
                            <td className="px-6 md:px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                                  <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${log.customerName}`} alt="Avatar" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold">{log.customerName}</p>
                                  <p className="text-[10px] text-muted-foreground">{log.customerPhone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-5">
                              <p className="text-sm font-bold">
                                {(() => {
                                  const diff = new Date().getTime() - new Date(log.updatedAt).getTime();
                                  const minutes = Math.floor(diff / (1000 * 60));
                                  const hours = Math.floor(diff / (1000 * 60 * 60));
                                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                  
                                  if (minutes < 1) return "Just now";
                                  if (minutes < 60) return `${minutes} Mins ago`;
                                  if (hours < 24) return `${hours} Hrs ago`;
                                  if (days === 1) return "Yesterday";
                                  return `${days} Days ago`;
                                })()}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{new Date(log.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                            </td>
                            <td className="hidden md:table-cell px-4 py-5">
                              <p className="text-sm font-bold">
                                {log.items[0]?.name || "N/A"}
                                {log.items.length > 1 && <span className="text-muted-foreground font-normal ml-1">+{log.items.length - 1} more</span>}
                              </p>
                              <p className="text-[10px] text-muted-foreground">(₦{log.items[0]?.price.toLocaleString() || 0})</p>
                            </td>
                            <td className="hidden md:table-cell px-4 py-5">
                              <p className="text-sm font-bold">₦{log.totalAmount.toLocaleString()}</p>
                              <p className="text-[10px] text-muted-foreground">({log.items.length} units)</p>
                            </td>
                            <td className="hidden md:table-cell px-4 py-5 w-32">
                              {(() => {
                                const start = new Date(log.createdAt).getTime();
                                const end = new Date(log.endDate).getTime();
                                const now = new Date().getTime();
                                const total = end - start;
                                const elapsed = now - start;
                                const progress = Math.min(100, Math.max(0, Math.floor((elapsed / total) * 100)));
                                return (
                                  <>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-cartlist-orange rounded-full" style={{ width: `${progress}%` }} />
                                    </div>
                                    <p className="text-[10px] font-bold mt-1 text-right">{progress}%</p>
                                  </>
                                );
                              })()}
                            </td>
                            <td className="hidden md:table-cell px-4 py-5">
                              <div className="flex items-center gap-2 bg-orange-50 text-cartlist-orange px-3 py-1 rounded-full w-fit">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase">{log.status}</span>
                              </div>
                            </td>
                            <td className="px-6 md:px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus-visible:ring-0 focus-visible:ring-offset-0">
                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl p-2 border-orange-100 shadow-xl bg-white z-[200]">
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedStockpile(log);
                                      setIsDetailsModalOpen(true);
                                    }}
                                    className="rounded-xl px-3 py-2 cursor-pointer flex items-center gap-3 hover:bg-orange-50 group outline-none"
                                  >
                                    <Eye className="w-4 h-4 text-gray-400 group-hover:text-cartlist-orange" />
                                    <span className="font-medium text-sm">View</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => navigate(`/customers/${log.customerPhone}`)}
                                    className="rounded-xl px-3 py-2 cursor-pointer flex items-center gap-3 hover:bg-orange-50 group outline-none"
                                  >
                                    <Users className="w-4 h-4 text-gray-400 group-hover:text-cartlist-orange" />
                                    <span className="font-medium text-sm">View Customer</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={7} className="px-6 md:px-8 py-20 text-center text-muted-foreground">No recent purchases</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>

          {/* 4. Closing Soon - Desktop: Bottom Right (Order 4) | Mobile: Top Middle (Order 2) */}
          <div className="lg:col-span-1 order-2 lg:order-4">
            <Card className="h-full border-none shadow-sm bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8">
              <CardHeader className="p-0 mb-6 md:mb-8">
                <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-cartlist-orange fill-cartlist-orange" />
                  Closing this week
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-6">
                {closingSoonList.length > 0 ? closingSoonList.map((item) => (
                  <div 
                    key={item._id} 
                    className="flex items-center justify-between group cursor-pointer" 
                    onClick={() => {
                      setSelectedStockpile(item);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-50 flex items-center justify-center overflow-hidden border border-orange-100">
                        <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${item.customerName}`} alt="Avatar" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{item.customerName}</h4>
                        <p className="text-[10px] text-red-500 font-medium">Closing in {Math.ceil((new Date(item.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div className="bg-gray-50 px-3 py-1 rounded-full">
                        <p className="text-[10px] font-bold">₦{item.totalAmount.toLocaleString()}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-10">No stockpiles closing soon.</p>
                )}
                
                <Link to="/stockpile" className="w-full">
                  <Button variant="outline" className="w-full mt-6 rounded-full border-orange-100 text-muted-foreground font-bold h-12 hover:bg-orange-50 hover:text-cartlist-orange transition-colors">
                    View all stockpiles
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <LogPurchaseDrawer 
        isOpen={isLogDrawerOpen} 
        onClose={() => setIsLogDrawerOpen(false)} 
        onSuccess={(data) => {
          fetchDashboardData();
          setSuccessData(data);
          setIsSuccessModalOpen(true);
        }}
      />

      <StockpileDetailsModal 
        isOpen={isDetailsModalOpen}
        stockpile={selectedStockpile}
        onClose={() => setIsDetailsModalOpen(false)}
        onUpdate={() => {
          fetchDashboardData();
          // Refresh selected stockpile data if it's open
          if (selectedStockpile) {
            fetchWithAuth(`/api/stockpiles/${selectedStockpile._id}`)
              .then(res => res.json())
              .then(data => setSelectedStockpile(data));
          }
        }}
      />

      <SuccessModal 
        isOpen={isSuccessModalOpen} 
        onClose={() => {
          setIsSuccessModalOpen(false);
          setSuccessData(null);
        }} 
        data={successData}
        onLogAnother={() => {
          setIsSuccessModalOpen(false);
          setSuccessData(null);
          setIsLogDrawerOpen(true);
        }}
      />
    </div>
  );
}
