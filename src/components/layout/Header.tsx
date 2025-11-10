import { Shield, Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/me";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

export const Header = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith("/app");

  const profileQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: isAppRoute,
  });

  const profile = profileQuery.data;

  const displayName = useMemo(() => {
    if (!profile) {
      return isAppRoute && profileQuery.isFetching ? "Loading..." : "Guest";
    }

    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();

    return fullName || profile.email || "User";
  }, [profile, profileQuery.isFetching, isAppRoute]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = (currentTheme ?? "dark") === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const appNavigation = [
    { label: "Dashboard", to: "/app/dashboard" },
    { label: "Domains", to: "/app/domains" },
    { label: "Scans", to: "/app/scans" },
    { label: "Profile", to: "/app/profile" },
    { label: "Settings", to: "/app/settings" },
  ] as const;

  const isRouteActive = (href: string) => location.pathname.startsWith(href);

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <Link to="/" className="text-xl font-bold tracking-tight">
            HYOW
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Hack Your Own Web
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!isAppRoute ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth/register">Get started</Link>
              </Button>
            </div>
          ) : null}

          {isAppRoute ? (
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs px-6 py-12 sm:max-w-sm">
                <div className="flex h-full flex-col justify-between gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="text-lg font-semibold tracking-tight">HYOW</span>
                    </div>
                    <nav className="flex flex-col gap-2">
                      {appNavigation.map((item) => (
                        <SheetClose asChild key={item.label}>
                          <Link
                            to={item.to}
                            className={cn(
                              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                              isRouteActive(item.to)
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-accent"
                            )}
                          >
                            {item.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </nav>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Signed in as</p>
                    <p className="truncate text-foreground/80">{displayName}</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : null}

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {!isMounted ? (
              <Sun className="h-5 w-5" />
            ) : isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
