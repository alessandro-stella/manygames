export const timeGame = {
  order: "asc",
  generate: () => ({ targetMs: 3000 + Math.floor(Math.random() * 7000) }),
  toPublic: (data) => data,
  score: (data, { stoppedMs }) => Math.abs(data.targetMs - stoppedMs),
};
