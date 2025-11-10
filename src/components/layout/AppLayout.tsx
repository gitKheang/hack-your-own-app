import { Header } from "./Header";
import { Shield, LayoutDashboard, Globe, Activity, User, Settings } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hasSession = typeof window !== "undefined" && localStorage.getItem("hyow_session");
    if (!hasSession) {
      navigate("/auth/login", { replace: true, state: { redirect: location.pathname } });
    }
  }, [location.pathname, navigate]);

  const navigation = [
    { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
    { name: "Domains", href: "/app/domains", icon: Globe },
    { name: "Scans", href: "/app/scans", icon: Activity },
    { name: "Profile", href: "/app/profile", icon: User },
    { name: "Settings", href: "/app/settings", icon: Settings },
  ];

  const isActive = (href: string) => location.pathname.startsWith(href);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card/50 sticky top-16 h-[calc(100vh-4rem)]">
          <div className="flex-1 overflow-y-auto py-6">
            <nav className="space-y-1 px-3">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium">HYOW v1.0</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 pb-28 pt-8 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};
