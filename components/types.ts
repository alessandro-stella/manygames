export interface GameProps<TData = unknown, TSubmission = unknown> {
  data: TData;
  submit: (submission: TSubmission) => void;
  hasSubmitted: boolean;
}

export interface GameLogic {
  order: "asc" | "desc";
  generate(): unknown;
  toPublic(data: unknown): unknown;
  scoreSingle(target: unknown, guess: unknown): number;
  score(data: unknown, submission: unknown): number;
}

export type GameDetails = {
  title: string;
  description: string;
  img: string;
  link: string;
};
