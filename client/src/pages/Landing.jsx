import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store";

// ─── Tooltip ──────────────────────────────────────────────
const Tooltip = ({ text, children, position = "top" }) => {
  const [show, setShow] = useState(false);
  const posMap = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };
  const arrowMap = {
    top: "top-full left-1/2 -translate-x-1/2 -mt-1",
    bottom: "bottom-full left-1/2 -translate-x-1/2 mb-0",
  };
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={`absolute z-50 pointer-events-none ${posMap[position]}`}
        >
          <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
            {text}
          </div>
          {(position === "top" || position === "bottom") && (
            <div
              className={`absolute w-2 h-2 bg-gray-900 rotate-45 ${arrowMap[position]}`}
            />
          )}
        </div>
      )}
    </div>
  );
};

// ─── Parallax hook ────────────────────────────────────────
const useParallax = (speed = 0.15) => {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      setOffset(center * speed);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);
  return { ref, offset };
};

// ─── Hero dashboard illustration ──────────────────────────
const HeroDashboardIllustration = () => (
  <svg
    viewBox="0 0 500 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full drop-shadow-2xl"
    aria-hidden="true"
  >
    <rect
      x="12"
      y="12"
      width="476"
      height="376"
      rx="18"
      fill="rgba(255,255,255,0.08)"
      stroke="rgba(255,255,255,0.18)"
      strokeWidth="1.5"
    />
    <rect
      x="12"
      y="12"
      width="476"
      height="40"
      rx="18"
      fill="rgba(255,255,255,0.12)"
    />
    <rect x="12" y="36" width="476" height="16" fill="rgba(255,255,255,0.12)" />
    <circle cx="36" cy="32" r="5" fill="rgba(255,100,100,0.6)" />
    <circle cx="54" cy="32" r="5" fill="rgba(255,180,50,0.6)" />
    <circle cx="72" cy="32" r="5" fill="rgba(100,220,100,0.5)" />
    <rect
      x="150"
      y="22"
      width="200"
      height="20"
      rx="10"
      fill="rgba(255,255,255,0.08)"
    />
    <text
      x="250"
      y="36"
      fontSize="8.5"
      fill="rgba(255,255,255,0.45)"
      textAnchor="middle"
      fontFamily="system-ui, sans-serif"
    >
      seevv.io/editor
    </text>
    <rect
      x="12"
      y="52"
      width="108"
      height="336"
      rx="0"
      fill="rgba(0,0,0,0.15)"
    />
    <rect
      x="12"
      y="52"
      width="108"
      height="336"
      fill="rgba(255,255,255,0.03)"
    />
    <rect
      x="24"
      y="68"
      width="50"
      height="10"
      rx="5"
      fill="rgba(255,255,255,0.5)"
    />
    {[
      { y: 100, active: false },
      { y: 128, active: true },
      { y: 156, active: false },
      { y: 184, active: false },
      { y: 212, active: false },
    ].map((item) => (
      <g key={item.y}>
        <rect
          x="18"
          y={item.y - 10}
          width="96"
          height="24"
          rx="8"
          fill={item.active ? "rgba(255,255,255,0.18)" : "transparent"}
        />
        <circle
          cx="36"
          cy={item.y + 2}
          r="6"
          fill={
            item.active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)"
          }
        />
        <rect
          x="50"
          y={item.y - 1}
          width={item.active ? 50 : 38}
          height="4"
          rx="2"
          fill={
            item.active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)"
          }
        />
      </g>
    ))}
    <text
      x="132"
      y="84"
      fontSize="12"
      fontWeight="700"
      fill="rgba(255,255,255,0.9)"
      fontFamily="system-ui, sans-serif"
    >
      CV Rewriter
    </text>
    <text
      x="132"
      y="100"
      fontSize="9"
      fill="rgba(255,255,255,0.45)"
      fontFamily="system-ui, sans-serif"
    >
      Software Engineer — Stripe
    </text>
    <rect
      x="390"
      y="70"
      width="86"
      height="26"
      rx="13"
      fill="rgba(29,158,117,0.25)"
      stroke="rgba(29,158,117,0.5)"
      strokeWidth="1"
    />
    <circle cx="406" cy="83" r="5" fill="rgba(29,158,117,0.5)" />
    <text
      x="428"
      y="87"
      fontSize="10"
      fontWeight="700"
      fill="#1d9e75"
      textAnchor="middle"
      fontFamily="system-ui, sans-serif"
    >
      88% match
    </text>
    <rect
      x="130"
      y="110"
      width="356"
      height="6"
      rx="3"
      fill="rgba(255,255,255,0.08)"
    />
    <rect
      x="130"
      y="110"
      width="242"
      height="6"
      rx="3"
      fill="rgba(29,158,117,0.7)"
    />
    <text
      x="130"
      y="126"
      fontSize="8"
      fill="rgba(255,255,255,0.4)"
      fontFamily="system-ui, sans-serif"
    >
      68% bullets reviewed · 4 pending
    </text>
    <rect
      x="130"
      y="136"
      width="206"
      height="228"
      rx="12"
      fill="rgba(255,255,255,0.09)"
      stroke="rgba(255,255,255,0.12)"
      strokeWidth="1"
    />
    <circle cx="158" cy="162" r="18" fill="rgba(255,255,255,0.15)" />
    <circle cx="158" cy="156" r="7" fill="rgba(255,255,255,0.4)" />
    <ellipse cx="158" cy="172" rx="11" ry="7" fill="rgba(255,255,255,0.25)" />
    <rect
      x="182"
      y="152"
      width="70"
      height="7"
      rx="3.5"
      fill="rgba(255,255,255,0.7)"
    />
    <rect
      x="182"
      y="163"
      width="52"
      height="5"
      rx="2.5"
      fill="rgba(255,255,255,0.35)"
    />
    <line
      x1="142"
      y1="188"
      x2="324"
      y2="188"
      stroke="rgba(255,255,255,0.1)"
      strokeWidth="1"
    />
    <rect
      x="142"
      y="196"
      width="48"
      height="5"
      rx="2.5"
      fill="rgba(255,255,255,0.55)"
    />
    {[
      { y: 210, w: 140, state: "accepted" },
      { y: 222, w: 118, state: "accepted" },
      { y: 234, w: 130, state: "pending" },
      { y: 246, w: 100, state: "pending" },
      { y: 258, w: 122, state: "accepted" },
    ].map((b, i) => (
      <g key={i}>
        <circle
          cx="148"
          cy={b.y + 2}
          r="2.5"
          fill={b.state === "accepted" ? "#1d9e75" : "rgba(255,255,255,0.25)"}
        />
        <rect
          x="156"
          y={b.y}
          width={b.w}
          height="4"
          rx="2"
          fill={
            b.state === "accepted"
              ? "rgba(29,158,117,0.4)"
              : "rgba(255,255,255,0.18)"
          }
        />
      </g>
    ))}
    <line
      x1="142"
      y1="272"
      x2="324"
      y2="272"
      stroke="rgba(255,255,255,0.1)"
      strokeWidth="1"
    />
    <rect
      x="142"
      y="280"
      width="36"
      height="5"
      rx="2.5"
      fill="rgba(255,255,255,0.55)"
    />
    {[
      { y: 294, w: 132 },
      { y: 306, w: 110 },
      { y: 318, w: 126 },
    ].map((b, i) => (
      <g key={i}>
        <circle cx="148" cy={b.y + 2} r="2.5" fill="rgba(255,255,255,0.25)" />
        <rect
          x="156"
          y={b.y}
          width={b.w}
          height="4"
          rx="2"
          fill="rgba(255,255,255,0.18)"
        />
      </g>
    ))}
    <rect
      x="348"
      y="136"
      width="138"
      height="228"
      rx="12"
      fill="rgba(255,255,255,0.06)"
      stroke="rgba(255,255,255,0.1)"
      strokeWidth="1"
    />
    <text
      x="417"
      y="158"
      fontSize="9.5"
      fontWeight="600"
      fill="rgba(255,255,255,0.75)"
      textAnchor="middle"
      fontFamily="system-ui, sans-serif"
    >
      AI Suggestions
    </text>
    {[
      {
        y: 170,
        label: "Add quantifiable metric",
        color: "#1d9e75",
        sub: "↑ impact score",
      },
      {
        y: 204,
        label: "Insert keyword: 'Stripe'",
        color: "#ef9f27",
        sub: "ATS boost",
      },
      {
        y: 238,
        label: "Tone: more assertive",
        color: "#534ab7",
        sub: "voice match",
      },
      {
        y: 272,
        label: "Cut filler words",
        color: "#d85a30",
        sub: "clarity +40%",
      },
    ].map((s) => (
      <g key={s.y}>
        <rect
          x="356"
          y={s.y}
          width="122"
          height="28"
          rx="8"
          fill="rgba(255,255,255,0.06)"
        />
        <circle cx="368" cy={s.y + 9} r="4" fill={`${s.color}30`} />
        <circle cx="368" cy={s.y + 9} r="2.5" fill={s.color} />
        <rect
          x="378"
          y={s.y + 5}
          width="64"
          height="3.5"
          rx="1.75"
          fill="rgba(255,255,255,0.5)"
        />
        <rect
          x="378"
          y={s.y + 13}
          width="44"
          height="3"
          rx="1.5"
          fill={`${s.color}80`}
        />
      </g>
    ))}
    <rect
      x="356"
      y="316"
      width="56"
      height="20"
      rx="10"
      fill="rgba(29,158,117,0.3)"
      stroke="rgba(29,158,117,0.5)"
      strokeWidth="1"
    />
    <text
      x="384"
      y="330"
      fontSize="9"
      fontWeight="600"
      fill="#1d9e75"
      textAnchor="middle"
      fontFamily="system-ui, sans-serif"
    >
      ✓ Accept
    </text>
    <rect
      x="420"
      y="316"
      width="56"
      height="20"
      rx="10"
      fill="rgba(216,90,48,0.2)"
      stroke="rgba(216,90,48,0.4)"
      strokeWidth="1"
    />
    <text
      x="448"
      y="330"
      fontSize="9"
      fontWeight="600"
      fill="#d85a30"
      textAnchor="middle"
      fontFamily="system-ui, sans-serif"
    >
      ✕ Reject
    </text>
    <rect
      x="340"
      y="4"
      width="156"
      height="48"
      rx="12"
      fill="white"
      stroke="rgba(0,0,0,0.07)"
      strokeWidth="1"
    />
    <rect
      x="350"
      y="14"
      width="28"
      height="28"
      rx="8"
      fill="rgba(29,158,117,0.12)"
    />
    <text
      x="364"
      y="33"
      fontSize="13"
      textAnchor="middle"
      fill="#1d9e75"
      fontFamily="system-ui, sans-serif"
    >
      ✓
    </text>
    <rect
      x="386"
      y="16"
      width="72"
      height="5"
      rx="2.5"
      fill="#1a1a1a"
      opacity="0.85"
    />
    <rect x="386" y="25" width="54" height="4" rx="2" fill="#999" />
    <rect x="386" y="34" width="40" height="3.5" rx="1.75" fill="#ccc" />
  </svg>
);

