import { Outlet, NavLink, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Heart,
  Bell,
  MessageCircle,
  User,
  Compass,
  LayoutDashboard,
  ThumbsUp,
  LogOut,
} from "lucide-react";
import { useFetchLikesCount } from "@/composables/useFetchLikesCount";
import { useGetUnreadNotificationCount } from "@/composables/useGetUnreadNotificationCount";
import { useGetMyUnreadMessagesCount } from "@/composables/useGetMyUnreadMessagesCount";

import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, labelKey: "home" },
  { to: "/discover", icon: Compass, labelKey: "discover" },
  { to: "/likes", icon: ThumbsUp, labelKey: "likes" },
  { to: "/notifications", icon: Bell, labelKey: "notifications" },
  { to: "/chat", icon: MessageCircle, labelKey: "chat" },
  { to: "/profile", icon: User, labelKey: "profile" },
] as const;

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 text-[10px] leading-none font-semibold flex items-center justify-center rounded-full gradient-primary text-primary-foreground ring-2 ring-card">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function AppLayout() {
  const { userInfo, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation("nav");

  const { data: notificationCount } = useGetUnreadNotificationCount();
  const { data: likeCount } = useFetchLikesCount();
  const { data: unreadMessagesCount } = useGetMyUnreadMessagesCount();

  const counts: Record<string, number> = {
    "/notifications": notificationCount?.count ?? 0,
    "/likes": likeCount?.count ?? 0,
    "/chat": unreadMessagesCount?.count ?? 0,
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar - desktop */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span className="text-xl font-bold text-foreground">Hot meet</span>
        </div>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`
              }
            >
              <span className="relative inline-flex">
                <item.icon className="w-4 h-4" />
                <CountBadge count={counts[item.to] ?? 0} />
              </span>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {(userInfo?.preferred_username as string) || t("profile")}
          </span>
          <button
            onClick={() => logout()}
            aria-label={t("logout")}
            title={t("logout")}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border flex justify-around py-2 z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-0.5 p-1"
            >
              <span className="relative inline-flex">
                <item.icon
                  className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <CountBadge count={counts[item.to] ?? 0} />
              </span>
              <span
                className={`text-[10px] ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                {t(item.labelKey)}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
