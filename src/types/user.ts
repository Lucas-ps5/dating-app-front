export interface UserSummary {
  id: string;
  username: string;
  photos: string[];
  isOnline?: boolean;
  lastOnlineAt?: string | null;
}