// ─── Navbar ───────────────────────────────────────────────
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Services", href: "#services" },
    { label: "How it works", href: "#how" },
    { label: "Pricing", href: "#pricing" },
    { label: "Partners", href: "#partners" },
    { label: "Contact", href: "#contact" },
  ];

  const scrollTo = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-white/96 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => scrollTo("#home")}
            className="cursor-pointer shrink-0"
          >
            <img
              src={scrolled ? "/logo.png" : "/altnewlogo.png"}
              alt="Seevv"
              className="h-10 object-contain transition-all duration-300"
            />
          </button>
          <div className="hidden lg:flex items-center gap-0.5">
            {links.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${scrolled ? "text-gray-600 hover:text-brand-600 hover:bg-brand-50" : "text-white/80 hover:text-white hover:bg-white/10"}`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="text-sm font-semibold px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-px"
              >
                Go to dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${scrolled ? "text-gray-700 hover:text-brand-600" : "text-white/90 hover:text-white"}`}
                >
                  Sign in
                </Link>
                <Tooltip text="No credit card required" position="bottom">
                  <Link
                    to="/signup"
                    className="text-sm font-semibold px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-px"
                  >
                    Get started free →
                  </Link>
                </Tooltip>
              </>
            )}
          </div>
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-gray-700" : "text-white"}`}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1 shadow-xl">
          {links.map((l) => (
            <button
              key={l.href}
              onClick={() => scrollTo(l.href)}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
            >
              {l.label}
            </button>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full text-center py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-800 transition-colors"
              >
                Go to dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="w-full text-center py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-800 transition-colors"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// ─── Hero section ─────────────────────────────────────────
const HeroSection = () => {
  const { ref: blobRef, offset: blobOffset } = useParallax(0.2);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return (
    <section
      id="home"
      className="relative bg-brand-600 flex min-h-screen items-center overflow-hidden pt-16"
    >
      <div className="absolute inset-0 opacity-[0.07]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="hero-grid"
              width="52"
              height="52"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 52 0 L 0 0 0 52"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>
      <div ref={blobRef} className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-brand-400 rounded-full filter blur-3xl opacity-25"
          style={{ transform: `translateY(${blobOffset * 0.6}px)` }}
        />
        <div
          className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] bg-teal-400 rounded-full filter blur-3xl opacity-15"
          style={{ transform: `translateY(${-blobOffset * 0.4}px)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-brand-800 rounded-full filter blur-3xl opacity-20"
          style={{
            transform: `translateY(${blobOffset * 0.3}px) translateX(-50%)`,
          }}
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-20 lg:pb-32 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="fade-in-up">
            <div className="inline-flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
              </span>
              <span className="text-xs font-semibold text-white/90 tracking-wide">
                AI-powered career intelligence
              </span>
            </div>
            <h1 className="text-5xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.05] mb-7 tracking-tight">
              Every top company&nbsp;has a{" "}
              <span className="text-teal-400 italic">code.</span>
              <span className="text-white/60 text-4xl sm:text-5xl lg:text-5xl font-bold">
                &nbsp;Seevv cracks it.
              </span>
            </h1>
            <p className="text-brand-200 text-lg leading-relaxed mb-10 max-w-lg">
              We decode what hiring managers actually look for, rewrite your CV
              bullet by bullet to match, and generate voice-matched cover
              letters, so you don't just apply, you <em>arrive</em>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to={isAuthenticated ? "/dashboard" : "/signup"}
                className="px-8 py-4 bg-white text-brand-600 font-bold rounded-2xl text-base hover:bg-teal-400 hover:text-white transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 text-center"
              >
                {isAuthenticated ? "Go to your dashboard →" : "Start for free, no card needed"}
              </Link>
              <Tooltip text="See how it works in 2 min" position="bottom">
                <button
                  onClick={() =>
                    document
                      .querySelector("#how")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="px-8 py-4 bg-white/10 border border-white/25 text-white font-semibold rounded-2xl text-base hover:bg-white/20 transition-all text-center cursor-pointer w-full backdrop-blur-sm"
                >
                  ▷ Watch it in action
                </button>
              </Tooltip>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {["#7f77dd", "#1d9e75", "#ef9f27", "#d85a30", "#534ab7"].map(
                  (c, i) => (
                    <Tooltip
                      key={i}
                      text={["Adaeze", "James", "Miriam", "Kofi", "Sara"][i]}
                      position="top"
                    >
                      <div
                        className="w-9 h-9 rounded-full border-2 border-brand-600 flex items-center justify-center text-xs font-bold text-white cursor-default"
                        style={{ backgroundColor: c }}
                      >
                        {["A", "J", "M", "K", "S"][i]}
                      </div>
                    </Tooltip>
                  ),
                )}
              </div>
              <p className="text-brand-200 text-sm">
                <span className="text-white font-bold">2,400+</span> job seekers
                landed interviews this month
              </p>
            </div>
          </div>
          <div className="relative hero-float">
            <HeroDashboardIllustration />
            <div className="absolute -left-6 top-12 bg-white rounded-2xl shadow-2xl px-4 py-3.5 flex items-center gap-3 animate-slide-down border border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1d9e75"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">
                  Match improved
                </p>
                <p className="text-xs text-gray-400">
                  54% →{" "}
                  <span className="text-teal-600 font-bold text-sm">88%</span>
                </p>
              </div>
            </div>
            <div className="absolute -right-6 bottom-20 bg-white rounded-2xl shadow-2xl px-4 py-3.5 border border-gray-100">
              <p className="text-xs text-gray-400 mb-2 font-medium">
                ATS keywords matched
              </p>
              <div className="flex gap-1.5 flex-wrap max-w-36">
                {["React", "TypeScript", "Node.js", "Stripe API"].map((k) => (
                  <Tooltip
                    key={k}
                    text="Found in job description"
                    position="top"
                  >
                    <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-full font-semibold cursor-default">
                      {k}
                    </span>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 leading-none">
        <svg
          viewBox="0 0 1440 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full block"
        >
          <path
            d="M0,130 L0,80 C360,130 720,30 1080,80 C1260,105 1380,55 1440,80 L1440,130 Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
};

// ─── Stats strip ──────────────────────────────────────────
const StatsSection = () => (
  <section className="bg-white border-b border-gray-100">
    <div className="max-w-5xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
      {[
        { value: "2,400+", label: "Interviews landed this month" },
        { value: "88%", label: "Average CV match score improvement" },
        { value: "15K+", label: "CVs tailored and exported" },
      ].map((s) => (
        <div key={s.label}>
          <p className="text-4xl font-bold text-brand-600 mb-1">{s.value}</p>
          <p className="text-sm text-gray-500">{s.label}</p>
        </div>
      ))}
    </div>
  </section>
);

// ─── Who it's for ─────────────────────────────────────────
const WhoSection = () => (
  <section className="bg-white py-20 overflow-hidden">
    <div className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left — photo collage */}
        <div className="relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl">
            <img
              src="/img1.jpg"
              alt="Diverse professionals — engineer, tech, healthcare, student"
              className="w-full object-cover object-top"
              style={{ height: "380px" }}
            />
          </div>
          {/* Floating stat card */}
          <div className="absolute -bottom-5 -right-5 bg-white rounded-2xl shadow-xl border border-gray-100 px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d9e75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">15,000+</p>
              <p className="text-xs text-gray-400">active job seekers</p>
            </div>
          </div>
        </div>

        {/* Right — copy */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">
            Built for everyone
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-5">
            Whatever your career path,<br />
            <span className="text-brand-600">Seevv has you covered.</span>
          </h2>
          <p className="text-gray-500 text-base leading-relaxed mb-8">
            Whether you're a fresh graduate, switching industries, climbing the ladder, or returning
            after a break — Seevv reads job descriptions the way hiring managers do and rewrites
            your CV to match, bullet by bullet.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: "⚙️", role: "Engineers & Tech", desc: "ATS keywords, stack alignment" },
              { emoji: "🩺", role: "Healthcare & Science", desc: "Credentials & research framing" },
              { emoji: "🎨", role: "Creatives & Design", desc: "Portfolio + impact storytelling" },
              { emoji: "🎓", role: "Students & Grads", desc: "Turn potential into proof" },
              { emoji: "📊", role: "Finance & Legal", desc: "Precision language, compliance" },
              { emoji: "🤝", role: "Sales & Operations", desc: "Numbers-led, results-first" },
            ].map((p) => (
              <div key={p.role} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-xl shrink-0">{p.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-gray-900">{p.role}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── About / Pain section ──────────────────────────────────
const AboutSection = () => (
  <section id="about" className="bg-gray-50 py-20 overflow-hidden">
    <div className="max-w-6xl mx-auto px-6">
      {/* Pain half — the problem */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
        {/* Copy */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-coral-500 mb-3">
            Sound familiar?
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-5">
            Sending the same CV<br />to every job isn't a strategy.
          </h2>
          <p className="text-gray-500 text-base leading-relaxed mb-6">
            Most job seekers are stuck in a loop — applying to dozens of roles with a generic CV,
            getting silence in return, wondering what they're doing wrong.
          </p>
          <div className="space-y-3">
            {[
              "Ghosted after submitting a strong application",
              "Unsure what the job description actually wants",
              "Rewriting the same bullet points for every role",
              "Competing against hundreds of applicants for one seat",
            ].map((pain) => (
              <div key={pain} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-coral-100 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">{pain}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Photo — the waiting room */}
        <div className="relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl">
            <img
              src="/img2.jpg"
              alt="Job seekers in a waiting room reviewing CVs"
              className="w-full object-cover object-center"
              style={{ height: "400px" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent" />
          </div>
          {/* Overlay caption */}
          <div className="absolute bottom-5 left-5 right-5 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
            <p className="text-xs text-gray-600 font-medium">
              Competing against hundreds of CVs for every seat. There's a smarter way.
            </p>
          </div>
        </div>
      </div>

      {/* Solution half — Seevv's answer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Photo — the confident professional */}
        <div className="relative order-2 lg:order-1">
          <div className="rounded-3xl overflow-hidden shadow-2xl">
            <img
              src="/img4.jpg"
              alt="Confident professional, ready to apply"
              className="w-full object-cover object-center"
              style={{ height: "400px" }}
            />
          </div>
          {/* Floating match card */}
          <div className="absolute -top-5 -right-5 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3">
            <p className="text-[10px] text-gray-400 mb-1 font-medium">Match improved</p>
            <p className="text-sm font-bold text-gray-800">
              54% → <span className="text-teal-600">92%</span>
            </p>
          </div>
          <div className="absolute -bottom-5 -left-5 bg-brand-600 rounded-2xl shadow-xl px-4 py-3 text-white">
            <p className="text-[10px] text-brand-200 mb-0.5">Time saved</p>
            <p className="text-sm font-bold">5 min per app</p>
          </div>
        </div>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">
            About Seevv
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-5">
            The gap between a good CV<br />and a great one is intelligence.
          </h2>
          <p className="text-gray-500 text-base leading-relaxed mb-6">
            Seevv reads job descriptions the way hiring managers do — decoding hidden requirements,
            ATS filters, and cultural signals — then rewrites your CV to match, bullet by bullet.
            In minutes, not hours.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: "🔍", title: "Deep Decoder", desc: "Unpack what a job description actually wants beyond the words on the page." },
              { icon: "✏️", title: "CV Rewriter", desc: "Your achievements, sharper. Matched to the role. In your voice." },
              { icon: "🎯", title: "Match Score", desc: "Know exactly how strong your application is before you send it." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-0.5">{item.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Services section ─────────────────────────────────────
const ServicesSection = () => (
  <section id="services" className="bg-white py-20">
    <div className="max-w-5xl mx-auto px-6">
      <div className="text-center mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">
          What Seevv does
        </p>
        <h2 className="text-3xl font-bold text-gray-900">
          Everything you need to land the role
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          {
            icon: "🧠",
            title: "Deep Decoder",
            desc: "Decode a job posting's hidden requirements, culture signals, and ATS keywords before you apply.",
            tag: "Core",
          },
          {
            icon: "📝",
            title: "CV Tailoring",
            desc: "Rewrite every bullet to match the job description — impact-first, voice-matched, ATS-optimised.",
            tag: "Core",
          },
          {
            icon: "💌",
            title: "Cover Letters",
            desc: "Generate a personalised, voice-matched cover letter in seconds. Formal, conversational, or bold.",
            tag: "Core",
          },
          {
            icon: "🗺️",
            title: "Gap Roadmap",
            desc: "See exactly which skills you're missing and get a micro-project plan to fill the gap.",
            tag: "Intelligence",
          },
          {
            icon: "🏭",
            title: "Transition Mode",
            desc: "Moving industries? Seevv reframes your experience in the language of your target sector.",
            tag: "Intelligence",
          },
          {
            icon: "🎤",
            title: "Mock Interview",
            desc: "5 stress-test questions drawn from your actual CV. Answer by voice, get instant coaching.",
            tag: "Interview",
          },
        ].map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-gray-100 p-5 hover:border-brand-200 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                {s.tag}
              </span>
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">{s.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── How it works ─────────────────────────────────────────
const HowSection = () => (
  <section id="how" className="bg-gray-50 py-20">
    <div className="max-w-4xl mx-auto px-6">
      <div className="text-center mb-14">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">
          How it works
        </p>
        <h2 className="text-3xl font-bold text-gray-900">
          From upload to interview — in minutes
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {[
          {
            step: "01",
            title: "Upload your CV",
            desc: "Upload your existing CV. Seevv extracts your experience, skills, and achievements automatically.",
          },
          {
            step: "02",
            title: "Add a job target",
            desc: "Paste a job URL or description. Seevv decodes what the company actually needs.",
          },
          {
            step: "03",
            title: "Tailor and apply",
            desc: "Get your CV rewritten for the role, generate a cover letter, then export a polished PDF.",
          },
        ].map((item) => (
          <div key={item.step} className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
              {item.step}
            </div>
            <p className="text-base font-bold text-gray-900 mb-2">
              {item.title}
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-12">
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-800 transition-all shadow-md hover:-translate-y-px"
        >
          Try it free — no card needed →
        </Link>
      </div>
    </div>
  </section>
);

// ─── Testimonials ─────────────────────────────────────────
const TestimonialsSection = () => (
  <section className="bg-white py-20">
    <div className="max-w-5xl mx-auto px-6">
      <div className="text-center mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">
          What users say
        </p>
        <h2 className="text-3xl font-bold text-gray-900">
          Real results from real job seekers
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            name: "Adaeze O.",
            role: "Product Manager, Lagos",
            quote:
              "I went from zero callbacks to 3 interviews in 2 weeks. The Deep Decoder showed me what I was missing every time.",
            avatar: "#7f77dd",
            initial: "A",
          },
          {
            name: "James K.",
            role: "Software Engineer, London",
            quote:
              "My match score went from 54% to 88% on the first tailor. Got an interview at Stripe within 10 days.",
            avatar: "#1d9e75",
            initial: "J",
          },
          {
            name: "Miriam T.",
            role: "Data Analyst, Abuja",
            quote:
              "The cover letter generator sounds exactly like me. My recruiter actually commented on how personal it felt.",
            avatar: "#ef9f27",
            initial: "M",
          },
        ].map((t) => (
          <div
            key={t.name}
            className="bg-gray-50 rounded-2xl border border-gray-100 p-6"
          >
            <p className="text-sm text-gray-700 leading-relaxed mb-5 italic">
              "{t.quote}"
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: t.avatar }}
              >
                {t.initial}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Pricing section ──────────────────────────────────────
const plans = [
  {
    id: "free",
    name: "Free",
    usd: 0,
    ngn: 0,
    gbp: 0,
    desc: "Explore the core features.",
    cta: "Start free",
    features: [
      "1 CV, 3 job targets",
      "Deep Decoder (3/mo)",
      "CV tailoring (3 versions)",
      "Cover letter (3/mo)",
      "PDF export",
    ],
    highlight: false,
  },
  {
    id: "starter",
    name: "Starter",
    usd: 9,
    ngn: 14500,
    gbp: 7,
    desc: "For active job seekers.",
    cta: "Get Starter",
    features: [
      "3 CVs, 15 job targets",
      "Deep Decoder (unlimited)",
      "CV tailoring (15 versions)",
      "Cover letter (unlimited)",
      "Voice mirroring",
      "Gap Roadmap + Company Intel",
    ],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    usd: 19,
    ngn: 30000,
    gbp: 15,
    desc: "Full intelligence layer.",
    cta: "Get Pro",
    features: [
      "Unlimited CVs & job targets",
      "Everything in Starter",
      "Transition Mode",
      "Speed Mode (10 jobs at once)",
      "Interview Prep + Mock Interview",
      "Application Analytics",
    ],
    highlight: true,
  },
  {
    id: "pro_plus",
    name: "Pro+",
    usd: 39,
    ngn: 62000,
    gbp: 31,
    desc: "Power users & teams.",
    cta: "Get Pro+",
    features: [
      "Everything in Pro",
      "Verification badge",
      "Recruiter-mode profile",
      "Custom branding on exports",
      "API access (beta)",
      "Dedicated support",
    ],
    highlight: false,
  },
];

const PricingSection = () => {
  const [currency, setCurrency] = useState("USD");
  const sym = { USD: "$", NGN: "₦", GBP: "£" };
  const getPrice = (p) => ({ USD: p.usd, NGN: p.ngn, GBP: p.gbp })[currency];

  return (
    <section id="pricing" className="bg-gray-50 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">
            Pricing
          </p>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Simple, transparent pricing
          </h2>
          <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1 gap-1">
            {["USD", "NGN", "GBP"].map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer ${currency === c ? "bg-brand-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
              >
                {sym[c]} {c}
              </button>
            ))}
          </div>
          {currency === "NGN" && (
            <p className="text-xs text-teal-600 font-medium mt-3">
              Nigerian Naira pricing — pay securely via Paystack
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border-2 p-6 flex flex-col transition-all ${p.highlight ? "border-brand-600 shadow-xl" : "border-gray-100 shadow-card"}`}
            >
              {p.highlight && (
                <div className="text-[10px] font-bold uppercase tracking-widest text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-3 py-1 mb-4 self-start">
                  Most popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-900">{p.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
              </div>
              <div className="mb-5">
                <span className="text-4xl font-bold text-gray-900">
                  {p.usd === 0
                    ? "Free"
                    : `${sym[currency]}${getPrice(p).toLocaleString()}`}
                </span>
                {p.usd > 0 && (
                  <span className="text-sm text-gray-400 ml-1">/mo</span>
                )}
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-xs text-gray-700"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-teal-500 shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={p.usd === 0 ? "/signup" : "/signup"}
                className={`w-full text-center py-3 rounded-xl text-sm font-semibold transition-all ${p.highlight ? "bg-brand-600 text-white hover:bg-brand-800" : "border border-gray-200 text-gray-700 hover:border-brand-300 hover:text-brand-600"}`}
              >
                {p.cta} →
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Billing integration launching soon — sign up free today and upgrade
          when ready.
        </p>
      </div>
    </section>
  );
};

// ─── Partners section ─────────────────────────────────────
const PartnersSection = () => (
  <section id="partners" className="bg-white py-16 border-t border-gray-100">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">
        Trusted for roles at
      </p>
      <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
        {[
          "Google",
          "Stripe",
          "Shopify",
          "Meta",
          "Flutterwave",
          "Paystack",
          "GTBank",
          "Interswitch",
        ].map((c) => (
          <span
            key={c}
            className="text-sm font-semibold text-gray-300 hover:text-gray-500 transition-colors cursor-default"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  </section>
);

// ─── Contact section ──────────────────────────────────────
const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="bg-gray-50 py-20">
      <div className="max-w-xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">
            Contact
          </p>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Get in touch
          </h2>
          <p className="text-sm text-gray-500">
            Have a question or want to partner with us? We'd love to hear from
            you.
          </p>
        </div>
        {sent ? (
          <div className="text-center bg-teal-50 border border-teal-100 rounded-2xl p-8">
            <p className="text-2xl mb-3">✓</p>
            <p className="text-sm font-semibold text-teal-800">Message sent!</p>
            <p className="text-xs text-teal-600 mt-1">
              We'll get back to you within 24 hours.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="How can we help?"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-800 transition-all disabled:opacity-60 cursor-pointer"
            >
              {sending ? "Sending…" : "Send message →"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

// ─── Footer ───────────────────────────────────────────────
const FooterCol = ({ title, links }) => (
  <div>
    <p className="font-bold text-white/60 mb-4 uppercase tracking-widest text-[10px]">{title}</p>
    <ul className="space-y-2.5">
      {links.map(({ label, to, href }) => (
        <li key={label}>
          {to ? (
            <Link to={to} className="text-xs text-white/40 hover:text-white/80 transition-colors">
              {label}
            </Link>
          ) : href ? (
            <a href={href} className="text-xs text-white/40 hover:text-white/80 transition-colors">
              {label}
            </a>
          ) : (
            <span className="text-xs text-white/40">{label}</span>
          )}
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return (
  <footer className="bg-brand-900 text-white">
    {/* Main footer body */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
        {/* Brand column — takes 2 of 5 columns on desktop */}
        <div className="lg:col-span-2 space-y-4">
          <img
            src="/altnewlogo.png"
            alt="Seevv"
            className="h-9 brightness-0 invert opacity-90"
          />
          <p className="text-sm text-white/45 leading-relaxed max-w-sm">
            AI-powered career intelligence. Decode job descriptions, tailor your
            CV bullet by bullet, and land more interviews.
          </p>
          <div className="flex items-center gap-3 pt-1">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-colors"
              >
                Go to dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-colors"
                >
                  Get started free
                </Link>
                <Link
                  to="/login"
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Sign in →
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Link columns — 3 of 5 columns on desktop */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
          <FooterCol
            title="Product"
            links={[
              { label: "Deep Decoder", to: "/decoder" },
              { label: "CV Tailoring", to: "/cv-manager" },
              { label: "Cover Letters", to: "/cover-letter" },
              { label: "Interview Prep", to: "/interview-prep" },
              { label: "Skills Graph", to: "/skills-graph" },
              { label: "Speed Mode", to: "/speed-mode" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: "Pricing", to: "/pricing" },
              { label: "Contact", href: "mailto:hello@seevv.com" },
              { label: "About", to: "/" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { label: "Privacy Policy", to: "/privacy" },
              { label: "Terms of Use", to: "/terms" },
            ]}
          />
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-white/25">
          © {new Date().getFullYear()} Seevv. All rights reserved.
        </p>
        <p className="text-xs text-white/25">Made with ♥ for ambitious job seekers</p>
      </div>
    </div>
  </footer>
  );
};

// ─── Root ─────────────────────────────────────────────────
const Landing = () => (
  <div className="font-sans antialiased">
    <Navbar />
    <HeroSection />
    <StatsSection />
    <WhoSection />
    <AboutSection />
    <ServicesSection />
    <HowSection />
    <TestimonialsSection />
    <PricingSection />
    <PartnersSection />
    <ContactSection />
    <Footer />
  </div>
);

export default Landing;
