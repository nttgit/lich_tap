import { useEffect, useRef, useState } from 'preact/hooks';
import { getState, saveDay, startSync, useAppState } from './lib/store';
import { onToast, toast } from './lib/toast';
import { longDate, todayKey } from './lib/date';
import { TabBar, type Tab } from './components/TabBar';
import { TodayScreen } from './components/TodayScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { ManageScreen } from './components/ManageScreen';
import { DayEditor } from './components/DayEditor';
import { Sheet } from './components/Sheet';

startSync();

export function App() {
  const s = useAppState();
  const [today, setToday] = useState(todayKey);
  const [tab, setTab] = useState<Tab | null>(null);
  const [pulse, setPulse] = useState<string | null>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const todayRef = useRef(today);

  useEffect(() => onToast(setMsg), []);

  // Vào app: chưa xác nhận hôm nay → màn xác nhận; rồi → lịch
  useEffect(() => {
    if (s.ready && tab === null) setTab(s.data.days[today] ? 'cal' : 'today');
  }, [s.ready]);

  // Mở lại app sang ngày mới (app vẫn chạy nền) → cập nhật "hôm nay"
  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      const t = todayKey();
      if (t !== todayRef.current) {
        todayRef.current = t;
        setToday(t);
        if (!getState().data.days[t]) setTab('today');
      }
    };
    document.addEventListener('visibilitychange', check);
    const iv = setInterval(check, 60000);
    return () => {
      document.removeEventListener('visibilitychange', check);
      clearInterval(iv);
    };
  }, []);

  if (!s.ready || tab === null) return <div class="splash" />;

  const { data } = s;

  return (
    <div class="app">
      <div class="status-shield" />
      <Pane on={tab === 'today'}>
        <TodayScreen
          state={s}
          data={data}
          today={today}
          onManage={() => setTab('manage')}
          onSaved={(date, status) => {
            if (date === today) {
              toast(status === 'done' ? 'Đã xác nhận buổi tập' : 'Đã ghi nhận nghỉ');
              setTab('cal');
              setPulse(date);
              setTimeout(() => setPulse(null), 1200);
            } else {
              toast('Đã lưu cho hôm qua');
            }
          }}
        />
      </Pane>
      <Pane on={tab === 'cal'} noScroll>
        <CalendarScreen state={s} data={data} today={today} pulse={pulse} onOpenDay={setOpenDay} />
      </Pane>
      <Pane on={tab === 'manage'}>
        <ManageScreen state={s} />
      </Pane>

      <TabBar tab={tab} onTab={setTab} todayDone={!!data.days[today]} />

      {openDay && (
        <Sheet title={longDate(openDay)} onClose={() => setOpenDay(null)}>
          {(close) => (
            <DayEditor
              inSheet
              log={data.days[openDay]}
              categories={data.categories}
              onManage={() => {
                close();
                setTab('manage');
              }}
              onSave={(st, cats, ex) => {
                saveDay(openDay, st, cats, ex);
                toast('Đã lưu');
                close();
              }}
            />
          )}
        </Sheet>
      )}

      <div class={`toast${msg ? ' show' : ''}`} role="status" aria-live="polite">
        {msg}
      </div>
    </div>
  );
}

function Pane({ on, noScroll, children }: { on: boolean; noScroll?: boolean; children: preact.ComponentChildren }) {
  return (
    <main class={`pane${on ? ' on' : ''}${noScroll ? ' no-scroll' : ''}`} aria-hidden={!on} inert={!on}>
      {children}
    </main>
  );
}
