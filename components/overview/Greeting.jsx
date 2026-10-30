"use client";

import { useApp } from "@/components/AppProvider";
import { longDate } from "@/lib/datetime";
import { THEMES, themeKey } from "./timeTheme";

function Landscape({ theme }) {
  const mask = "linear-gradient(to right, transparent 0%, black 38%)";
  const [far, mid, near, front] = theme.hills;
  const { sun } = theme;

  return (
    <svg
      viewBox="0 0 760 130"
      preserveAspectRatio="xMaxYMax slice"
      aria-hidden="true"
      className="pointer-events-none absolute right-[-30px] top-0 hidden h-full w-[810px] max-w-[calc(100%+30px)] md:block"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.sky[0]} />
          <stop offset="1" stopColor={theme.sky[1]} />
        </linearGradient>
        <radialGradient id="sun">
          <stop offset="0" stopColor={sun.glow} />
          <stop offset="1" stopColor={sun.glow} stopOpacity="0" />
        </radialGradient>
        <g id="pine">
          <path d="M0 0 L7 15 H-7Z M0 8 L9 25 H-9Z M0 17 L11 36 H-11Z" />
          <rect x="-1.5" y="36" width="3" height="5" />
        </g>
      </defs>

      <rect width="760" height="130" fill="url(#sky)" />

      {theme.stars?.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1.1} fill="#ffffff" opacity={i % 2 ? 0.7 : 0.95} />
      ))}

      <circle cx={sun.x} cy={sun.y} r="52" fill="url(#sun)" />
      <circle cx={sun.x} cy={sun.y} r="22" fill={sun.core} />
      {/* A second, sky-coloured disc bites a crescent out of the moon. */}
      {theme.moon && <circle cx={sun.x + 9} cy={sun.y - 5} r="19" fill={theme.sky[0]} opacity="0.95" />}

      {theme.clouds && (
        <g fill="#ffffff" opacity="0.85">
          <ellipse cx="300" cy="30" rx="30" ry="9" />
          <ellipse cx="320" cy="25" rx="20" ry="9" />
          <ellipse cx="575" cy="46" rx="34" ry="9" />
          <ellipse cx="598" cy="40" rx="20" ry="8" />
        </g>
      )}

      <path d="M0 96 L90 52 L150 80 L232 36 L322 86 L402 58 L482 92 L562 48 L652 88 L760 60 V130 H0Z" fill={far} />
      <path d="M0 112 L70 82 L140 102 L222 70 L300 106 L382 84 L470 108 L562 76 L662 108 L760 88 V130 H0Z" fill={mid} />
      <path d="M0 126 Q120 96 240 118 T480 112 T760 104 V130 H0Z" fill={near} />
      <g fill={theme.tree}>
        <use href="#pine" x="262" y="84" />
        <use href="#pine" x="284" y="92" transform="translate(0 -4) scale(0.9)" />
        <use href="#pine" x="318" y="88" />
        <use href="#pine" x="352" y="96" transform="scale(0.85)" />
        <use href="#pine" x="392" y="90" />
        <use href="#pine" x="560" y="90" transform="translate(0 6) scale(0.9)" />
        <use href="#pine" x="600" y="94" />
      </g>
      <path d="M0 130 Q160 108 330 124 T760 118 V130 H0Z" fill={front} />

      {!theme.moon && (
        <g fill="none" stroke={theme.ink} strokeWidth="1.4" strokeLinecap="round">
          <path d="M528 30 q4 4 8 0" />
          <path d="M548 38 q3 3 6 0" />
        </g>
      )}
    </svg>
  );
}

export default function Greeting({ title, subtitle, showWave = true, showQuote = true }) {
  const { now, todayDate } = useApp();
  const theme = THEMES[themeKey(now?.getHours())];
  const greeting = now ? theme.greeting : "Hello";

  return (
    <section className="relative -mt-4 min-h-[136px] pt-[22px]">
      <Landscape theme={theme} />
      <div className="relative max-w-[620px]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-ink/80">{longDate(todayDate)}</p>
        <h1 className="mt-1.5 text-[30px] font-extrabold leading-tight tracking-tight sm:text-[34px] md:text-[38px]">
          {title ?? `${greeting}, team`} {showWave && <span className="inline-block">{theme.emoji}</span>}
        </h1>
        <p className="mt-0.5 text-[15px] sm:text-[16px] text-muted">{subtitle ?? "Let's ship great work for every project today."}</p>
      </div>
      {showQuote && (
        <blockquote className={`relative mt-4 w-[190px] border-l-2 pl-3 text-[14px] italic leading-snug hidden lg:block lg:absolute lg:right-3 lg:top-[30px] lg:mt-0 ${theme.quote}`}>
          “A little progress each day adds up to big results.”
        </blockquote>
      )}
    </section>
  );
}
