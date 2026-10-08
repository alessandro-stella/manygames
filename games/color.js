const rand = () => Math.floor(Math.random() * 256);

export const colorGame = {
  order: "asc",
  generate: () => ({
    colors: Array.from({ length: 5 }, () => [rand(), rand(), rand()]),
  }),
  toPublic: (data) => data,
  score: (data, { guesses }) =>
    data.colors.reduce((sum, c, i) => {
      const g = guesses[i] ?? [0, 0, 0];
      return sum + Math.hypot(c[0] - g[0], c[1] - g[1], c[2] - g[2]);
    }, 0),
};
