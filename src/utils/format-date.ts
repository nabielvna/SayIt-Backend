// Format date to ISO string
export function formatDates(obj: Record<string, any>) {
  const formatted = { ...obj };
  for (const [key, value] of Object.entries(formatted)) {
    if (value instanceof Date) {
      // Memastikan semua tanggal dalam format UTC yang konsisten
      formatted[key] = value.toISOString();
    }
    else if (value === null) {
      formatted[key] = null;
    }
  }
  return formatted;
}
