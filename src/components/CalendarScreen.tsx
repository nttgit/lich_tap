import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Category, Data, DayLog } from '../types';
import { WEEK_HEAD, addDays, daysInMonth, fromKey, idxMonth, idxYear, keyToIdx, monthIdx, monthKey, mondayIndex, toKey } from '../lib/date';
import { ringGradient } from '../lib/colors';
import type { State } from '../lib/store';
import { SyncBadge } from './SyncBadge';
import { YearView } from './YearView';
import { IconLeft } from './Icons';

type Props = {
  state: State;
  data: Data;
  today: string;
  pulse: string | null;
  onOpenDay: (date: string) => void;
};

const HEAD_H = 50; // chiều cao dòng tên tháng
const ROW_H = 62; // chiều cao 1 tuần
const PAGE = 12; // số tháng tải thêm mỗi lần
const COVER = 80; // phần đáy bị tab bar che, không tính là "đang thấy"

export function CalendarScreen({ state, data, today, pulse, onOpenDay }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const t = fromKey(today);
  const curIdx = monthIdx(t.getFullYear(), t.getMonth());

  // Tháng sớm nhất có dữ liệu
  const earliestIdx = useMemo(() => {
    let e = today;
    for (const k in data.days) if (k < e) e = k;
    return keyToIdx(e);
  }, [data.days, today]);

  // Vẽ 12 tháng gần nhất + 1 tháng sau (để cuộn xuống có cảm giác lịch còn tiếp);
  // cần xem xa hơn thì tải thêm hoặc nhảy từ màn năm
  const [start, setStart] = useState(curIdx - (PAGE - 1));
  const from = Math.min(start, curIdx);
  const lastIdx = curIdx + 1;
  const months = useMemo(() => {
    const list: number[] = [];
    for (let i = from; i <= lastIdx; i++) list.push(i);
    return list;
  }, [from, lastIdx]);

  const catMap = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);
  const [visible, setVisible] = useState(curIdx);

  // ---- màn năm ----
  const [year, setYear] = useState<number | null>(null);
  const [yearClosing, setYearClosing] = useState(false);
  const closeYear = (animate = true) => {
    if (!animate) return setYear(null);
    setYearClosing(true);
    setTimeout(() => {
      setYear(null);
      setYearClosing(false);
    }, 190);
  };

  // ---- cuộn ----
  /** đang xem tháng hiện tại → khi danh sách tháng thay đổi thì giữ ở tháng hiện tại */
  const followCur = useRef(true);
  const prevHeight = useRef<number | null>(null);
  const pendingJump = useRef<number | null>(null);

  const scrollToIdx = (idx: number) => {
    const el = scroller.current;
    if (!el) return;
    const sec = el.querySelector<HTMLElement>(`[data-i="${idx}"]`);
    if (sec) el.scrollTop = sec.offsetTop;
  };

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (pendingJump.current != null) {
      scrollToIdx(pendingJump.current);
      pendingJump.current = null;
    } else if (prevHeight.current != null) {
      // vừa tải thêm tháng cũ ở trên: giữ nguyên chỗ đang xem
      el.scrollTop += el.scrollHeight - prevHeight.current;
      prevHeight.current = null;
    } else if (followCur.current) {
      scrollToIdx(curIdx); // mở app / sang tháng mới: đầu tháng hiện tại nằm trên cùng
    }
  }, [from, curIdx]);

  const loadEarlier = () => {
    const el = scroller.current;
    if (el) prevHeight.current = el.scrollHeight;
    setStart(Math.max(earliestIdx, from - PAGE));
  };

  const jumpTo = (idx: number) => {
    if (idx < from) {
      pendingJump.current = idx;
      setStart(idx);
    } else scrollToIdx(idx);
  };

  // Vừa xác nhận xong → về hôm nay để thấy vòng màu
  useEffect(() => {
    if (!pulse) return;
    if (year != null) closeYear(false);
    scrollToIdx(curIdx);
  }, [pulse]);

  // Tháng đang xem = tháng chiếm nhiều diện tích nhất trên màn hình
  const raf = useRef(0);
  const onScroll = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = scroller.current;
      if (!el) return;
      const top = el.scrollTop;
      const bottom = top + el.clientHeight - COVER;
      let best = curIdx;
      let bestArea = -1;
      for (const sec of el.querySelectorAll<HTMLElement>('.month')) {
        const a = sec.offsetTop;
        const b = a + sec.offsetHeight;
        if (b <= top) continue;
        if (a >= bottom) break;
        const area = Math.min(b, bottom) - Math.max(a, top);
        if (area > bestArea) {
          bestArea = area;
          best = +sec.dataset.i!;
        }
      }
      followCur.current = best === curIdx;
      setVisible(best);
    });
  };

  const vy = idxYear(visible);
  const vm = idxMonth(visible);
  const stats = useMonthStats(data.days, catMap, monthKey(vy, vm));
  const streak = useMemo(() => calcStreak(data.days, today), [data.days, today]);

  return (
    <div class="cal">
      <div class="cal-top">
        <div class="head-row">
          <button class="year-pill" onClick={() => setYear(Math.min(vy, t.getFullYear()))} aria-label={`Xem cả năm ${vy}`}>
            <IconLeft size={20} />
            {vy}
          </button>
          <SyncBadge state={state} />
        </div>
        <h1 class="cal-title">Tháng {vm + 1}</h1>
        <div class="stat-row">
          <span class="stat">
            <b>{stats.done}</b> buổi tập
          </span>
          {visible === curIdx && (
            <span class="stat">
              Chuỗi <b>{streak}</b> ngày
            </span>
          )}
          {stats.cats.map(([c, n]) => (
            <span key={c.id} class="stat" style={{ '--c': c.color }}>
              <i class="dot" />
              {c.name} <b>{n}</b>
            </span>
          ))}
        </div>
        <div class="week-head">
          {WEEK_HEAD.map((w, i) => (
            <span key={w} class={i >= 5 ? 'wkend' : ''}>
              {w}
            </span>
          ))}
        </div>
      </div>

      <div class="cal-scroll" ref={scroller} onScroll={onScroll}>
        {from > earliestIdx && (
          <div class="more-wrap">
            <button class="more-btn" onClick={loadEarlier}>
              Xem các tháng trước
            </button>
          </div>
        )}
        {months.map((i) => (
          <MonthBlock key={i} idx={i} days={data.days} catMap={catMap} today={today} isCur={i === curIdx} pulse={pulse} onOpenDay={onOpenDay} />
        ))}
      </div>

      {visible !== curIdx && year == null && (
        <button class="float-today" onClick={() => scrollToIdx(curIdx)}>
          Hôm nay
        </button>
      )}

      {year != null && (
        <YearView
          data={data}
          today={today}
          year={year}
          minYear={Math.min(idxYear(earliestIdx), t.getFullYear())}
          closing={yearClosing}
          onYear={setYear}
          onPick={(idx) => {
            jumpTo(idx);
            closeYear();
          }}
          onToday={() => {
            scrollToIdx(curIdx);
            closeYear();
          }}
        />
      )}
    </div>
  );
}

