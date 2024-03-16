export function formatUnixTime(ms: number): string {
  const date = new Date(ms);
  return `${date.toDateString()}, ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
