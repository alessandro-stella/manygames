const rand = () => Math.floor(Math.random() * 256);
const maxSingleError = Math.hypot(255, 255, 255);

export const colorGame = {
  order: "desc",
  generate: () => ({
    colors: Array.from({ length: 5 }, () => [rand(), rand(), rand()]),
  }),
  toPublic: (data) => data,

  scoreSingle: (target, guess) => {
    const c = target;
    const g = guess ?? [0, 0, 0];
    const error = Math.hypot(c[0] - g[0], c[1] - g[1], c[2] - g[2]);

    const score = 10 - (error / maxSingleError) * 10;
    return Math.max(0, Number(score.toFixed(2)));
  },

  score: ({ colors }, { guesses }) => {
    const scores = colors.map((c, i) => colorGame.scoreSingle(c, guesses[i]));
    const total = scores.reduce((partial, s) => partial + s, 0);

    return Number(total.toFixed(2));
  },
};
