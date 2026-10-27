import { useEffect, useState } from 'preact/hooks';
import type { Data, DayStatus } from '../types';
import { addDays, longDate } from '../lib/date';
import { saveDay } from '../lib/store';
import { DayEditor } from './DayEditor';
import { SyncBadge } from './SyncBadge';
import type { State } from '../lib/store';

type Props = {
  state: State;
  data: Data;
  today: string;
  onSaved: (date: string, status: DayStatus) => void;
  onManage: () => void;
};

export function TodayScreen({ state, data, today, onSaved, onManage }: Props) {
  const yesterday = addDays(today, -1);
  const [date, setDate] = useState(today);
  useEffect(() => setDate(today), [today]);

  // Tập khuya, quá 0h mới mở app: cho chọn nhanh "Hôm qua" nếu hôm qua chưa xác nhận
  const canPickYesterday = !data.days[yesterday] || date === yesterday;
  const log = data.days[date];
  const isToday = date === today;

  const status = log ? (log.status === 'done' ? 'Đã xác nhận: có tập' : 'Đã xác nhận: không tập') : null;

  return (
    <div class="screen">
      <header class="large-head">
        <div class="head-row">
          <p class="head-sub">{longDate(date)}</p>
          <SyncBadge state={state} />
        </div>
        <h1>{isToday ? 'Hôm nay' : 'Hôm qua'}</h1>
        {status && <p class={`status-line ${log!.status}`}>{status}. Sửa lại bên dưới nếu cần.</p>}
      </header>

      {canPickYesterday && (
        <div class="seg" role="tablist">
          <button role="tab" aria-selected={isToday} class={isToday ? 'on' : ''} onClick={() => setDate(today)}>
            Hôm nay
          </button>
          <button role="tab" aria-selected={!isToday} class={!isToday ? 'on' : ''} onClick={() => setDate(yesterday)}>
            Hôm qua{!data.days[yesterday] && <i class="seg-dot" />}
          </button>
        </div>
      )}

      <DayEditor
        key={date + (log?.t ?? 0)}
        log={log}
        categories={data.categories}
        onManage={onManage}
        onSave={(s, cats, ex) => {
          saveDay(date, s, cats, ex);
          if (!isToday) setDate(today);
          onSaved(date, s);
        }}
      />
    </div>
  );
}
