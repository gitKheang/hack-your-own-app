import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Register from "@/pages/auth/Register";
import Login from "@/pages/auth/Login";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Dashboard from "@/pages/app/Dashboard";
import DomainsList from "@/pages/app/domains/DomainsList";
import DomainDetail from "@/pages/app/domains/DomainDetail";
import ScansList from "@/pages/app/scans/ScansList";
import NewScan from "@/pages/app/scans/NewScan";
import ScanDetail from "@/pages/app/scans/ScanDetail";
import Profile from "@/pages/app/Profile";
import Settings from "@/pages/app/Settings";
import { AppLayout } from "@/components/layout/AppLayout";
import DomainVerificationGuide from "@/pages/help/DomainVerificationGuide";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/auth",
    element: <Outlet />,
    children: [
      { path: "register", element: <Register /> },
      { path: "login", element: <Login /> },
      { path: "verify-email", element: <VerifyEmail /> },
      { path: "forgot-password", element: <ForgotPassword /> },
    ],
  },
  {
    path: "/help",
    element: <Outlet />,
    children: [{ path: "domain-verification", element: <DomainVerificationGuide /> }],
  },
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "domains", element: <DomainsList /> },
      { path: "domains/new", element: <Navigate to="/app/domains?modal=add" replace /> },
      { path: "domains/:domainId", element: <DomainDetail /> },
      { path: "scans", element: <ScansList /> },
      { path: "scans/new", element: <NewScan /> },
      { path: "scans/:taskId", element: <ScanDetail /> },
      { path: "profile", element: <Profile /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
