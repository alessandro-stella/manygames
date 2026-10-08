"use client";

import { useState } from "react";
import type { GameProps } from "./types";

type Rgb = [number, number, number];
type ColorData = { colors: Rgb[] };
type ColorSubmission = { guesses: Rgb[] };

const toHex = (rgb: Rgb) =>
  "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");

const fromHex = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

export default function ColorGame({
  data,
  submit,
  hasSubmitted,
}: GameProps<ColorData, ColorSubmission>) {
  const [step, setStep] = useState(0);
  const [guesses, setGuesses] = useState<Rgb[]>([]);
  const [current, setCurrent] = useState("#808080");

  if (hasSubmitted) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold">Result submitted!</h2>
        <p className="text-gray-400">Check the leaderboard below.</p>
      </div>
    );
  }

  const confirm = () => {
    const next = [...guesses, fromHex(current)];
    if (next.length === data.colors.length) {
      submit({ guesses: next });
    } else {
      setGuesses(next);
      setStep(step + 1);
      setCurrent("#808080");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold">
        Color {step + 1} / {data.colors.length}
      </h2>
      <p className="text-gray-400">Reproduce this color as closely as you can</p>

      <div
        className="w-48 h-48 rounded-xl border border-gray-600"
        style={{ backgroundColor: toHex(data.colors[step]) }}
      />

      <div className="flex items-center gap-4">
        <input
          type="color"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-24 h-12 cursor-pointer"
        />
        <button
          onClick={confirm}
          className="bg-green-600 hover:bg-green-500 font-bold px-6 py-3 rounded"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
