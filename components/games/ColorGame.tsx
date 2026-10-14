"use client";

import { useEffect, useState, type PointerEvent } from "react";
import type { GameProps } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { colorGame } from "@/games/color";

type Rgb = [number, number, number];
type Hsv = [number, number, number];
type ColorData = { colors: Rgb[] };
type ColorSubmission = { guesses: Rgb[] };

const toHex = (rgb: Rgb) =>
  "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");

const hsvToRgb = (h: number, s: number, v: number): Rgb => {
  s = s / 100;
  v = v / 100;
  const f = (n: number, k = (n + h / 60) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [
    Math.round(f(5) * 255),
    Math.round(f(3) * 255),
    Math.round(f(1) * 255),
  ];
};

const rgbToHsv = ([r8, g8, b8]: Rgb): Hsv => {
  const r = r8 / 255;
  const g = g8 / 255;
  const b = b8 / 255;
  const v = Math.max(r, g, b);
  const c = v - Math.min(r, g, b);
  const h =
    c && (v === r ? (g - b) / c : v === g ? 2 + (b - r) / c : 4 + (r - g) / c);
  return [
    Math.round((h < 0 ? h + 6 : h) * 60) || 0,
    Math.round(v && (c / v) * 100),
    Math.round(v * 100),
  ];
};

const getContrastTextClass = ([r, g, b]: Rgb) => {
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "text-black" : "text-white";
};

const hueDistance = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomStartHsv = (target: Rgb, minH = 60): Hsv => {
  const [th] = rgbToHsv(target);

  for (let i = 0; i < 100; i++) {
    const h = randInt(0, 360);
    if (hueDistance(h, th) >= minH) return [h, 100, 100];
  }

  return [(th + 180) % 360, 100, 100];
};

type SliderProps = {
  position: number;
  onChange: (position: number) => void;
  background: string;
};

function VerticalSlider({ position, onChange, background }: SliderProps) {
  const update = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = (e.clientY - rect.top) / rect.height;
    onChange(Math.min(1, Math.max(0, t)));
  };

  return (
    <div
      className="relative w-10 cursor-pointer touch-none select-none"
      style={{ background }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e);
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 aspect-square mx-auto w-2/3 rounded-full shadow-2xl -translate-y-1/2 bg-white"
        style={{ top: `${position * 100}%` }}
      />
    </div>
  );
}

