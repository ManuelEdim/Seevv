import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store";

const STORAGE_KEY = "seevv_seen_notifs";

const BADGE_LABELS = {
  identity: "Identity",
  employment: "Employment",
  education: "Education",
  skills: "Skills",
};

const getSeenIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const saveSeenIds = (ids) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
};

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenRef = useRef(getSeenIds());

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("verification_requests")
      .select("user_id, badge_type, status, requested_at")
      .eq("user_id", user.id)
      .in("status", ["approved", "rejected"])
      .order("requested_at", { ascending: false })
      .limit(20);

    if (error || !data) return;

    const notifs = data.map((r) => ({
      id: `${r.user_id}::${r.badge_type}`,
      badgeType: r.badge_type,
      badgeLabel: BADGE_LABELS[r.badge_type] || r.badge_type,
      status: r.status,
      date: r.requested_at,
    }));

    const unseen = notifs.filter((n) => !seenRef.current.has(n.id));
    setNotifications(notifs);
    setUnreadCount(unseen.length);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  const markAllRead = useCallback(() => {
    const allIds = new Set(notifications.map((n) => n.id));
    seenRef.current = allIds;
    saveSeenIds(allIds);
    setUnreadCount(0);
  }, [notifications]);

  return { notifications, unreadCount, markAllRead };
}
