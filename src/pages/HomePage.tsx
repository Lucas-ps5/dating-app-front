import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Heart,
  MessageCircle,
  Compass,
  User,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFetchMatchsCount } from "@/composables/useFetchMatchsCount";
import { useDiscoverUsers } from "@/composables/useDiscoverUsers";
import { calculateAge, formatLocation } from "@/utils/discover";
import { useGetMyUnreadMessagesCount } from "@/composables/useGetMyUnreadMessagesCount";
import { Image } from "@/components/ui/Image";

export default function HomePage() {
  const { t } = useTranslation("home");
  const { userInfo } = useAuth();

  const { data: matchCountData } = useFetchMatchsCount();
  const { data: messagesCountData } = useGetMyUnreadMessagesCount();
  const { data: discoverData, isLoading: loadingUsers } = useDiscoverUsers({
    limit: 6,
  });

  const matchCount = matchCountData?.count ?? 0;
  const messagesCount = messagesCountData?.count ?? 0;
  const newUsers = discoverData?.data?.slice(0, 6) ?? [];

  const rawName =
    (userInfo?.name as string) ||
    (userInfo?.preferred_username as string) ||
    "";
  const firstName = rawName ? rawName.split(" ")[0] : "";

  const cards = [
    {
      to: "/discover",
      icon: Compass,
      label: t("cards.discover.title"),
      desc: t("cards.discover.desc"),
      color: "gradient-primary",
    },
    {
      to: "/matches",
      icon: Heart,
      label: t("cards.matches.title"),
      desc: t("cards.matches.desc", { count: matchCount }),
      color: "bg-accent",
    },
    {
      to: "/chat",
      icon: MessageCircle,
      label: t("cards.messages.title"),
      desc: t("cards.messages.desc", { count: messagesCount }),
      color: "bg-success",
    },
    {
      to: "/profile",
      icon: User,
      label: t("cards.profile.title"),
      desc: t("cards.profile.desc"),
      color: "bg-secondary",
    },
  ];

  return (
    <div className="max-w-lg mx-auto p-4 fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {firstName
            ? t("greeting", { name: firstName })
            : t("defaultGreeting")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group"
          >
            <div
              className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}
            >
              <card.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">{card.label}</h3>
            <p className="text-sm text-muted-foreground">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-2xl gradient-primary glow-primary text-center">
        <h2 className="text-lg font-bold text-primary-foreground">
          {t("banner.title")}
        </h2>
        <p className="text-primary-foreground/80 text-sm mt-1">
          {t("banner.subtitle")}
        </p>
        <Link
          to="/discover"
          className="mt-3 inline-block px-6 py-2 rounded-xl bg-background/20 text-primary-foreground font-medium hover:bg-background/30 transition-colors"
        >
          {t("banner.cta")}
        </Link>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t("newPeople.title")}
          </h2>
          <Link to="/discover" className="text-sm text-primary hover:underline">
            {t("newPeople.seeAll")}
          </Link>
        </div>

        {loadingUsers ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[140px] h-48 rounded-2xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {newUsers.map((u) => {
              const age = calculateAge(u.birthdate);
              const location = formatLocation(u.city, u.country);
              const photo =
                u.photos && u.photos.length > 0 ? u.photos[0] : null;

              return (
                <Link
                  key={u.id || u.username}
                  to={`/users/${u.id}`}
                  className="min-w-[140px] snap-start rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-all group"
                >
                  <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                    {photo ? (
                      <Image
                        isLocal={false}
                        url={photo}
                        alt={u.username || "User"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/90 to-transparent" />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold">
                      {t("newPeople.badge")}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {u.username || "Member"}
                      {age !== null && `, ${age}`}
                    </h3>
                    {location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {location}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