export default function ColorGame({
  data,
  submit,
  hasSubmitted,
}: GameProps<ColorData, ColorSubmission>) {
  const totalTime = 5000;
  const delay = 300;

  const [waitNext, setWaitNext] = useState(true);
  const [delaying, setDelaying] = useState(false);
  const [guessing, setGuessing] = useState(false);

  const [timer, setTimer] = useState(0);
  const [step, setStep] = useState(0);
  const [guesses, setGuesses] = useState<Rgb[]>([]);

  const initialHsv = randomStartHsv(data.colors[0]);
  const [h, setH] = useState(initialHsv[0]);
  const [s, setS] = useState(initialHsv[1]);
  const [v, setV] = useState(initialHsv[2]);

  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const resetSliders = (target: Rgb) => {
    const [nh, ns, nv] = randomStartHsv(target);
    setH(nh);
    setS(ns);
    setV(nv);
  };

  useEffect(() => {
    if (!waitNext && !guessing) {
      const startTime = performance.now();
      let animationFrameId: number;
      let delayTimeout: NodeJS.Timeout;

      const updateTimer = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const remaining = Math.max(0, totalTime - elapsed);

        setTimer(remaining);

        if (remaining > 0) {
          animationFrameId = requestAnimationFrame(updateTimer);
        } else {
          setDelaying(true);

          delayTimeout = setTimeout(() => {
            setDelaying(false);
            setGuessing(true);
          }, delay);
        }
      };

      animationFrameId = requestAnimationFrame(updateTimer);

      return () => {
        cancelAnimationFrame(animationFrameId);
        clearTimeout(delayTimeout);
      };
    }
  }, [waitNext, guessing]);

  useEffect(() => {
    if (activeLabel) {
      const t = setTimeout(() => {
        setActiveLabel(null);
      }, 1000);

      return () => clearTimeout(t);
    }
  }, [h, s, v, activeLabel]);

  if (hasSubmitted) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold">Result submitted!</h2>
        <p className="text-gray-400">Check the leaderboard below.</p>
      </div>
    );
  }

  const guess = hsvToRgb(h, s, v);
  const currentColor = guessing ? guess : data.colors[step];
  const textColorClass = getContrastTextClass(currentColor);

  const confirm = () => {
    const next = [...guesses, guess];

    if (next.length === data.colors.length) {
      submit({ guesses: next });
    } else {
      setGuesses(next);
      setStep(step + 1);
      resetSliders(data.colors[step + 1]);
      setGuessing(false);
      setDelaying(false);
      setActiveLabel(null);
      setWaitNext(true);
    }
  };

  return (
    <div className="h-full flex flex-col items-center gap-4 p-8">
      <div
        className={`relative h-[60dvh] w-[60dvh] rounded-xl overflow-hidden shadow-lg ${!guessing ? "transition-colors duration-1000" : ""}`}
        style={{ backgroundColor: waitNext ? "black" : toHex(currentColor) }}
      >
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-4 transition-opacity duration-700 p-8 ${waitNext ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-[-1]"}`}
        >
          <div className="w-full grid grid-cols-5 gap-4">
            {data.colors.map((c, i) => (
              <div key={String(c)} className="flex flex-col items-center gap-2">
                <div
                  className="w-full aspect-square rounded shadow overflow-hidden"
                  style={
                    guesses[i]
                      ? {
                          background: `linear-gradient(to bottom right, ${toHex(c)} 50%, ${toHex(guesses[i])} 50%)`,
                        }
                      : {
                          backgroundColor: "white",
                        }
                  }
                >
                  {!guesses[i] && (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-300">
                      ?
                    </div>
                  )}
                </div>
                <div>
                  {guesses[i] ? colorGame.scoreSingle(c, guesses[i]) : "TBD"}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setWaitNext(false)}
            className="bg-white text-black px-6 py-3 rounded-full font-bold shadow-2xl hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>

        <div
          className={`absolute inset-0 flex flex-col justify-end p-8 transition-opacity duration-700 ${!waitNext && !guessing && !delaying ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <div className="w-full flex justify-end text-6xl">
            {Math.floor(timer / 10)
              .toString()
              .padStart(3, "0")}
          </div>
        </div>

        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${guessing ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-[-1]"}`}
        >
          <div className="absolute top-0 left-0 h-full flex gap-1">
            <div className="flex shadow-2xl">
              <VerticalSlider
                position={h / 360}
                onChange={(t) => {
                  setH(Math.round(t * 360));
                  setActiveLabel("HUE");
                }}
                background="linear-gradient(to bottom, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)"
              />
              <VerticalSlider
                position={1 - s / 100}
                onChange={(t) => {
                  setS(Math.round((1 - t) * 100));
                  setActiveLabel("Saturation");
                }}
                background={`linear-gradient(to bottom, ${toHex(hsvToRgb(h, 100, v))}, ${toHex(hsvToRgb(h, 0, v))})`}
              />
              <VerticalSlider
                position={1 - v / 100}
                onChange={(t) => {
                  setV(Math.round((1 - t) * 100));
                  setActiveLabel("Brightness");
                }}
                background={`linear-gradient(to bottom, ${toHex(hsvToRgb(h, s, 100))}, #000000)`}
              />
            </div>
            <div
              className={`flex flex-col justify-between p-2 font-medium ${textColorClass}`}
            >
              <div>
                {step + 1} / {data.colors.length}
              </div>
              <div
                className={`transition-opacity duration-300 font-bold tracking-wide ${activeLabel ? "opacity-100" : "opacity-0"}`}
              >
                {activeLabel || "\u00A0"}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 flex items-center p-4">
            <button
              onClick={confirm}
              className="bg-white text-black p-4 aspect-square flex items-center justify-center text-2xl rounded-full cursor-pointer shadow-2xl hover:bg-gray-100 transition-colors"
            >
              <FontAwesomeIcon icon={faCrosshairs} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
