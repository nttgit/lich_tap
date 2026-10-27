const pad = (n: number) => String(n).padStart(2, '0');

export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromKey(k: string) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayKey = () => toKey(new Date());

export function addDays(k: string, n: number) {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

const WEEKDAY = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
export const WEEK_HEAD = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** "Thứ ba, 27 tháng 10" */
export function longDate(k: string) {
  const d = fromKey(k);
  return `${WEEKDAY[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}`;
}

/** 0 = thứ hai … 6 = chủ nhật */
export const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;

export const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

/** "2026-10" */
export const monthKey = (y: number, m: number) => `${y}-${pad(m + 1)}`;

/** Số thứ tự tháng liên tục qua các năm: 2026-10 → 2026*12+9 */
export const monthIdx = (y: number, m: number) => y * 12 + m;
export const idxYear = (i: number) => Math.floor(i / 12);
export const idxMonth = (i: number) => i % 12;
export const keyToIdx = (k: string) => monthIdx(+k.slice(0, 4), +k.slice(5, 7) - 1);
