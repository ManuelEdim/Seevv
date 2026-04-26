import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import useAuthStore from "@/store/authStore";

const IDLE_MS        = 30 * 60 * 1000; // 30 min before warning
const WARNING_MS     = 2  * 60 * 1000; // warning lasts 2 min before hard logout
const WARNING_SECS   = 120;
const THROTTLE_MS    = 10_000;          // don't reset more than once per 10 s
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

const useSessionTimeout = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const storeLogout     = useAuthStore((s) => s.logout);

  const [showWarning, setShowWarning]   = useState(false);
  const [secondsLeft, setSecondsLeft]   = useState(WARNING_SECS);

  const idleTimer      = useRef(null);
  const hardTimer      = useRef(null);
  const countdownTimer = useRef(null);
  const lastReset      = useRef(0);
  const warningActive  = useRef(false);

  const clearAll = useCallback(() => {
    clearTimeout(idleTimer.current);
    clearTimeout(hardTimer.current);
    clearInterval(countdownTimer.current);
  }, []);

  const doSignOut = useCallback(async () => {
    clearAll();
    warningActive.current = false;
    setShowWarning(false);
    await supabase.auth.signOut();
    storeLogout();
    window.location.replace("/login?reason=timeout");
  }, [clearAll, storeLogout]);

  const startWarning = useCallback(() => {
    warningActive.current = true;
    setShowWarning(true);
    setSecondsLeft(WARNING_SECS);

    let secs = WARNING_SECS;
    countdownTimer.current = setInterval(() => {
      secs -= 1;
      setSecondsLeft(secs);
      if (secs <= 0) clearInterval(countdownTimer.current);
    }, 1000);

    hardTimer.current = setTimeout(doSignOut, WARNING_MS);
  }, [doSignOut]);

  // resetTimer is stored in a ref so the activity listener never becomes stale
  const resetTimer = useCallback(() => {
    const now = Date.now();
    if (now - lastReset.current < THROTTLE_MS) return;
    lastReset.current = now;

    clearAll();
    warningActive.current = false;
    setShowWarning(false);
    setSecondsLeft(WARNING_SECS);

    idleTimer.current = setTimeout(startWarning, IDLE_MS);
  }, [clearAll, startWarning]);

  const resetTimerRef = useRef(resetTimer);
  useEffect(() => { resetTimerRef.current = resetTimer; }, [resetTimer]);

  // Attach / detach activity listeners based on auth state
  useEffect(() => {
    if (!isAuthenticated) { clearAll(); return; }

    // Kick off immediately
    lastReset.current = Date.now();
    idleTimer.current = setTimeout(startWarning, IDLE_MS);

    const handleActivity = () => resetTimerRef.current();
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, handleActivity, { passive: true })
    );

    return () => {
      clearAll();
      ACTIVITY_EVENTS.forEach((e) =>
        window.removeEventListener(e, handleActivity)
      );
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const extendSession = useCallback(() => {
    lastReset.current = 0; // bypass throttle for explicit user action
    resetTimer();
  }, [resetTimer]);

  return { showWarning, secondsLeft, extendSession, doSignOut };
};

export default useSessionTimeout;
