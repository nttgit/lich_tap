import { IconCalendar, IconList, IconToday } from './Icons';

export type Tab = 'today' | 'cal' | 'manage';

export function TabBar({ tab, onTab, todayDone }: { tab: Tab; onTab: (t: Tab) => void; todayDone: boolean }) {
  const items: [Tab, string, preact.JSX.Element][] = [
    ['today', 'Hôm nay', <IconToday />],
    ['cal', 'Lịch', <IconCalendar />],
    ['manage', 'Bài tập', <IconList />],
  ];
  return (
    <nav class="tabbar" aria-label="Điều hướng">
      {items.map(([k, label, icon]) => (
        <button key={k} class={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => onTab(k)}>
          <span class="tab-icon">
            {icon}
            {k === 'today' && !todayDone && <i class="badge" />}
          </span>
          <span class="tab-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
