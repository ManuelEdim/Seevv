const SessionTimeoutWarning = ({ secondsLeft, onExtend, onSignOut }) => {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, "0")}`;
  const urgent = secondsLeft <= 30;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 transition-colors ${urgent ? "bg-red-50" : "bg-amber-50"}`}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={urgent ? "#ef4444" : "#d97706"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h2 className="text-base font-bold text-gray-900 mb-1">
          Session expiring soon
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          You've been inactive. Your session will end in
        </p>

        {/* Countdown */}
        <div className={`text-4xl font-bold tabular-nums mb-6 transition-colors ${urgent ? "text-red-500" : "text-amber-500"}`}>
          {timeStr}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onExtend}
            className="flex-1 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-800 transition-colors cursor-pointer"
          >
            Stay logged in
          </button>
          <button
            onClick={onSignOut}
            className="flex-1 py-2.5 border border-gray-200 text-sm font-semibold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;
