import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

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
        <div className={`absolute z-50 pointer-events-none ${posMap[position]}`}>
          <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
            {text}
          </div>
          {(position === "top" || position === "bottom") && (
            <div className={`absolute w-2 h-2 bg-gray-900 rotate-45 ${arrowMap[position]}`} />
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

// ─── Scroll reveal hook ───────────────────────────────────

const useScrollReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
};

// ─── Hero dashboard illustration ──────────────────────────

const HeroDashboardIllustration = () => (
  <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl" aria-hidden="true">
    {/* App window */}
    <rect x="12" y="12" width="476" height="376" rx="18" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"/>
    {/* Title bar */}
    <rect x="12" y="12" width="476" height="40" rx="18" fill="rgba(255,255,255,0.12)"/>
    <rect x="12" y="36" width="476" height="16" fill="rgba(255,255,255,0.12)"/>
    <circle cx="36" cy="32" r="5" fill="rgba(255,100,100,0.6)"/>
    <circle cx="54" cy="32" r="5" fill="rgba(255,180,50,0.6)"/>
    <circle cx="72" cy="32" r="5" fill="rgba(100,220,100,0.5)"/>
    {/* URL bar */}
    <rect x="150" y="22" width="200" height="20" rx="10" fill="rgba(255,255,255,0.08)"/>
    <text x="250" y="36" fontSize="8.5" fill="rgba(255,255,255,0.45)" textAnchor="middle" fontFamily="system-ui, sans-serif">seevv.io/editor</text>
    {/* Sidebar */}
    <rect x="12" y="52" width="108" height="336" rx="0" fill="rgba(0,0,0,0.15)"/>
    <rect x="12" y="52" width="108" height="336" fill="rgba(255,255,255,0.03)"/>
    {/* Sidebar logo */}
    <rect x="24" y="68" width="50" height="10" rx="5" fill="rgba(255,255,255,0.5)"/>
    {/* Sidebar nav */}
    {[
      { y: 100, label: "Dashboard", icon: "⊞", active: false },
      { y: 128, label: "CV Editor", icon: "✏", active: true },
      { y: 156, label: "Job Targets", icon: "◎", active: false },
      { y: 184, label: "Cover Letters", icon: "✉", active: false },
      { y: 212, label: "Profile", icon: "◉", active: false },
    ].map((item) => (
      <g key={item.y}>
        <rect x="18" y={item.y - 10} width="96" height="24" rx="8"
          fill={item.active ? "rgba(255,255,255,0.18)" : "transparent"}/>
        <circle cx="36" cy={item.y + 2} r="6"
          fill={item.active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)"}/>
        <rect x="50" y={item.y - 1} width={item.active ? 50 : 38} height="4" rx="2"
          fill={item.active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)"}/>
      </g>
    ))}
    {/* Main content */}
    {/* Top bar */}
    <text x="132" y="84" fontSize="12" fontWeight="700" fill="rgba(255,255,255,0.9)" fontFamily="system-ui, sans-serif">CV Rewriter</text>
    <text x="132" y="100" fontSize="9" fill="rgba(255,255,255,0.45)" fontFamily="system-ui, sans-serif">Software Engineer — Stripe</text>
    {/* Match score pill */}
    <rect x="390" y="70" width="86" height="26" rx="13" fill="rgba(29,158,117,0.25)" stroke="rgba(29,158,117,0.5)" strokeWidth="1"/>
    <circle cx="406" cy="83" r="5" fill="rgba(29,158,117,0.5)"/>
    <text x="428" y="87" fontSize="10" fontWeight="700" fill="#1d9e75" textAnchor="middle" fontFamily="system-ui, sans-serif">88% match</text>
    {/* Progress bar */}
    <rect x="130" y="110" width="356" height="6" rx="3" fill="rgba(255,255,255,0.08)"/>
    <rect x="130" y="110" width="242" height="6" rx="3" fill="rgba(29,158,117,0.7)"/>
    <text x="130" y="126" fontSize="8" fill="rgba(255,255,255,0.4)" fontFamily="system-ui, sans-serif">68% bullets reviewed · 4 pending</text>
    {/* CV card */}
    <rect x="130" y="136" width="206" height="228" rx="12" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
    {/* CV header area */}
    <circle cx="158" cy="162" r="18" fill="rgba(255,255,255,0.15)"/>
    <circle cx="158" cy="156" r="7" fill="rgba(255,255,255,0.4)"/>
    <ellipse cx="158" cy="172" rx="11" ry="7" fill="rgba(255,255,255,0.25)"/>
    <rect x="182" y="152" width="70" height="7" rx="3.5" fill="rgba(255,255,255,0.7)"/>
    <rect x="182" y="163" width="52" height="5" rx="2.5" fill="rgba(255,255,255,0.35)"/>
    {/* Divider */}
    <line x1="142" y1="188" x2="324" y2="188" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
    <rect x="142" y="196" width="48" height="5" rx="2.5" fill="rgba(255,255,255,0.55)"/>
    {/* Bullets with indicators */}
    {[
      { y: 210, w: 140, state: "accepted" },
      { y: 222, w: 118, state: "accepted" },
      { y: 234, w: 130, state: "pending" },
      { y: 246, w: 100, state: "pending" },
      { y: 258, w: 122, state: "accepted" },
    ].map((b, i) => (
      <g key={i}>
        <circle cx="148" cy={b.y + 2} r="2.5"
          fill={b.state === "accepted" ? "#1d9e75" : "rgba(255,255,255,0.25)"}/>
        <rect x="156" y={b.y} width={b.w} height="4" rx="2"
          fill={b.state === "accepted" ? "rgba(29,158,117,0.4)" : "rgba(255,255,255,0.18)"}/>
      </g>
    ))}
    {/* Divider */}
    <line x1="142" y1="272" x2="324" y2="272" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
    <rect x="142" y="280" width="36" height="5" rx="2.5" fill="rgba(255,255,255,0.55)"/>
    {[
      { y: 294, w: 132 },
      { y: 306, w: 110 },
      { y: 318, w: 126 },
    ].map((b, i) => (
      <g key={i}>
        <circle cx="148" cy={b.y + 2} r="2.5" fill="rgba(255,255,255,0.25)"/>
        <rect x="156" y={b.y} width={b.w} height="4" rx="2" fill="rgba(255,255,255,0.18)"/>
      </g>
    ))}
    {/* Right panel — AI rewrite suggestions */}
    <rect x="348" y="136" width="138" height="228" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
    <text x="417" y="158" fontSize="9.5" fontWeight="600" fill="rgba(255,255,255,0.75)" textAnchor="middle" fontFamily="system-ui, sans-serif">AI Suggestions</text>
    {/* Suggestion items */}
    {[
      { y: 170, label: "Add quantifiable metric", color: "#1d9e75", sub: "↑ impact score" },
      { y: 204, label: "Insert keyword: 'Stripe'", color: "#ef9f27", sub: "ATS boost" },
      { y: 238, label: "Tone: more assertive", color: "#534ab7", sub: "voice match" },
      { y: 272, label: "Cut filler words", color: "#d85a30", sub: "clarity +40%" },
    ].map((s) => (
      <g key={s.y}>
        <rect x="356" y={s.y} width="122" height="28" rx="8" fill="rgba(255,255,255,0.06)"/>
        <circle cx="368" cy={s.y + 9} r="4" fill={`${s.color}30`}/>
        <circle cx="368" cy={s.y + 9} r="2.5" fill={s.color}/>
        <rect x="378" y={s.y + 5} width="64" height="3.5" rx="1.75" fill="rgba(255,255,255,0.5)"/>
        <rect x="378" y={s.y + 13} width="44" height="3" rx="1.5" fill={`${s.color}80`}/>
      </g>
    ))}
    {/* Accept/Reject row */}
    <rect x="356" y="316" width="56" height="20" rx="10" fill="rgba(29,158,117,0.3)" stroke="rgba(29,158,117,0.5)" strokeWidth="1"/>
    <text x="384" y="330" fontSize="9" fontWeight="600" fill="#1d9e75" textAnchor="middle" fontFamily="system-ui, sans-serif">✓ Accept</text>
    <rect x="420" y="316" width="56" height="20" rx="10" fill="rgba(216,90,48,0.2)" stroke="rgba(216,90,48,0.4)" strokeWidth="1"/>
    <text x="448" y="330" fontSize="9" fontWeight="600" fill="#d85a30" textAnchor="middle" fontFamily="system-ui, sans-serif">✕ Reject</text>
    {/* Floating notification card */}
    <rect x="340" y="4" width="156" height="48" rx="12" fill="white" stroke="rgba(0,0,0,0.07)" strokeWidth="1"/>
    <rect x="350" y="14" width="28" height="28" rx="8" fill="rgba(29,158,117,0.12)"/>
    <text x="364" y="33" fontSize="13" textAnchor="middle" fill="#1d9e75" fontFamily="system-ui, sans-serif">✓</text>
    <rect x="386" y="16" width="72" height="5" rx="2.5" fill="#1a1a1a" opacity="0.85"/>
    <rect x="386" y="25" width="54" height="4" rx="2" fill="#999"/>
    <rect x="386" y="34" width="40" height="3.5" rx="1.75" fill="#ccc"/>
  </svg>
);

// ─── Step illustrations ────────────────────────────────────

const UploadCVIllustration = () => (
  <svg viewBox="0 0 420 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" aria-hidden="true">
    {/* Background glow */}
    <ellipse cx="210" cy="160" rx="180" ry="130" fill="rgba(83,74,183,0.06)"/>
    {/* Drop zone */}
    <rect x="60" y="80" width="300" height="180" rx="20" fill="rgba(83,74,183,0.05)" stroke="#534ab7" strokeWidth="2" strokeDasharray="8 5"/>
    {/* Upload icon */}
    <circle cx="210" cy="136" r="32" fill="rgba(83,74,183,0.1)"/>
    <path d="M210 120 L210 152" stroke="#534ab7" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M196 132 L210 118 L224 132" stroke="#534ab7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M192 152 L228 152" stroke="#534ab7" strokeWidth="2" strokeLinecap="round"/>
    {/* Drop zone text */}
    <text x="210" y="184" fontSize="13" fontWeight="600" fill="#534ab7" textAnchor="middle" fontFamily="system-ui, sans-serif">Drop your CV here</text>
    <text x="210" y="202" fontSize="10.5" fill="#9da3ae" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF or DOCX · up to 10 MB</text>
    {/* Browse button */}
    <rect x="160" y="216" width="100" height="28" rx="14" fill="#534ab7"/>
    <text x="210" y="234" fontSize="10.5" fontWeight="600" fill="white" textAnchor="middle" fontFamily="system-ui, sans-serif">Browse files</text>
    {/* Floating document card */}
    <rect x="12" y="60" width="88" height="112" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
    <rect x="20" y="72" width="44" height="6" rx="3" fill="#534ab7" opacity="0.7"/>
    {[82, 92, 102, 112, 122].map((y, i) => (
      <rect key={y} x="20" y={y} width={i % 2 === 0 ? 64 : 52} height="4" rx="2" fill="#e5e7eb"/>
    ))}
    <rect x="20" y="134" width="40" height="5" rx="2.5" fill="#534ab7" opacity="0.5"/>
    {[142, 152, 162].map((y, i) => (
      <rect key={y} x="20" y={y} width={i === 1 ? 56 : 48} height="4" rx="2" fill="#e5e7eb"/>
    ))}
    {/* File badge */}
    <rect x="16" y="158" width="32" height="14" rx="7" fill="#534ab7"/>
    <text x="32" y="169" fontSize="8" fontWeight="700" fill="white" textAnchor="middle" fontFamily="system-ui, sans-serif">PDF</text>
    {/* Upload animation arrows */}
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M ${80 + i * 14} ${170 - i * 8} L ${100 + i * 14} ${150 - i * 8}`}
        stroke="#534ab7" strokeWidth="1.5" strokeLinecap="round" opacity={0.3 + i * 0.25}
        strokeDasharray="4 3"/>
    ))}
    {/* Parsing progress ring */}
    <circle cx="348" cy="100" r="40" stroke="#e5e7eb" strokeWidth="6" fill="none"/>
    <circle cx="348" cy="100" r="40" stroke="#534ab7" strokeWidth="6" fill="none"
      strokeDasharray="175 76" strokeLinecap="round" transform="rotate(-90 348 100)"/>
    <text x="348" y="96" fontSize="14" fontWeight="700" fill="#534ab7" textAnchor="middle" fontFamily="system-ui, sans-serif">70%</text>
    <text x="348" y="110" fontSize="8" fill="#9da3ae" textAnchor="middle" fontFamily="system-ui, sans-serif">Parsing</text>
    {/* Parsed field chips */}
    {[
      { x: 290, y: 154, label: "8 jobs found", color: "#534ab7" },
      { x: 300, y: 176, label: "14 skills", color: "#1d9e75" },
      { x: 288, y: 198, label: "Education ✓", color: "#ef9f27" },
    ].map((chip) => (
      <g key={chip.label}>
        <rect x={chip.x} y={chip.y} width={chip.label.length * 5.5 + 16} height="18" rx="9"
          fill={`${chip.color}18`} stroke={`${chip.color}50`} strokeWidth="1"/>
        <text x={chip.x + chip.label.length * 2.75 + 8} y={chip.y + 13} fontSize="8.5" fontWeight="600"
          fill={chip.color} textAnchor="middle" fontFamily="system-ui, sans-serif">{chip.label}</text>
      </g>
    ))}
  </svg>
);

const DecodeJobIllustration = () => (
  <svg viewBox="0 0 420 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" aria-hidden="true">
    {/* Background glow */}
    <ellipse cx="210" cy="160" rx="180" ry="130" fill="rgba(29,158,117,0.05)"/>
    {/* Job description card */}
    <rect x="28" y="32" width="200" height="256" rx="14" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
    {/* JD header */}
    <rect x="40" y="46" width="90" height="8" rx="4" fill="#1a1a1a" opacity="0.85"/>
    <rect x="40" y="60" width="68" height="6" rx="3" fill="#9da3ae"/>
    <line x1="40" y1="78" x2="216" y2="78" stroke="#f3f4f6" strokeWidth="1.5"/>
    {/* JD body lines — some highlighted */}
    {[
      { y: 88, w: 160, highlight: false },
      { y: 100, w: 130, highlight: true, color: "#534ab7" },
      { y: 112, w: 145, highlight: false },
      { y: 124, w: 120, highlight: true, color: "#1d9e75" },
      { y: 136, w: 155, highlight: false },
      { y: 148, w: 110, highlight: true, color: "#ef9f27" },
      { y: 160, w: 140, highlight: false },
      { y: 172, w: 125, highlight: false },
      { y: 184, w: 150, highlight: true, color: "#534ab7" },
      { y: 196, w: 115, highlight: false },
      { y: 208, w: 135, highlight: true, color: "#1d9e75" },
      { y: 220, w: 120, highlight: false },
      { y: 232, w: 145, highlight: false },
      { y: 244, w: 110, highlight: true, color: "#ef9f27" },
      { y: 256, w: 130, highlight: false },
      { y: 268, w: 100, highlight: false },
    ].map((line, i) => (
      <g key={i}>
        {line.highlight && (
          <rect x="40" y={line.y - 2} width={line.w} height="10" rx="3"
            fill={`${line.color}20`}/>
        )}
        <rect x="40" y={line.y} width={line.w} height="5" rx="2.5"
          fill={line.highlight ? line.color : "#e5e7eb"} opacity={line.highlight ? 0.9 : 1}/>
      </g>
    ))}
    {/* Scan line animation */}
    <rect x="28" y="148" width="200" height="2" rx="1" fill="url(#scanGrad)" opacity="0.6"/>
    <defs>
      <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1d9e75" stopOpacity="0"/>
        <stop offset="50%" stopColor="#1d9e75" stopOpacity="1"/>
        <stop offset="100%" stopColor="#1d9e75" stopOpacity="0"/>
      </linearGradient>
    </defs>
    {/* AI output panel */}
    <rect x="244" y="32" width="148" height="256" rx="14" fill="#f8f9fb" stroke="#e5e7eb" strokeWidth="1.5"/>
    <text x="318" y="56" fontSize="10" fontWeight="700" fill="#1a1a1a" textAnchor="middle" fontFamily="system-ui, sans-serif">AI Analysis</text>
    {/* Match meter */}
    <text x="260" y="82" fontSize="9" fill="#9da3ae" fontFamily="system-ui, sans-serif">Current fit</text>
    <rect x="260" y="88" width="116" height="8" rx="4" fill="#e5e7eb"/>
    <rect x="260" y="88" width="78" height="8" rx="4" fill="url(#matchGrad)"/>
    <defs>
      <linearGradient id="matchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#534ab7"/>
        <stop offset="100%" stopColor="#1d9e75"/>
      </linearGradient>
    </defs>
    <text x="380" y="97" fontSize="9" fontWeight="700" fill="#1d9e75" textAnchor="middle" fontFamily="system-ui, sans-serif">67%</text>
    {/* Keyword chips */}
    <text x="260" y="114" fontSize="9" fill="#9da3ae" fontFamily="system-ui, sans-serif">Key terms found</text>
    {[
      { x: 260, y: 122, label: "TypeScript", color: "#534ab7" },
      { x: 320, y: 122, label: "React", color: "#534ab7" },
      { x: 260, y: 140, label: "Node.js", color: "#1d9e75" },
      { x: 320, y: 140, label: "APIs", color: "#1d9e75" },
      { x: 260, y: 158, label: "CI/CD", color: "#ef9f27" },
      { x: 316, y: 158, label: "Docker", color: "#ef9f27" },
    ].map((chip) => (
      <g key={chip.label}>
        <rect x={chip.x} y={chip.y} width={chip.label.length * 5.6 + 10} height="15" rx="7.5"
          fill={`${chip.color}18`} stroke={`${chip.color}40`} strokeWidth="1"/>
        <text x={chip.x + chip.label.length * 2.8 + 5} y={chip.y + 10.5} fontSize="8" fontWeight="600"
          fill={chip.color} textAnchor="middle" fontFamily="system-ui, sans-serif">{chip.label}</text>
      </g>
    ))}
    {/* Gap warnings */}
    <text x="260" y="188" fontSize="9" fill="#9da3ae" fontFamily="system-ui, sans-serif">Gaps to address</text>
    {[
      { y: 196, label: "Mention Agile experience", color: "#d85a30" },
      { y: 212, label: "Add leadership example", color: "#ef9f27" },
      { y: 228, label: "Quantify team impact", color: "#ef9f27" },
    ].map((gap) => (
      <g key={gap.label}>
        <circle cx="262" cy={gap.y + 5} r="3.5" fill={`${gap.color}30`}/>
        <circle cx="262" cy={gap.y + 5} r="2" fill={gap.color}/>
        <rect x="272" y={gap.y + 2} width={gap.label.length * 4.4} height="4.5" rx="2" fill={gap.color} opacity="0.35"/>
      </g>
    ))}
    {/* Culture signals */}
    <text x="260" y="254" fontSize="9" fill="#9da3ae" fontFamily="system-ui, sans-serif">Culture signals</text>
    <rect x="260" y="262" width="116" height="18" rx="6" fill="rgba(83,74,183,0.07)"/>
    <text x="318" y="275" fontSize="8.5" fill="#534ab7" textAnchor="middle" fontFamily="system-ui, sans-serif">Fast-paced · data-driven · ownership</text>
    {/* Connecting dashes */}
    <path d="M228 148 L244 148" stroke="#1d9e75" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6"/>
    <path d="M228 124 L244 130" stroke="#534ab7" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5"/>
    <path d="M228 184 L244 162" stroke="#ef9f27" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5"/>
  </svg>
);

const TailorApplyIllustration = () => (
  <svg viewBox="0 0 420 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" aria-hidden="true">
    {/* Background glow */}
    <ellipse cx="210" cy="160" rx="180" ry="130" fill="rgba(239,159,39,0.05)"/>
    {/* CV card — tailored */}
    <rect x="28" y="28" width="176" height="240" rx="14" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
    {/* CV header */}
    <circle cx="60" cy="60" r="20" fill="rgba(83,74,183,0.1)"/>
    <circle cx="60" cy="54" r="8" fill="rgba(83,74,183,0.3)"/>
    <ellipse cx="60" cy="72" rx="12" ry="8" fill="rgba(83,74,183,0.2)"/>
    <rect x="88" y="48" width="80" height="7" rx="3.5" fill="#1a1a1a" opacity="0.85"/>
    <rect x="88" y="60" width="60" height="5" rx="2.5" fill="#9da3ae"/>
    {/* Tailored tag */}
    <rect x="88" y="70" width="68" height="14" rx="7" fill="rgba(29,158,117,0.15)" stroke="rgba(29,158,117,0.4)" strokeWidth="1"/>
    <text x="122" y="81" fontSize="7.5" fontWeight="700" fill="#1d9e75" textAnchor="middle" fontFamily="system-ui, sans-serif">✦ AI Tailored</text>
    <line x1="40" y1="92" x2="192" y2="92" stroke="#f3f4f6" strokeWidth="1.5"/>
    {/* Experience */}
    <rect x="40" y="100" width="56" height="5" rx="2.5" fill="#1a1a1a" opacity="0.7"/>
    {[
      { y: 114, w: 138, accepted: true },
      { y: 126, w: 118, accepted: true },
      { y: 138, w: 130, accepted: true },
      { y: 150, w: 108, accepted: true },
    ].map((b, i) => (
      <g key={i}>
        <circle cx="46" cy={b.y + 2} r="2.5" fill="#1d9e75"/>
        <rect x="54" y={b.y} width={b.w} height="4" rx="2" fill="rgba(29,158,117,0.3)"/>
        <g transform={`translate(${54 + b.w + 4}, ${b.y - 2})`}>
          <rect width="16" height="9" rx="4.5" fill="rgba(29,158,117,0.2)"/>
          <text x="8" y="7" fontSize="6" fill="#1d9e75" textAnchor="middle" fontFamily="system-ui, sans-serif">✓</text>
        </g>
      </g>
    ))}
    <line x1="40" y1="168" x2="192" y2="168" stroke="#f3f4f6" strokeWidth="1.5"/>
    <rect x="40" y="176" width="44" height="5" rx="2.5" fill="#1a1a1a" opacity="0.7"/>
    {[
      { y: 190, w: 140 },
      { y: 202, w: 120 },
      { y: 214, w: 134 },
    ].map((b, i) => (
      <g key={i}>
        <circle cx="46" cy={b.y + 2} r="2.5" fill="#1d9e75"/>
        <rect x="54" y={b.y} width={b.w} height="4" rx="2" fill="rgba(29,158,117,0.3)"/>
      </g>
    ))}
    {/* ATS ready badge */}
    <rect x="40" y="232" width="80" height="24" rx="8" fill="rgba(83,74,183,0.1)" stroke="rgba(83,74,183,0.3)" strokeWidth="1"/>
    <text x="80" y="248" fontSize="9" fontWeight="700" fill="#534ab7" textAnchor="middle" fontFamily="system-ui, sans-serif">ATS Ready ✓</text>
    {/* Score tracker — right side */}
    <rect x="220" y="28" width="172" height="120" rx="14" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
    <text x="306" y="52" fontSize="11" fontWeight="700" fill="#1a1a1a" textAnchor="middle" fontFamily="system-ui, sans-serif">Match score</text>
    {/* Before arrow */}
    <text x="244" y="80" fontSize="9" fill="#9da3ae" textAnchor="middle" fontFamily="system-ui, sans-serif">Before</text>
    <text x="244" y="100" fontSize="22" fontWeight="900" fill="#d85a30" textAnchor="middle" fontFamily="system-ui, sans-serif">54%</text>
    {/* Arrow */}
    <path d="M268 90 L294 90" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M288 86 L294 90 L288 94" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* After */}
    <text x="320" y="80" fontSize="9" fill="#9da3ae" textAnchor="middle" fontFamily="system-ui, sans-serif">After</text>
    <text x="320" y="100" fontSize="22" fontWeight="900" fill="#1d9e75" textAnchor="middle" fontFamily="system-ui, sans-serif">88%</text>
    {/* Bar comparison */}
    <rect x="232" y="110" width="68" height="6" rx="3" fill="#e5e7eb"/>
    <rect x="232" y="110" width="37" height="6" rx="3" fill="#d85a30" opacity="0.5"/>
    <rect x="308" y="110" width="72" height="6" rx="3" fill="#e5e7eb"/>
    <rect x="308" y="110" width="63" height="6" rx="3" fill="#1d9e75" opacity="0.7"/>
    {/* Cover letter card */}
    <rect x="220" y="162" width="172" height="92" rx="14" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
    <text x="306" y="184" fontSize="10" fontWeight="700" fill="#1a1a1a" textAnchor="middle" fontFamily="system-ui, sans-serif">Cover Letter</text>
    <rect x="232" y="192" width="148" height="5" rx="2.5" fill="#e5e7eb"/>
    <rect x="232" y="202" width="128" height="5" rx="2.5" fill="#e5e7eb"/>
    <rect x="232" y="212" width="138" height="5" rx="2.5" fill="#e5e7eb"/>
    {/* Voice match badge */}
    <rect x="232" y="224" width="80" height="18" rx="9" fill="rgba(239,159,39,0.15)" stroke="rgba(239,159,39,0.4)" strokeWidth="1"/>
    <text x="272" y="237" fontSize="8" fontWeight="600" fill="#ba7517" textAnchor="middle" fontFamily="system-ui, sans-serif">Voice matched ✦</text>
    {/* Export button */}
    <rect x="220" y="268" width="172" height="40" rx="12" fill="#534ab7"/>
    <text x="306" y="293" fontSize="11" fontWeight="700" fill="white" textAnchor="middle" fontFamily="system-ui, sans-serif">⬇ Export PDF</text>
    {/* Success sparkles */}
    <circle cx="24" cy="28" r="4" fill="#1d9e75" opacity="0.4"/>
    <circle cx="404" cy="40" r="3" fill="#ef9f27" opacity="0.5"/>
    <path d="M396 268 L398 262 L400 268 L394 270 Z" fill="#534ab7" opacity="0.5"/>
    <path d="M16 200 L18 194 L20 200 L14 202 Z" fill="#1d9e75" opacity="0.4"/>
    <circle cx="400" cy="200" r="5" fill="rgba(83,74,183,0.2)"/>
    <circle cx="404" cy="300" r="3" fill="rgba(29,158,117,0.3)"/>
  </svg>
);

// ─── About illustration ────────────────────────────────────

const AboutIllustration = () => (
  <svg viewBox="0 0 440 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" aria-hidden="true">
    <defs>
      <linearGradient id="bgAbout" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#eeedfe"/>
        <stop offset="100%" stopColor="#e1f5ee"/>
      </linearGradient>
      <linearGradient id="pathGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#534ab7" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="#1d9e75" stopOpacity="0.2"/>
      </linearGradient>
    </defs>
    {/* Background card */}
    <rect x="0" y="0" width="440" height="360" rx="24" fill="url(#bgAbout)"/>
    {/* Subtle grid */}
    <pattern id="aboutGrid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(83,74,183,0.06)" strokeWidth="1"/>
    </pattern>
    <rect x="0" y="0" width="440" height="360" rx="24" fill="url(#aboutGrid)"/>
    {/* Career path — upward curve */}
    <path d="M60 310 C80 280 100 260 140 240 C180 220 200 200 230 170 C260 140 280 120 310 100 C340 80 360 70 380 60"
      stroke="url(#pathGrad)" strokeWidth="40" strokeLinecap="round" fill="none"/>
    <path d="M60 310 C80 280 100 260 140 240 C180 220 200 200 230 170 C260 140 280 120 310 100 C340 80 360 70 380 60"
      stroke="#534ab7" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4" fill="none" opacity="0.5"/>
    {/* Milestone nodes */}
    {[
      { x: 60, y: 310, label: "Uploaded CV", sub: "Day 1", color: "#534ab7", icon: "📄" },
      { x: 140, y: 240, label: "Decoded 3 jobs", sub: "Day 2", color: "#7f77dd", icon: "🔍" },
      { x: 230, y: 170, label: "Tailored CV", sub: "Day 3", color: "#1d9e75", icon: "✏️" },
      { x: 310, y: 100, label: "Applied ×4", sub: "Day 4", color: "#0f6e56", icon: "📨" },
      { x: 380, y: 60, label: "Interview!", sub: "Day 6", color: "#ef9f27", icon: "🎉" },
    ].map((node) => (
      <g key={node.label}>
        <circle cx={node.x} cy={node.y} r="22" fill="white" stroke={node.color} strokeWidth="2"/>
        <text x={node.x} y={node.y + 5} fontSize="14" textAnchor="middle" fontFamily="system-ui, sans-serif">{node.icon}</text>
        {/* Label card */}
        <rect x={node.x - 44} y={node.y + 26} width="88" height="32" rx="8" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
        <text x={node.x} y={node.y + 40} fontSize="8.5" fontWeight="700" fill="#1a1a1a" textAnchor="middle" fontFamily="system-ui, sans-serif">{node.label}</text>
        <text x={node.x} y={node.y + 51} fontSize="8" fill="#9da3ae" textAnchor="middle" fontFamily="system-ui, sans-serif">{node.sub}</text>
      </g>
    ))}
    {/* Stats overlay — bottom row */}
    {[
      { x: 24, y: 20, label: "AI-powered", val: "Gemini 2.5", color: "#534ab7" },
      { x: 166, y: 20, label: "Countries", val: "40+", color: "#1d9e75" },
      { x: 296, y: 20, label: "Satisfaction", val: "98%", color: "#ef9f27" },
    ].map((stat) => (
      <g key={stat.label}>
        <rect x={stat.x} y={stat.y} width="130" height="50" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
        <text x={stat.x + 65} y={stat.y + 20} fontSize="9" fill="#9da3ae" textAnchor="middle" fontFamily="system-ui, sans-serif">{stat.label}</text>
        <text x={stat.x + 65} y={stat.y + 36} fontSize="14" fontWeight="800" fill={stat.color} textAnchor="middle" fontFamily="system-ui, sans-serif">{stat.val}</text>
      </g>
    ))}
    {/* Decorative dots */}
    <circle cx="420" cy="340" r="8" fill="rgba(83,74,183,0.15)"/>
    <circle cx="20" cy="340" r="5" fill="rgba(29,158,117,0.2)"/>
    <circle cx="420" cy="200" r="4" fill="rgba(239,159,39,0.25)"/>
  </svg>
);

// ─── Navbar ───────────────────────────────────────────────

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/96 backdrop-blur-md shadow-sm border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — swaps on scroll */}
          <button onClick={() => scrollTo("#home")} className="cursor-pointer flex-shrink-0">
            <img
              src={scrolled ? "/logo.png" : "/altnewlogo.png"}
              alt="Seevv"
              className="h-10 object-contain transition-all duration-300"
            />
          </button>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {links.map((l) => (
              <button
                key={l.href}
                onClick={() => scrollTo(l.href)}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
                  scrolled
                    ? "text-gray-600 hover:text-brand-600 hover:bg-brand-50"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                scrolled
                  ? "text-gray-700 hover:text-brand-600"
                  : "text-white/90 hover:text-white"
              }`}
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
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${scrolled ? "text-gray-700" : "text-white"}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              ) : (
                <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
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
            <Link to="/login" className="w-full text-center py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Sign in
            </Link>
            <Link to="/signup" className="w-full text-center py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-800 transition-colors">
              Get started free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

// ─── Hero section ─────────────────────────────────────────

const HeroSection = () => {
  const { ref: blobRef, offset: blobOffset } = useParallax(0.2);

  return (
    <section id="home" className="relative min-h-screen bg-brand-600 flex items-center overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.07]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="52" height="52" patternUnits="userSpaceOnUse">
              <path d="M 52 0 L 0 0 0 52" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)"/>
        </svg>
      </div>

      {/* Gradient blobs — parallax */}
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
          style={{ transform: `translateY(${blobOffset * 0.3}px) translateX(-50%)` }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-0 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: Copy */}
          <div className="fade-in-up">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"/>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"/>
              </span>
              <span className="text-xs font-semibold text-white/90 tracking-wide">AI-powered career intelligence</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-7 tracking-tight">
              Every top<br />
              company has<br />
              a <span className="text-teal-400 italic">code.</span><br />
              <span className="text-white/60 text-4xl sm:text-5xl lg:text-6xl font-bold">Seevv cracks it.</span>
            </h1>

            <p className="text-brand-200 text-lg leading-relaxed mb-10 max-w-lg">
              We decode what hiring managers actually look for, rewrite your CV bullet by bullet to match, and generate voice-matched cover letters — so you don't just apply, you <em>arrive</em>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to="/signup"
                className="px-8 py-4 bg-white text-brand-600 font-black rounded-2xl text-base hover:bg-teal-400 hover:text-white transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 text-center"
              >
                Start for free — no card needed
              </Link>
              <Tooltip text="See how it works in 2 min" position="bottom">
                <button
                  onClick={() => document.querySelector("#how")?.scrollIntoView({ behavior: "smooth" })}
                  className="px-8 py-4 bg-white/10 border border-white/25 text-white font-semibold rounded-2xl text-base hover:bg-white/20 transition-all text-center cursor-pointer w-full backdrop-blur-sm"
                >
                  ▷ Watch it in action
                </button>
              </Tooltip>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {["#7f77dd", "#1d9e75", "#ef9f27", "#d85a30", "#534ab7"].map((c, i) => (
                  <Tooltip key={i} text={["Adaeze", "James", "Miriam", "Kofi", "Sara"][i]} position="top">
                    <div
                      className="w-9 h-9 rounded-full border-2 border-brand-600 flex items-center justify-center text-xs font-bold text-white cursor-default"
                      style={{ backgroundColor: c }}
                    >
                      {["A", "J", "M", "K", "S"][i]}
                    </div>
                  </Tooltip>
                ))}
              </div>
              <p className="text-brand-200 text-sm">
                <span className="text-white font-bold">2,400+</span> job seekers landed interviews this month
              </p>
            </div>
          </div>

          {/* Right: Dashboard illustration */}
          <div className="relative hero-float">
            <HeroDashboardIllustration />
            {/* Floating match card */}
            <div className="absolute -left-6 top-12 bg-white rounded-2xl shadow-2xl px-4 py-3.5 flex items-center gap-3 animate-slide-down border border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d9e75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Match improved</p>
                <p className="text-xs text-gray-400">54% → <span className="text-teal-600 font-black text-sm">88%</span></p>
              </div>
            </div>
            {/* Floating keywords card */}
            <div className="absolute -right-6 bottom-20 bg-white rounded-2xl shadow-2xl px-4 py-3.5 border border-gray-100">
              <p className="text-xs text-gray-400 mb-2 font-medium">ATS keywords matched</p>
              <div className="flex gap-1.5 flex-wrap max-w-36">
                {["React", "TypeScript", "Node.js", "Stripe API"].map((k) => (
                  <Tooltip key={k} text="Found in job description" position="top">
                    <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-full font-semibold cursor-default">{k}</span>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 100L1440 100L1440 30C1200 100 960 10 720 30C480 50 240 10 0 30L0 100Z" fill="#f8f8f7"/>
        </svg>
      </div>
    </section>
  );
};

// ─── Marquee / ticker ─────────────────────────────────────

const CompanyTicker = () => {
  const companies = [
    "Google", "Stripe", "Shopify", "Meta", "Netflix",
    "Spotify", "Airbnb", "Notion", "Linear", "Figma",
    "Vercel", "Atlassian", "Salesforce", "HubSpot", "Twilio",
  ];
  const doubled = [...companies, ...companies];

  return (
    <section className="py-10 bg-white border-y border-gray-100 overflow-hidden">
      <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">
        Trusted by applicants targeting the world's best companies
      </p>
      <div className="overflow-hidden">
        <div className="marquee-track">
          {doubled.map((name, i) => (
            <div
              key={i}
              className="flex items-center gap-2 mx-8 text-gray-300 hover:text-brand-600 transition-colors duration-300 cursor-default"
            >
              <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                <span className="text-xs font-black text-gray-400">{name[0]}</span>
              </div>
              <span className="text-sm font-semibold whitespace-nowrap">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Stats bar ────────────────────────────────────────────

const StatsSection = () => {
  const { ref, visible } = useScrollReveal();

  const stats = [
    { value: "88%", label: "Average match score", icon: "🎯", tip: "Across all users after CV tailoring" },
    { value: "3×", label: "More interview callbacks", icon: "📈", tip: "Vs. generic CV applications" },
    { value: "5 min", label: "Average per application", icon: "⚡", tip: "From job target to tailored PDF" },
    { value: "2,400+", label: "Job seekers helped", icon: "🚀", tip: "And counting — new signups every day" },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <Tooltip key={s.label} text={s.tip} position="top">
              <div
                className={`text-center p-7 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-all duration-500 cursor-default w-full ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="text-3xl mb-3">{s.icon}</div>
                <p className="text-4xl font-black text-brand-600 mb-1.5">{s.value}</p>
                <p className="text-xs text-gray-500 font-medium leading-snug">{s.label}</p>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── About section ────────────────────────────────────────

const AboutSection = () => {
  const { ref: sectionRef, visible } = useScrollReveal();
  const { ref: imgRef, offset } = useParallax(0.1);

  return (
    <section id="about" className="py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={sectionRef} className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Illustration */}
          <div ref={imgRef} className="relative order-2 lg:order-1"
            style={{ transform: `translateY(${offset}px)` }}>
            <div className={`relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
              <AboutIllustration />
            </div>
            {/* Floating badge */}
            <div className={`absolute -top-5 -right-5 bg-brand-600 text-white rounded-2xl px-5 py-4 shadow-2xl transition-all duration-700 delay-300 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
              <p className="text-3xl font-black">98%</p>
              <p className="text-brand-200 text-xs mt-0.5">User satisfaction</p>
            </div>
            {/* Powered badge */}
            <div className={`absolute -bottom-4 left-8 bg-white rounded-2xl shadow-xl px-5 py-3.5 border border-gray-100 transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <p className="text-xs text-gray-400 mb-1">Powered by</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"/>
                <span className="text-sm font-bold text-gray-900">Google Gemini 2.5</span>
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className={`order-1 lg:order-2 transition-all duration-700 delay-150 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            <span className="inline-block text-xs font-bold text-brand-600 uppercase tracking-[0.18em] bg-brand-50 px-3 py-1.5 rounded-full mb-5">
              About Seevv
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-6">
              We built the tool<br/>
              <span className="gradient-text">we wish existed</span><br/>
              when job hunting.
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-5">
              Seevv was born from frustration — hours spent tweaking CVs, guessing what recruiters want, and writing generic cover letters that went nowhere. We built an AI platform that actually decodes what companies need and helps you present yourself perfectly.
            </p>
            <p className="text-gray-500 text-base leading-relaxed mb-10">
              Every feature — from the Deep Decoder to voice-matched cover letters — is designed to give you a genuine advantage in a competitive market. Not by gaming the system, but by being precisely, authentically relevant.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Founded", value: "2024", tip: "Born from frustration, built with purpose" },
                { label: "AI model", value: "Gemini 2.5", tip: "Google's latest and most capable model" },
                { label: "Countries", value: "40+", tip: "Job seekers from across the globe" },
                { label: "Interview rate", value: "3× more", tip: "Compared to unoptimised CVs" },
              ].map((item) => (
                <Tooltip key={item.label} text={item.tip} position="top">
                  <div className="bg-gray-50 hover:bg-brand-50 border border-transparent hover:border-brand-100 rounded-xl p-4 transition-all cursor-default w-full">
                    <p className="text-xs text-gray-400 mb-1 font-medium">{item.label}</p>
                    <p className="text-base font-black text-gray-900">{item.value}</p>
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Services section ─────────────────────────────────────

const ServicesSection = () => {
  const { ref, visible } = useScrollReveal();

  const services = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      ),
      title: "Deep Job Decoder",
      desc: "Paste any job description. Our AI uncovers hidden requirements, culture signals, ATS keywords, and maps your exact fit — gaps and all.",
      color: "text-brand-600", bg: "bg-brand-50", border: "border-brand-100",
      features: ["Hidden requirements analysis", "ATS keyword extraction", "Culture & tone signals", "Gap-to-goal roadmap"],
      tip: "Decode any job in seconds",
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
      title: "AI CV Rewriter",
      desc: "Your CV gets rewritten bullet by bullet — not replaced, refined. Accept, reject, or edit each change. Your voice, optimised for the role.",
      color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100",
      features: ["Bullet-level control", "Voice mirroring AI", "Real-time match scoring", "ATS compliance check"],
      tip: "Keep control of every word",
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      title: "Cover Letter AI",
      desc: "Generate a tailored cover letter in seconds. Choose your tone. Upload a writing sample and we mirror your voice so precisely, it sounds like you wrote every word.",
      color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100",
      features: ["3 tone modes", "Voice sample matching", "Job-specific tailoring", "Edit, save & export"],
      tip: "Sounds like you — optimised for them",
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      ),
      title: "PDF Export",
      desc: "Export a professionally formatted, ATS-compliant PDF with your name and role already in the filename. Apply immediately. No clutter, no compromise.",
      color: "text-brand-600", bg: "bg-brand-50", border: "border-brand-100",
      features: ["ATS-optimised layout", "Professional design", "Custom filename", "Instant download"],
      tip: "Ready to attach in one click",
    },
  ];

  return (
    <section id="services" className="py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-brand-600 uppercase tracking-[0.18em] bg-brand-50 px-3 py-1.5 rounded-full mb-5">
            Services
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Everything you need<br/>to land the role
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            A complete system — from decoding what companies need to handing you a polished, tailored application ready to submit.
          </p>
        </div>

        <div ref={ref} className="grid md:grid-cols-2 gap-6">
          {services.map((s, i) => (
            <Tooltip key={s.title} text={s.tip} position="top">
              <div
                className={`bg-white rounded-3xl border ${s.border} p-8 hover:shadow-xl transition-all duration-400 hover:-translate-y-1.5 group cursor-default ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  {s.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{s.desc}</p>
                <ul className="space-y-2.5">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <div className={`w-4 h-4 rounded-full ${s.bg} ${s.color} flex items-center justify-center flex-shrink-0`}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Step item (uses hooks at component level) ────────────

const StepItem = ({ step, index, colorMap }) => {
  const { ref, visible } = useScrollReveal();
  const c = colorMap[step.color];
  const i = index;

  return (
    <div
      ref={ref}
      className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
        i % 2 === 1 ? "lg:grid-flow-col-dense" : ""
      }`}
    >
      {/* Text side */}
      <div
        className={`${i % 2 === 1 ? "lg:col-start-2" : ""} transition-all duration-700 ${
          visible
            ? "opacity-100 translate-x-0"
            : i % 2 === 0 ? "opacity-0 -translate-x-10" : "opacity-0 translate-x-10"
        }`}
      >
        <div className="flex items-center gap-4 mb-6">
          <Tooltip text={step.tip} position="right">
            <div className={`w-12 h-12 ${c.badge} rounded-2xl flex items-center justify-center shadow-lg cursor-default`}>
              <span className="text-white font-black text-sm">{step.num}</span>
            </div>
          </Tooltip>
          <div className={`h-px flex-1 max-w-20 ${c.line}`}/>
        </div>
        <h3 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">{step.title}</h3>
        <p className="text-gray-500 text-base leading-relaxed mb-7">{step.desc}</p>
        <ul className="space-y-3 mb-8">
          {step.features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
              <div className={`w-5 h-5 rounded-full ${c.bg} ${c.text} flex items-center justify-center flex-shrink-0`}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className="font-medium">{f}</span>
            </li>
          ))}
        </ul>
        <Link
          to="/signup"
          className={`inline-flex items-center gap-2 text-sm font-bold ${c.text} hover:opacity-70 transition-opacity`}
        >
          Try it free
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      {/* Illustration side */}
      <div
        className={`${i % 2 === 1 ? "lg:col-start-1" : ""} relative transition-all duration-700 delay-150 ${
          visible
            ? "opacity-100 translate-x-0"
            : i % 2 === 0 ? "opacity-0 translate-x-10" : "opacity-0 -translate-x-10"
        }`}
      >
        <div className={`relative rounded-3xl overflow-hidden ${c.bg} p-6 shadow-xl ring-1 ${c.ring}`}>
          {step.illustration}
        </div>
        <div className={`absolute -bottom-5 ${i % 2 === 0 ? "-right-5" : "-left-5"} w-24 h-24 rounded-3xl ${c.bg} border-2 border-white opacity-70 -z-10`}/>
        <div className={`absolute -top-4 ${i % 2 === 0 ? "-left-4" : "-right-4"} w-14 h-14 rounded-2xl ${c.dot} opacity-15 -z-10`}/>
      </div>
    </div>
  );
};

const StepList = ({ steps, colorMap }) => (
  <div className="space-y-28">
    {steps.map((step, i) => (
      <StepItem key={step.num} step={step} index={i} colorMap={colorMap} />
    ))}
  </div>
);

// ─── How it works ─────────────────────────────────────────

const HowSection = () => {
  const steps = [
    {
      num: "01",
      title: "Upload your CV",
      desc: "Start by uploading your existing CV — PDF or DOCX. Seevv's parser extracts all your experience, skills, and achievements into a rich structured profile, ready to be weaponised for any role.",
      illustration: <UploadCVIllustration />,
      color: "brand",
      features: ["PDF & DOCX support", "Smart experience parsing", "Auto skill extraction", "Works in seconds"],
      tip: "Your data stays private — always",
    },
    {
      num: "02",
      title: "Decode the job",
      desc: "Add a job target and paste the description. Our AI reads between the lines — surfacing hidden requirements, scoring your current match, extracting every keyword the ATS is looking for, and mapping out exactly what to highlight.",
      illustration: <DecodeJobIllustration />,
      color: "teal",
      features: ["ATS keyword mapping", "Hidden requirement reveal", "Culture & tone signals", "Gap analysis report"],
      tip: "More than keyword matching — true intent analysis",
    },
    {
      num: "03",
      title: "Tailor & apply",
      desc: "Accept or reject each AI-rewritten bullet. Generate a voice-matched cover letter. Export your ATS-ready PDF with your name and role already in the filename. Apply with confidence — you're built for this role.",
      illustration: <TailorApplyIllustration />,
      color: "amber",
      features: ["Bullet-by-bullet control", "Voice-matched cover letter", "One-click PDF export", "Filename auto-formatted"],
      tip: "Most users apply in under 10 minutes",
    },
  ];

  const colorMap = {
    brand: { badge: "bg-brand-600", ring: "ring-brand-200", text: "text-brand-600", bg: "bg-brand-50", num: "text-brand-100", line: "bg-brand-200", dot: "bg-brand-600" },
    teal:  { badge: "bg-teal-600",  ring: "ring-teal-200",  text: "text-teal-600",  bg: "bg-teal-50",  num: "text-teal-100",  line: "bg-teal-200",  dot: "bg-teal-400"  },
    amber: { badge: "bg-amber-500", ring: "ring-amber-200", text: "text-amber-700", bg: "bg-amber-50", num: "text-amber-100", line: "bg-amber-200", dot: "bg-amber-400" },
  };

  return (
    <section id="how" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="inline-block text-xs font-bold text-brand-600 uppercase tracking-[0.18em] bg-brand-50 px-3 py-1.5 rounded-full mb-5">
            How it works
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            From CV to offer<br/>in three steps
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Designed for speed without sacrificing quality. Most users go from upload to tailored application in under 10 minutes.
          </p>
        </div>

        <StepList steps={steps} colorMap={colorMap} />
      </div>
    </section>
  );
};

// ─── Testimonials ─────────────────────────────────────────

const TestimonialsSection = () => {
  const { ref: sectionRef, offset } = useParallax(0.08);
  const { ref: revealRef, visible } = useScrollReveal();

  const testimonials = [
    {
      quote: "I applied to 12 jobs before Seevv. Then I used it for the 13th — Stripe. Got the interview within 48 hours. The match score told me exactly what to emphasise.",
      name: "Adaeze O.", role: "Frontend Engineer → Stripe",
      initials: "AO", color: "#534ab7", score: 91,
    },
    {
      quote: "The Deep Decoder is genuinely scary good. It told me things about the job posting I hadn't even noticed. My CV went from 54% to 89% match after the rewrite.",
      name: "James K.", role: "Product Manager → Notion",
      initials: "JK", color: "#1d9e75", score: 89,
    },
    {
      quote: "The cover letter literally sounds like me. I uploaded a sample of my writing and the AI nailed my voice. My recruiter asked if I'd written it myself — I said yes.",
      name: "Miriam S.", role: "Data Scientist → Spotify",
      initials: "MS", color: "#ef9f27", score: 88,
    },
  ];

  return (
    <section className="py-28 bg-brand-600 relative overflow-hidden" ref={sectionRef}>
      {/* Dot pattern — parallax */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ transform: `translateY(${offset}px)` }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="test-dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#test-dots)"/>
        </svg>
      </div>
      {/* Blobs */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-brand-800 rounded-full filter blur-3xl opacity-30"/>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-600 rounded-full filter blur-3xl opacity-15"/>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-brand-200 uppercase tracking-[0.18em] bg-white/10 px-3 py-1.5 rounded-full mb-5">
            Testimonials
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
            Real people, real results
          </h2>
          <p className="text-brand-200 text-lg max-w-xl mx-auto">
            Don't take our word for it. Here's what job seekers say after landing their roles with Seevv.
          </p>
        </div>

        <div ref={revealRef} className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-7 hover:bg-white/[0.16] hover:-translate-y-1 transition-all duration-500 cursor-default ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#ef9f27">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <p className="text-white/90 text-sm leading-relaxed mb-7 italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{ backgroundColor: t.color }}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{t.name}</p>
                  <p className="text-brand-200 text-xs">{t.role}</p>
                </div>
                <Tooltip text="Final match score" position="top">
                  <div className="ml-auto text-right cursor-default">
                    <p className="text-teal-400 text-xl font-black">{t.score}%</p>
                    <p className="text-brand-300 text-xs">match</p>
                  </div>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Pricing ──────────────────────────────────────────────

const PricingSection = () => {
  const [annual, setAnnual] = useState(false);
  const { ref, visible } = useScrollReveal();

  const plans = [
    {
      name: "Free",
      price: 0, annualPrice: 0,
      desc: "Perfect to get started and feel the power of Seevv.",
      cta: "Start for free", ctaLink: "/signup",
      highlight: false,
      features: ["3 job targets", "1 CV upload", "5 Decoder analyses / month", "3 cover letters", "PDF export", "Basic ATS check"],
      missing: ["Voice mirroring", "Unlimited analyses", "Priority AI"],
    },
    {
      name: "Pro",
      price: 12, annualPrice: 9,
      desc: "For serious job seekers who want every advantage.",
      cta: "Get Pro →", ctaLink: "/signup",
      highlight: true, badge: "Most popular",
      features: [
        "Unlimited job targets", "Unlimited CV uploads",
        "Unlimited Decoder analyses", "Unlimited cover letters",
        "Voice mirroring AI", "Priority AI generation",
        "PDF export — all styles", "Email support",
      ],
      missing: [],
    },
    {
      name: "Team",
      price: 39, annualPrice: 29,
      desc: "For career coaches, bootcamps, and hiring teams.",
      cta: "Contact us", ctaLink: "#contact",
      highlight: false,
      features: [
        "Everything in Pro", "Up to 10 team members",
        "Shared job target workspace", "Analytics dashboard",
        "Dedicated account manager", "Custom onboarding", "SLA support",
      ],
      missing: [],
    },
  ];

  return (
    <section id="pricing" className="py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-brand-600 uppercase tracking-[0.18em] bg-brand-50 px-3 py-1.5 rounded-full mb-5">
            Pricing
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto mb-10">
            Start free. Upgrade when you're ready. No hidden fees, no CV held hostage.
          </p>
          {/* Toggle */}
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                !annual ? "bg-brand-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                annual ? "bg-brand-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Annual
              <span className="text-xs bg-teal-400 text-white px-1.5 py-0.5 rounded-full font-bold">-25%</span>
            </button>
          </div>
        </div>

        <div ref={ref} className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 flex flex-col transition-all duration-600 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              } ${
                plan.highlight
                  ? "bg-brand-600 shadow-2xl shadow-brand-600/30 scale-105"
                  : "bg-white border border-gray-200"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-teal-400 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                    {plan.badge}
                  </span>
                </div>
              )}
              <div className="mb-7">
                <p className={`text-sm font-bold mb-2 ${plan.highlight ? "text-brand-200" : "text-gray-500"}`}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-5xl font-black ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                    {plan.price === 0 ? "Free" : `£${annual ? plan.annualPrice : plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className={`text-sm pb-2 ${plan.highlight ? "text-brand-300" : "text-gray-400"}`}>/mo</span>
                  )}
                </div>
                <p className={`text-sm ${plan.highlight ? "text-brand-200" : "text-gray-500"}`}>{plan.desc}</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? "bg-teal-400" : "bg-brand-50"}`}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "white" : "#534ab7"} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <span className={plan.highlight ? "text-white" : "text-gray-700"}>{f}</span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm opacity-35">
                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </div>
                    <span className="text-gray-400">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={plan.ctaLink}
                onClick={plan.ctaLink === "#contact" ? (e) => {
                  e.preventDefault();
                  document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
                } : undefined}
                className={`block text-center py-4 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 ${
                  plan.highlight
                    ? "bg-white text-brand-600 hover:bg-brand-50 shadow-md"
                    : "bg-brand-600 text-white hover:bg-brand-800"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          All plans include a 14-day satisfaction guarantee. No credit card required for Free tier.
        </p>
      </div>
    </section>
  );
};

// ─── Partners & Sponsors ──────────────────────────────────

const PartnersSection = () => {
  const { ref, visible } = useScrollReveal();

  const partners = [
    { name: "TechLadder", type: "Partner", icon: "🏗️", desc: "Career development platform" },
    { name: "HireReady", type: "Partner", icon: "🎓", desc: "Job readiness bootcamp" },
    { name: "CareerBridge", type: "Partner", icon: "🌉", desc: "Talent marketplace" },
    { name: "SkillForge", type: "Partner", icon: "⚒️", desc: "Skills training platform" },
    { name: "RecruitIQ", type: "Sponsor", icon: "🔍", desc: "Recruitment intelligence" },
    { name: "TalentFlow", type: "Sponsor", icon: "🌊", desc: "Hiring automation" },
  ];

  return (
    <section id="partners" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-brand-600 uppercase tracking-[0.18em] bg-brand-50 px-3 py-1.5 rounded-full mb-5">
            Partners & Sponsors
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Built with the<br/>ecosystem in mind
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            We partner with platforms that share our mission — giving job seekers a genuine, lasting advantage.
          </p>
        </div>

        <div ref={ref} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {partners.map((p, i) => (
            <Tooltip key={p.name} text={p.desc} position="top">
              <div
                className={`flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-all duration-400 group cursor-default ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="w-13 h-13 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  {p.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-gray-900">{p.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      p.type === "Partner" ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {p.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{p.desc}</p>
                </div>
              </div>
            </Tooltip>
          ))}
        </div>

        <div className="bg-gradient-to-br from-brand-50 to-teal-50 border border-brand-100 rounded-3xl p-10 lg:p-14 text-center">
          <h3 className="text-2xl lg:text-3xl font-black text-gray-900 mb-3">
            Interested in partnering with Seevv?
          </h3>
          <p className="text-gray-500 text-sm max-w-lg mx-auto mb-7">
            Whether you're a career platform, bootcamp, recruiter, or employer — we'd love to explore how we can work together to help more people land the roles they deserve.
          </p>
          <Tooltip text="Let's build something great together" position="top">
            <button
              onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-4 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-800 transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm cursor-pointer"
            >
              Get in touch →
            </button>
          </Tooltip>
        </div>
      </div>
    </section>
  );
};

// ─── Contact section ──────────────────────────────────────

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 5000);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  const contacts = [
    { icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#534ab7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ), label: "Email", value: "hello@seevv.io", tip: "We reply within 24 hours" },
    { icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#534ab7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ), label: "Location", value: "United Kingdom", tip: "Built & headquartered in the UK 🇬🇧" },
    { icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#534ab7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ), label: "Response time", value: "Within 24 hours", tip: "Usually much faster" },
  ];

  return (
    <section id="contact" className="py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-brand-600 uppercase tracking-[0.18em] bg-brand-50 px-3 py-1.5 rounded-full mb-5">
            Contact
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Let's talk
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Questions, partnerships, feedback — we're all ears. Drop us a message and we'll get back to you promptly.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-4">
            {contacts.map((c) => (
              <Tooltip key={c.label} text={c.tip} position="right">
                <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-md hover:border-brand-100 transition-all cursor-default">
                  <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    {c.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                    <p className="text-sm font-bold text-gray-900">{c.value}</p>
                  </div>
                </div>
              </Tooltip>
            ))}

            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-400 font-medium mb-3">Follow us</p>
              <div className="flex gap-3">
                {[
                  { label: "Twitter / X", symbol: "𝕏", tip: "Follow for product updates" },
                  { label: "LinkedIn", symbol: "in", tip: "Connect with the team" },
                  { label: "GitHub", symbol: "⌥", tip: "Open source contributions" },
                ].map((s) => (
                  <Tooltip key={s.label} text={s.tip} position="top">
                    <button
                      className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 font-bold text-sm hover:bg-brand-600 hover:text-white transition-all cursor-pointer"
                      title={s.label}
                    >
                      {s.symbol}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-card p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-5 shadow-sm">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1d9e75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Message sent!</h3>
                <p className="text-sm text-gray-400">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Full name</label>
                    <input type="text" required value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Email address</label>
                    <input type="email" required value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Subject</label>
                  <select value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all bg-white">
                    <option value="">Select a topic…</option>
                    <option value="general">General enquiry</option>
                    <option value="partnership">Partnership / sponsorship</option>
                    <option value="support">Technical support</option>
                    <option value="pricing">Pricing & billing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Message</label>
                  <textarea required rows={5} value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Tell us what's on your mind…"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all resize-none"/>
                </div>
                <button type="submit"
                  className="w-full py-4 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-800 transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm">
                  Send message →
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Footer ───────────────────────────────────────────────

const Footer = () => {
  const year = new Date().getFullYear();

  const cols = [
    { title: "Product", links: ["Deep Decoder", "CV Rewriter", "Cover Letter AI", "PDF Export", "Pricing"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Press", "Partners"] },
    { title: "Support", links: ["Documentation", "Help centre", "Privacy policy", "Terms of service", "Contact"] },
  ];

  return (
    <footer className="bg-brand-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <img src="/logo.png" alt="Seevv" className="h-10 object-contain mb-5 brightness-0 invert"/>
            <p className="text-brand-300 text-sm leading-relaxed max-w-xs mb-6">
              AI-powered CV tailoring that understands what companies actually need — and positions you perfectly for every role.
            </p>
            <div className="flex gap-3">
              {["𝕏", "in", "⌥"].map((icon, i) => (
                <button key={i} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold text-white hover:bg-brand-600 transition-colors cursor-pointer">
                  {icon}
                </button>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold text-brand-300 uppercase tracking-[0.18em] mb-5">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-brand-400 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-brand-400 text-xs">© {year} Seevv. All rights reserved. Built in the UK 🇬🇧</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-brand-400 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-xs text-brand-400 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-xs text-brand-400 hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ─── Bottom CTA strip ─────────────────────────────────────

const CtaStrip = () => {
  const { ref, visible } = useScrollReveal();

  return (
    <section className="py-24 bg-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-brand-100 rounded-full filter blur-3xl opacity-40"/>
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-teal-50 rounded-full filter blur-3xl opacity-60"/>
      </div>
      <div
        ref={ref}
        className={`relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-5 leading-tight">
          Your next role is one{" "}
          <span className="gradient-text">tailored application</span>{" "}
          away.
        </h2>
        <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
          Join thousands of job seekers who stopped guessing and started winning. Start free — no credit card needed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="px-10 py-4 bg-brand-600 text-white font-black rounded-2xl text-base hover:bg-brand-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 text-center"
          >
            Get started for free →
          </Link>
          <Link
            to="/login"
            className="px-10 py-4 bg-gray-100 text-gray-700 font-semibold rounded-2xl text-base hover:bg-gray-200 transition-all text-center"
          >
            Already have an account
          </Link>
        </div>
      </div>
    </section>
  );
};

// ─── Root ─────────────────────────────────────────────────

const Landing = () => (
  <div className="font-sans antialiased">
    <Navbar />
    <HeroSection />
    <CompanyTicker />
    <StatsSection />
    <AboutSection />
    <ServicesSection />
    <HowSection />
    <TestimonialsSection />
    <PricingSection />
    <PartnersSection />
    <ContactSection />
    <CtaStrip />
    <Footer />
  </div>
);

export default Landing;
