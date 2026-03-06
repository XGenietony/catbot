/**
 * Formats a timestamp into a short date-time string: MM-DD HH:mm
 * Example: 01-05 14:30
 */
export function formatMessageTime(timestamp: number | string | Date): string {
  const date = new Date(timestamp)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${month}-${day} ${hours}:${minutes}`
}
