import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useMatchStore } from "@/store/useMatchStore";
import { useChatStore } from "@/store/useChatStore";
import { Heart, MessageCircle, Compass, User, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { userService } from "@/services/user.service";
import type { MockUser } from "@/mocks/users";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const matchCount = useMatchStore((s) => s.matches.length);
  const conversations = useChatStore((s) => s.conversations);
  const messageCount = Object.values(conversations).reduce((a, b) => a + b.length, 0);
  const [newUsers, setNewUsers] = useState<MockUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    userService.getDiscoverUsers().then((users) => {
      setNewUsers(users.slice(0, 6));
      setLoadingUsers(false);
    });
  }, []);

  const cards = [
    { to: "/discover", icon: Compass, label: "Discover", desc: "Find new people", color: "gradient-primary" },
    { to: "/matches", icon: Heart, label: "Matches", desc: `${matchCount} matches`, color: "bg-accent" },
    { to: "/chat", icon: MessageCircle, label: "Messages", desc: `${messageCount} messages`, color: "bg-success" },
    { to: "/profile", icon: User, label: "Profile", desc: "Edit your profile", color: "bg-secondary" },
  ];

  return (
    <div className="max-w-lg mx-auto p-4 fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Hey, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Ready to find your match?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">{card.label}</h3>
            <p className="text-sm text-muted-foreground">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-2xl gradient-primary glow-primary text-center">
        <h2 className="text-lg font-bold text-primary-foreground">Start Swiping!</h2>
        <p className="text-primary-foreground/80 text-sm mt-1">New profiles are waiting for you</p>
        <Link
          to="/discover"
          className="mt-3 inline-block px-6 py-2 rounded-xl bg-background/20 text-primary-foreground font-medium hover:bg-background/30 transition-colors"
        >
          Go to Discover →
        </Link>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            New People
          </h2>
          <Link to="/discover" className="text-sm text-primary hover:underline">
            See all
          </Link>
        </div>

        {loadingUsers ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[140px] h-48 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {newUsers.map((u) => (
              <Link
                key={u.id}
                to="/discover"
                className="min-w-[140px] snap-start rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-all group"
              >
                <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/90 to-transparent" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold">
                    NEW
                  </span>
                </div>
                <div className="p-2.5">
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {u.name.split(" ")[0]}, {u.age}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {u.location}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