function MonthBlock({
  idx,
  days,
  catMap,
  today,
  isCur,
  pulse,
  onOpenDay,
}: {
  idx: number;
  days: Record<string, DayLog>;
  catMap: Map<string, Category>;
  today: string;
  isCur: boolean;
  pulse: string | null;
  onOpenDay: (d: string) => void;
}) {
  const y = idxYear(idx);
  const m = idxMonth(idx);
  const first = mondayIndex(new Date(y, m, 1));
  const n = daysInMonth(y, m);
  const rows = Math.ceil((first + n) / 7);
  // Tên tháng nằm trên cột của ngày 1, giống app Lịch iPhone
  const titlePos =
    first === 0 ? { left: '8px' } : first === 6 ? { right: '8px' } : { left: `${((first + 0.5) * 100) / 7}%`, transform: 'translateX(-50%)' };

  const cells = [];
  for (let i = 0; i < first; i++) cells.push(<span key={`b${i}`} class="blank" />);
  for (let d = 1; d <= n; d++) {
    const k = toKey(new Date(y, m, d));
    cells.push(
      <DayCell key={k} k={k} d={d} log={days[k]} catMap={catMap} today={today} weekend={(first + d - 1) % 7 >= 5} pop={pulse === k} onOpenDay={onOpenDay} />,
    );
  }
  return (
    // kích thước dự tính chính xác → tháng ngoài màn hình không cần vẽ mà vẫn không bị giật khi cuộn
    <section class="month" data-i={idx} style={{ containIntrinsicSize: `auto ${HEAD_H + rows * ROW_H}px` }}>
      <div class="m-head">
        <h2 class={`m-title${isCur ? ' cur' : ''}`} style={titlePos}>
          Tháng {m + 1}
          {m === 0 && <span class="m-year"> {y}</span>}
        </h2>
      </div>
      <div class="m-grid">{cells}</div>
    </section>
  );
}

function DayCell({
  k,
  d,
  log,
  catMap,
  today,
  weekend,
  pop,
  onOpenDay,
}: {
  k: string;
  d: number;
  log?: DayLog;
  catMap: Map<string, Category>;
  today: string;
  weekend: boolean;
  pop: boolean;
  onOpenDay: (d: string) => void;
}) {
  const future = k > today;
  const isToday = k === today;
  const colors = log?.status === 'done' ? log.cats.map((id) => catMap.get(id)?.color).filter((c): c is string => !!c) : [];
  const done = colors.length > 0;
  const cls = [
    'day',
    weekend && 'wkend',
    isToday && 'today',
    future && 'future',
    done && 'done',
    pop && 'pop',
  ]
    .filter(Boolean)
    .join(' ');
  const label = `Ngày ${d}${done ? ', có tập' : log?.status === 'rest' ? ', nghỉ' : ''}`;
  return (
    <button class={cls} disabled={future} aria-label={label} onClick={() => onOpenDay(k)}>
      <span class="disc" style={done ? { '--seg': ringGradient(colors) } : undefined}>
        <span class="num">{d}</span>
      </span>
      {isToday && <i class="tdot" />}
    </button>
  );
}

function useMonthStats(days: Record<string, DayLog>, catMap: Map<string, Category>, mk: string) {
  return useMemo(() => {
    let done = 0;
    const counts = new Map<string, number>();
    for (const k in days) {
      if (!k.startsWith(mk)) continue;
      const l = days[k];
      if (l.status !== 'done' || !l.cats.length) continue;
      done++;
      for (const c of l.cats) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const cats: [Category, number][] = [];
    for (const [id, n] of counts) {
      const c = catMap.get(id);
      if (c) cats.push([c, n]);
    }
    cats.sort((a, b) => b[1] - a[1]);
    return { done, cats };
  }, [days, catMap, mk]);
}

/** Chuỗi ngày tập liên tiếp, tính tới hôm nay (hoặc hôm qua nếu hôm nay chưa xác nhận). */
function calcStreak(days: Record<string, DayLog>, today: string) {
  const isDone = (k: string) => days[k]?.status === 'done' && days[k].cats.length > 0;
  let k = days[today] ? today : addDays(today, -1);
  let n = 0;
  while (isDone(k)) {
    n++;
    k = addDays(k, -1);
  }
  return n;
}
