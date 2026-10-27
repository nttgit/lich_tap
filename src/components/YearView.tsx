import { useMemo, useRef } from 'preact/hooks';
import type { Category, Data, DayLog } from '../types';
import { daysInMonth, fromKey, mondayIndex, monthIdx, toKey } from '../lib/date';
import { fillGradient } from '../lib/colors';
import { IconChevron, IconLeft } from './Icons';

type Props = {
  data: Data;
  today: string;
  year: number;
  minYear: number;
  closing: boolean;
  onYear: (y: number) => void;
  onPick: (idx: number) => void;
  onToday: () => void;
};

/** Màn xem cả năm: 12 tháng thu nhỏ, mỗi ngày có tập là một chấm màu. */
export function YearView({ data, today, year, minYear, closing, onYear, onPick, onToday }: Props) {
  const t = fromKey(today);
  const curYear = t.getFullYear();
  const curIdx = monthIdx(curYear, t.getMonth());
  const catMap = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);
  const stats = useMemo(() => yearStats(data.days, catMap, year, today), [data.days, catMap, year, today]);

  const canPrev = year > minYear;
  const canNext = year < curYear;

  // vuốt ngang để đổi năm
  const sw = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => (sw.current = { x: e.touches[0].clientX, y: e.touches[0].clientY });
  const onTouchEnd = (e: TouchEvent) => {
    if (!sw.current) return;
    const dx = e.changedTouches[0].clientX - sw.current.x;
    const dy = e.changedTouches[0].clientY - sw.current.y;
    sw.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && canNext) onYear(year + 1);
    if (dx > 0 && canPrev) onYear(year - 1);
  };

  return (
    <div class={`year-view${closing ? ' closing' : ''}`}>
      <div class="yv-scroll" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div class="yv-head">
          <h1 class="cal-title">{year}</h1>
          <div class="yv-nav">
            <button class="icon-btn" disabled={!canPrev} aria-label={`Năm ${year - 1}`} onClick={() => onYear(year - 1)}>
              <IconLeft size={22} />
            </button>
            <button class="icon-btn" disabled={!canNext} aria-label={`Năm ${year + 1}`} onClick={() => onYear(year + 1)}>
              <IconChevron size={22} />
            </button>
          </div>
        </div>

        <div class="stat-row">
          <span class="stat">
            <b>{stats.done}</b> buổi tập
          </span>
          <span class="stat">
            Chuỗi dài nhất <b>{stats.longest}</b> ngày
          </span>
          {stats.cats.map(([c, n]) => (
            <span key={c.id} class="stat" style={{ '--c': c.color }}>
              <i class="dot" />
              {c.name} <b>{n}</b>
            </span>
          ))}
        </div>

        <div class="yv-grid" key={year}>
          {stats.perMonth.map((count, m) => {
            const idx = monthIdx(year, m);
            return (
              <MiniMonth
                key={m}
                y={year}
                m={m}
                days={data.days}
                catMap={catMap}
                today={today}
                count={count}
                cur={idx === curIdx}
                future={idx > curIdx}
                onPick={() => onPick(idx)}
              />
            );
          })}
        </div>
      </div>

      <button class="float-today" onClick={onToday}>
        Hôm nay
      </button>
    </div>
  );
}

function MiniMonth({
  y,
  m,
  days,
  catMap,
  today,
  count,
  cur,
  future,
  onPick,
}: {
  y: number;
  m: number;
  days: Record<string, DayLog>;
  catMap: Map<string, Category>;
  today: string;
  count: number;
  cur: boolean;
  future: boolean;
  onPick: () => void;
}) {
  const first = mondayIndex(new Date(y, m, 1));
  const n = daysInMonth(y, m);
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(<i key={`b${i}`} class="md blank" />);
  for (let d = 1; d <= n; d++) {
    const k = toKey(new Date(y, m, d));
    const log = days[k];
    const colors = log?.status === 'done' ? log.cats.map((id) => catMap.get(id)?.color).filter((c): c is string => !!c) : [];
    const cls = `md${k > today ? ' fut' : ''}${k === today ? ' tdy' : ''}${log?.status === 'rest' ? ' rst' : ''}`;
    cells.push(<i key={k} class={cls} style={colors.length ? { background: fillGradient(colors, 1) } : undefined} />);
  }
  return (
    <button class={`mm${cur ? ' cur' : ''}`} disabled={future} aria-label={`Tháng ${m + 1}: ${count} buổi tập`} onClick={onPick}>
      <span class="mm-head">
        <span class="mm-name">Tháng {m + 1}</span>
        {count > 0 && <span class="mm-count">{count}</span>}
      </span>
      <span class="mm-grid">{cells}</span>
    </button>
  );
}

function yearStats(days: Record<string, DayLog>, catMap: Map<string, Category>, year: number, today: string) {
  const isDone = (l?: DayLog) => l?.status === 'done' && l.cats.length > 0;
  const perMonth = Array<number>(12).fill(0);
  const counts = new Map<string, number>();
  let done = 0;
  let longest = 0;
  let run = 0;
  const d = new Date(year, 0, 1);
  while (d.getFullYear() === year) {
    const k = toKey(d);
    if (k > today) break;
    const l = days[k];
    if (isDone(l)) {
      done++;
      perMonth[d.getMonth()]++;
      for (const c of l!.cats) counts.set(c, (counts.get(c) ?? 0) + 1);
      run++;
      if (run > longest) longest = run;
    } else run = 0;
    d.setDate(d.getDate() + 1);
  }
  const cats: [Category, number][] = [];
  for (const [id, n] of counts) {
    const c = catMap.get(id);
    if (c) cats.push([c, n]);
  }
  cats.sort((a, b) => b[1] - a[1]);
  return { done, longest, perMonth, cats };
}
