export function exponentialBackoff(attempt: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.pow(2, attempt) * 1000);
  });
}
