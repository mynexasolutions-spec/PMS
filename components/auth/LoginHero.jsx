"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ListTodo, MessagesSquare, ShieldCheck } from "lucide-react";
import { THEMES, themeKey } from "@/components/overview/timeTheme";

const LINES = {
  morning: "Plan today's to-do list and get going.",
  afternoon: "Keep the tasks moving.",
  evening: "Almost time for the night discussion.",
  night: "Wrap up the day and note what got done.",
};

const FEATURES = [
  { icon: ListTodo, title: "Morning to-do list", text: "Hand out the day's work to anyone on the team." },
  { icon: MessagesSquare, title: "Comments and night discussion", text: "Every update is timestamped." },
  { icon: ShieldCheck, title: "Project vault", text: ".env files and logins, stored encrypted." },
];

// Where the sun (or moon) sits in the 800 x 900 scene: rising, high, setting behind the hills, up again.
const SUN = { morning: [600, 400], afternoon: [560, 210], evening: [610, 548], night: [600, 230] };

const STARS = [
  [60, 90], [140, 40], [210, 150], [290, 70], [350, 190], [420, 40], [480, 130], [540, 60], [660, 40], [720, 110], [770, 60], [110, 230],
  [250, 280], [390, 300], [520, 330], [700, 330], [760, 400], [40, 330], [180, 380], [330, 420], [460, 380], [620, 430], [740, 470], [90, 450],
];

// [x, y, scale] of each pine on the near hill.
const PINES = [[330, 700, 1], [366, 714, 0.82], [408, 704, 1], [452, 718, 0.78], [640, 688, 1], [680, 700, 0.88], [96, 724, 0.8], [130, 730, 0.66]];

/** A tall version of the overview's landscape, filling whatever box it is in (anchored to the bottom). */
function Scene({ themeName }) {
  const theme = THEMES[themeName];
  const [sx, sy] = SUN[themeName];
  const [far, mid, near, front] = theme.hills;

  return (
    <svg viewBox="0 0 800 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full">
      <defs>
        <linearGradient id="login-sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="900">
          <stop offset="0" stopColor={theme.sky[0]} />
          <stop offset="1" stopColor={theme.sky[1]} />
        </linearGradient>
        <radialGradient id="login-glow">
          <stop offset="0" stopColor={theme.sun.glow} stopOpacity="0.9" />
          <stop offset="1" stopColor={theme.sun.glow} stopOpacity="0" />
        </radialGradient>
        {/* Bites a crescent out of the moon without darkening the glow around it. */}
        <mask id="login-crescent">
          <rect width="800" height="900" fill="white" />
          <circle cx={sx + 26} cy={sy - 16} r="50" fill="black" />
        </mask>
        <path id="login-pine" d="M0 0 L11 24 H-11Z M0 13 L14 40 H-14Z M0 27 L17 57 H-17Z M-2.5 57 h5 v8 h-5Z" />
      </defs>

      <rect width="800" height="900" fill="url(#login-sky)" />

      {theme.moon && STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.2 : 1.4} fill="#ffffff" opacity={i % 2 ? 0.65 : 0.95} />)}

      <circle cx={sx} cy={sy} r="160" fill="url(#login-glow)" />
      <circle cx={sx} cy={sy} r="58" fill={theme.sun.core} mask={theme.moon ? "url(#login-crescent)" : undefined} />

      {theme.clouds && (
        <g fill="#ffffff" opacity="0.9">
          <ellipse cx="150" cy="300" rx="70" ry="20" />
          <ellipse cx="190" cy="285" rx="44" ry="22" />
          <ellipse cx="118" cy="292" rx="34" ry="16" />
          <ellipse cx="640" cy="420" rx="80" ry="20" />
          <ellipse cx="682" cy="404" rx="46" ry="22" />
          <ellipse cx="420" cy="140" rx="54" ry="14" />
          <ellipse cx="446" cy="130" rx="30" ry="14" />
        </g>
      )}

      {!theme.moon && (
        <g fill="none" stroke={theme.ink} strokeWidth="2.2" strokeLinecap="round" opacity="0.7">
          <path d="M470 330 q8 -7 15 2 q7 -9 15 -2" />
          <path d="M505 362 q6 -5 11 1.5 q5 -6.5 11 -1.5" />
          <path d="M440 372 q5 -4 9 1 q4 -5 9 -1" />
        </g>
      )}

      <path d="M0 650 L90 585 L170 625 L280 540 L390 615 L480 570 L590 630 L690 560 L800 610 V900 H0Z" fill={far} />
      <path d="M0 715 L100 668 L200 702 L310 650 L410 700 L520 662 L630 706 L730 668 L800 690 V900 H0Z" fill={mid} />
      <path d="M0 785 Q140 730 300 765 T600 752 T800 738 V900 H0Z" fill={near} />
      <g fill={theme.tree}>
        {PINES.map(([x, y, scale]) => (
          <use key={`${x}-${y}`} href="#login-pine" transform={`translate(${x} ${y}) scale(${scale})`} />
        ))}
      </g>
      <path d="M0 900 V842 Q210 800 430 830 T800 815 V900 H0Z" fill={front} />
    </svg>
  );
}

