import type { ComponentChildren } from 'preact';
type P = { size?: number };
const svg = (size: number, d: ComponentChildren, sw = 2) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={sw} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    {d}
  </svg>
);

export const IconToday = ({ size = 24 }: P) =>
  svg(size, <><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.7L16.2 9.5" /></>);
export const IconCalendar = ({ size = 24 }: P) =>
  svg(size, <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>);
export const IconList = ({ size = 24 }: P) =>
  svg(size, <><path d="M9 6.5h11M9 12h11M9 17.5h11" /><circle cx="4.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="17.5" r="1.2" fill="currentColor" stroke="none" /></>);
export const IconPlus = ({ size = 20 }: P) => svg(size, <path d="M12 5v14M5 12h14" />, 2.4);
export const IconCheck = ({ size = 18 }: P) => svg(size, <path d="m5 12.5 4.5 4.5L19 7.5" />, 2.6);
export const IconChevron = ({ size = 18 }: P) => svg(size, <path d="m9 6 6 6-6 6" />, 2.2);
export const IconMore = ({ size = 20 }: P) =>
  svg(size, <><circle cx="5.5" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="18.5" cy="12" r="1.6" fill="currentColor" stroke="none" /></>);
export const IconMinus = ({ size = 16 }: P) => svg(size, <path d="M6 12h12" />, 2.6);
export const IconUp = ({ size = 18 }: P) => svg(size, <path d="m6 15 6-6 6 6" />, 2.2);
export const IconDown = ({ size = 18 }: P) => svg(size, <path d="m6 9 6 6 6-6" />, 2.2);
export const IconLeft = ({ size = 18 }: P) => svg(size, <path d="m15 6-6 6 6 6" />, 2.4);
