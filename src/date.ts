export function formatUnixTime(seconds: number): string {
  const date = new Date(seconds * 1000);
  return `${date.toDateString()}, ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