/**
 * The left half of the sign-in page: brand, a greeting and the landscape for the time of day.
 * `initialHour` is the server's guess (IST) so the first paint already shows the right sky; the browser's clock wins after that.
 */
export default function LoginHero({ initialHour }) {
  const [hour, setHour] = useState(initialHour);

  useEffect(() => {
    const tick = () => setHour(new Date().getHours());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  const themeName = themeKey(hour);
  const dark = themeName === "night";

  return (
    <section
      className={`relative isolate flex h-[240px] flex-col overflow-hidden rounded-b-[28px] p-6 sm:h-[270px] sm:p-8 lg:sticky lg:top-4 lg:m-4 lg:h-[calc(100dvh-2rem)] lg:min-h-[620px] lg:rounded-[28px] lg:p-11 ${
        dark ? "text-white" : "text-ink"
      }`}
    >
      <Scene themeName={themeName} />

      <div className="flex items-center gap-3">
        <div className="grid h-[44px] w-[44px] place-items-center rounded-[12px] bg-white shadow-md ring-1 ring-black/10 p-1.5">
          <Image src="/logo.png" alt="Nexa PMS Logo" width={38} height={38} className="h-full w-full object-contain" priority />
        </div>
        <div className="leading-tight">
          <p className="text-[22px] font-bold tracking-tight">Nexa PMS</p>
          <p className={`text-[12.5px] font-medium ${dark ? "text-white/70" : "text-ink/65"}`}>Nexa Solution</p>
        </div>
      </div>

      <div className="mt-5 lg:mt-[9vh]">
        <h2 className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px] lg:text-[46px]">
          {THEMES[themeName].greeting} <span className="inline-block">{THEMES[themeName].emoji}</span>
        </h2>
        <p className={`mt-1 text-[15px] sm:text-[16px] lg:mt-2 lg:text-[18px] ${dark ? "text-white/80" : "text-ink/75"}`}>{LINES[themeName]}</p>
      </div>

      <ul
        className={`mt-8 hidden max-w-[440px] gap-1 rounded-2xl p-2 ring-1 backdrop-blur-md lg:grid ${
          dark ? "bg-white/10 ring-white/15" : "bg-white/60 ring-white/70 shadow-[0_10px_30px_-12px_rgba(16,60,35,0.25)]"
        }`}
      >
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-3.5 rounded-xl px-3 py-2.5">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${dark ? "bg-white/15 text-white" : "bg-[#e8f7ec] text-brand-700"}`}>
              <Icon size={19} />
            </span>
            <span className="leading-snug">
              <span className="block text-[15px] font-semibold">{title}</span>
              <span className={`block text-[13.5px] ${dark ? "text-white/70" : "text-ink/65"}`}>{text}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-auto hidden text-[13px] font-medium text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.25)] lg:block">
        Internal workspace for the Nexa Solution team.
      </p>
    </section>
  );
}
