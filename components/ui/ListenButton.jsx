"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, Square } from "lucide-react";

const LANGS = [
  { code: "en-IN", label: "EN", title: "English (en-IN) voice" },
  { code: "hi-IN", label: "हिं", title: "Hindi (hi-IN) voice" },
];
const LANG_KEY = "pms-listen-lang";
const SPEEDS = [1, 1.25, 1.5, 0.75];

// Markdown/HTML symbols hata ke plain text banata hai, taaki "hash hash" na bole.
export function toSpeechText(raw) {
  return String(raw || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " link ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+(\[[ xX]\]\s+)?/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/(\*\*|__|\*|_|~~)/g, "")
    .replace(/[|]/g, " ")
    .replace(/\s*\n+\s*/g, ". ")
    .replace(/\.\s*\.+/g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Lambe text ko chhote tukdon mein todta hai (Chrome/Safari lambe text par ruk jaate hain).
function chunkText(text, max = 180) {
  const sentences = text.match(/[^.!?।]+[.!?।]*/g) || [text];
  const chunks = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      chunks.push(cur.trim());
      cur = "";
    }
    if (s.length > max) {
      const words = s.split(/\s+/);
      let part = "";
      for (const w of words) {
        if ((part + " " + w).length > max && part) {
          chunks.push(part.trim());
          part = "";
        }
        part += " " + w;
      }
      cur += part;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(Boolean);
}

function pickVoice(lang) {
  const voices = window.speechSynthesis.getVoices();
  const norm = (v) => v.lang.replace("_", "-").toLowerCase();
  const exact = voices.filter((v) => norm(v) === lang.toLowerCase());
  const prefix = lang.slice(0, 2).toLowerCase();
  return (
    exact.find((v) => /neural|natural|online|google/i.test(v.name)) ||
    exact[0] ||
    voices.find((v) => norm(v).startsWith(prefix)) ||
    null
  );
}

export default function ListenButton({ text, className = "", size = 15 }) {
  const [speaking, setSpeaking] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [supported, setSupported] = useState(true);
  const [langIdx, setLangIdx] = useState(0);
  const runId = useRef(0);

  useEffect(() => {
    try {
      const i = LANGS.findIndex((l) => l.code === localStorage.getItem(LANG_KEY));
      if (i >= 0) setLangIdx(i);
    } catch {}
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    // Safari/Chrome mein voices late load hoti hain.
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
    return () => {
      runId.current++;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    runId.current++;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const start = useCallback(
    (rate, lang) => {
      const clean = toSpeechText(text);
      if (!clean) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const id = ++runId.current;
      const chunks = chunkText(clean);
      const voice = pickVoice(lang);
      setSpeaking(true);

      const next = (i) => {
        if (id !== runId.current) return;
        if (i >= chunks.length) {
          setSpeaking(false);
          return;
        }
        const u = new SpeechSynthesisUtterance(chunks[i]);
        u.lang = lang;
        u.rate = rate;
        if (voice) u.voice = voice;
        u.onend = () => next(i + 1);
        u.onerror = (e) => {
          if (e.error === "interrupted" || e.error === "canceled") return;
          if (id === runId.current) setSpeaking(false);
        };
        synth.speak(u);
      };
      // Safari ke liye pehla speak click handler ke andar hi hona chahiye.
      next(0);
    },
    [text]
  );

  if (!supported) return null;

  const rate = SPEEDS[speedIdx];
  const lang = LANGS[langIdx];

  return (
    <span className="inline-flex items-center gap-0.5 sm:gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (speaking) stop();
          else start(rate, lang.code);
        }}
        className={
          className ||
          "grid h-8 w-8 place-items-center rounded-xl border border-line/80 bg-[#f6f9f7] text-ink/75 transition hover:bg-[#eaf4ed] hover:text-ink cursor-pointer"
        }
        title={speaking ? "Stop listening" : "Listen"}
        aria-label={speaking ? "Stop listening" : "Listen"}
      >
        {speaking ? <Square size={size - 2} fill="currentColor" /> : <Volume2 size={size} />}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const n = (langIdx + 1) % LANGS.length;
          setLangIdx(n);
          try {
            localStorage.setItem(LANG_KEY, LANGS[n].code);
          } catch {}
          if (speaking) start(rate, LANGS[n].code);
        }}
        className="h-8 min-w-[1.75rem] sm:min-w-[2rem] rounded-xl px-1 sm:px-1.5 text-[11px] sm:text-[11.5px] font-bold text-brand-700 hover:bg-black/5 cursor-pointer"
        title={`${lang.title} - click to switch`}
      >
        {lang.label}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const n = (speedIdx + 1) % SPEEDS.length;
          setSpeedIdx(n);
          if (speaking) start(SPEEDS[n], lang.code);
        }}
        className="h-8 min-w-[2rem] sm:min-w-[2.4rem] rounded-xl px-1 sm:px-1.5 text-[11px] sm:text-[11.5px] font-bold text-ink/70 hover:bg-black/5 cursor-pointer"
        title="Speech speed"
      >
        {rate}x
      </button>
    </span>
  );
}
