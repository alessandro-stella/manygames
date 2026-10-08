import type { ComponentType } from "react";
import { GAMES } from "@/games";
import ColorGame from "./ColorGame";
import TimeGame from "./TimeGame";
import type { GameLogic, GameProps, GameDetails } from "./types";

type AnyGameComponent = ComponentType<GameProps<unknown, unknown>>;

export const GAME_COMPONENTS: Record<string, AnyGameComponent> = {
  color: ColorGame as AnyGameComponent,
  time: TimeGame as AnyGameComponent,
};

export const GAME_LOGIC = GAMES as unknown as Record<string, GameLogic>;

export const GAME_INFO: GameDetails[] = [
  {
    title: "Color",
    description: "Match the color if you can!",
    img: "color.jpg",
    link: "color",
  },
  {
    title: "Time",
    description: "Guess this time!",
    img: "time.jpg",
    link: "time",
  },
];
