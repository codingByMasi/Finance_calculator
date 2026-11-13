/** Minimal iCalendar (RFC 5545) writer for all-day events. */
export interface IcsEvent { id: string; date: string; title: string; description: string; url?: string }
export interface IcsOptions { calendarName: string; host: string; now: Date; reminderDaysBefore?: number }

/** Escape text values: backslash, semicolon, comma and newlines. */
export const icsEscape = (s: string): string => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Fold a content line at 75 octets, continuing with a space, without splitting a UTF-8 character. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let cur = '', bytes = 0, limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > limit) { parts.push(cur); cur = ''; bytes = 0; limit = 74; }
    cur += ch; bytes += n;
  }
  parts.push(cur);
  return parts.join('\r\n ');
}
const compact = (iso: string): string => iso.replace(/-/g, '');
const stamp = (d: Date): string => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
/** Day after an ISO date (DTEND is exclusive for all-day events). */
export function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

export function buildIcs(events: IcsEvent[], o: IcsOptions): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FinCalculator//Tax deadlines//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${icsEscape(o.calendarName)}`];
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:${e.id}@${o.host}`, `DTSTAMP:${stamp(o.now)}`, `DTSTART;VALUE=DATE:${compact(e.date)}`, `DTEND;VALUE=DATE:${compact(nextDay(e.date))}`,
      `SUMMARY:${icsEscape(e.title)}`, `DESCRIPTION:${icsEscape(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push('TRANSP:TRANSPARENT');
    if (o.reminderDaysBefore && o.reminderDaysBefore > 0) lines.push('BEGIN:VALARM', `TRIGGER:-P${Math.round(o.reminderDaysBefore)}D`, 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(e.title)}`, 'END:VALARM');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
