const isTrending = (current: number, average: number) => {
  return current - average > 0;
};

export { isTrending }