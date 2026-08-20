import { Outlet, NavLink, useLocation } from "react-router";
import { Heart, MessageCircle, User, Compass, LayoutDashboard, ThumbsUp, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useMatchStore } from "@/store/useMatchStore";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/discover", icon: Compass, label: "Discover" },
  { to: "/likes", icon: ThumbsUp, label: "Likes" },
  { to: "/matches", icon: Heart, label: "Matches" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const matchCount = useMatchStore((s) => s.matches.length);
  const likeCount = useMatchStore((s) => s.likes.length);
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar - desktop */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <span className="text-xl font-bold text-foreground">Flame</span>
        </div>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.to === "/matches" && matchCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full gradient-primary text-primary-foreground">{matchCount}</span>
              )}
              {item.to === "/likes" && likeCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full gradient-primary text-primary-foreground">{likeCount}</span>
              )}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.name}</span>
          <button onClick={logout} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
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
            <NavLink key={item.to} to={item.to} className="flex flex-col items-center gap-0.5 p-1 relative">
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>{item.label}</span>
              {item.to === "/matches" && matchCount > 0 && (
                <span className="absolute -top-1 right-0 w-4 h-4 text-[9px] flex items-center justify-center rounded-full gradient-primary text-primary-foreground">{matchCount}</span>
              )}
              {item.to === "/likes" && likeCount > 0 && (
                <span className="absolute -top-1 right-0 w-4 h-4 text-[9px] flex items-center justify-center rounded-full gradient-primary text-primary-foreground">{likeCount}</span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
