/**
 * Store "local-first":
 *  1. Mở app → đọc localStorage → vẽ ngay, không chờ mạng.
 *  2. Mọi thao tác ghi vào state + localStorage tức thì (optimistic),
 *     đồng thời xếp vào hàng đợi `outbox`.
 *  3. Hàng đợi được đẩy lên /api/sync trong nền (gộp nhiều thay đổi, tự thử lại
 *     khi có mạng). Server trả về dữ liệu mới nhất trong cùng request đó.
 */
import { useEffect, useReducer } from 'preact/hooks';
import type { Category, Data, DayLog, DayStatus, Op } from '../types';
import { uid } from './id';
import { makeDemoData } from './demo';
import { PALETTE } from './colors';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error' | 'auth' | 'nodb';

export type State = {
  data: Data;
  /** đã có dữ liệu để vẽ (từ máy hoặc từ server) */
  ready: boolean;
  sync: SyncStatus;
  pending: number;
};

const LS_DATA = __DEMO__ ? 'lichtap:demo-v2' : 'lichtap:data';
const LS_OUT = 'lichtap:outbox';
const LS_KEY = 'lichtap:key';

const EMPTY: Data = { categories: [], catT: 0, days: {} };

function read<T>(k: string): T | null {
  try {
    const s = localStorage.getItem(k);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}
function write(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* hết dung lượng / chế độ riêng tư: bỏ qua */
  }
}

// ---------- state ----------
const saved = read<Data>(LS_DATA) ?? (__DEMO__ ? makeDemoData() : null);
let outbox: Op[] = read<Op[]>(LS_OUT) ?? [];

let state: State = {
  data: saved ?? EMPTY,
  ready: !!saved,
  sync: 'idle',
  pending: outbox.length,
};

const listeners = new Set<() => void>();
function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
export const getState = () => state;

export function useAppState() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    listeners.add(force as () => void);
    return () => {
      listeners.delete(force as () => void);
    };
  }, []);
  return state;
}

// ---------- apply ----------
function applyOp(d: Data, op: Op): Data {
  if (op.k === 'day') return { ...d, days: { ...d.days, [op.date]: op.log } };
  return { ...d, categories: op.cats, catT: op.t };
}

function commit(op: Op) {
  // gộp: thay đổi mới cho cùng 1 ngày / danh mục thay thế thay đổi cũ chưa gửi
  outbox = outbox.filter((o) => (op.k === 'cats' ? o.k !== 'cats' : !(o.k === 'day' && o.date === op.date)));
  outbox.push(op);
  const data = applyOp(state.data, op);
  write(LS_DATA, data);
  write(LS_OUT, outbox);
  set({ data, pending: outbox.length });
  scheduleSync(250);
}

// ---------- actions ----------
export function saveDay(date: string, status: DayStatus, cats: string[], ex: string[]) {
  const log: DayLog = { status, cats: status === 'done' ? cats : [], ex: status === 'done' ? ex : [], t: Date.now() };
  commit({ id: uid(), k: 'day', date, log });
}

export function saveCategories(cats: Category[]) {
  commit({ id: uid(), k: 'cats', cats, t: Date.now() });
}

const mapCats = (fn: (c: Category) => Category) => saveCategories(state.data.categories.map(fn));

export function upsertCategory(c: Category) {
  const exists = state.data.categories.some((x) => x.id === c.id);
  saveCategories(exists ? state.data.categories.map((x) => (x.id === c.id ? c : x)) : [...state.data.categories, c]);
}
export const deleteCategory = (id: string) => mapCats((c) => (c.id === id ? { ...c, deleted: true } : c));

export function moveCategory(id: string, dir: -1 | 1) {
  const list = [...state.data.categories];
  const visible = list.filter((c) => !c.deleted);
  const i = visible.findIndex((c) => c.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= visible.length) return;
  const a = list.indexOf(visible[i]);
  const b = list.indexOf(visible[j]);
  [list[a], list[b]] = [list[b], list[a]];
  saveCategories(list);
}

export const addExercise = (catId: string, name: string) =>
  mapCats((c) => (c.id === catId ? { ...c, exercises: [...c.exercises, { id: uid(), name }] } : c));

export const renameExercise = (catId: string, exId: string, name: string) =>
  mapCats((c) => (c.id === catId ? { ...c, exercises: c.exercises.map((e) => (e.id === exId ? { ...e, name } : e)) } : c));

export const deleteExercise = (catId: string, exId: string) =>
  mapCats((c) => (c.id === catId ? { ...c, exercises: c.exercises.map((e) => (e.id === exId ? { ...e, deleted: true } : e)) } : c));

export function addTemplate() {
  const T: [string, string, string[]][] = [
    ['Cardio', '#FF453A', ['Chạy bộ', 'Đạp xe', 'Nhảy dây', 'Bơi']],
    ['Thân trên', '#0A84FF', ['Hít đất', 'Kéo xà', 'Đẩy ngực', 'Đẩy vai', 'Tay trước', 'Tay sau']],
    ['Thân dưới', '#30D158', ['Squat', 'Lunge', 'Deadlift', 'Bắp chân']],
    ['Bụng', '#FF9F0A', ['Plank', 'Gập bụng', 'Leo núi', 'Nâng chân']],
    ['Giãn cơ', '#BF5AF2', ['Yoga', 'Giãn cơ', 'Lăn foam']],
  ];
  const taken = new Set(state.data.categories.filter((c) => !c.deleted).map((c) => c.color));
  const pick = (want: string) => {
    const c = taken.has(want) ? PALETTE.find((p) => !taken.has(p)) : want;
    if (c) taken.add(c);
    return c;
  };
  const added: Category[] = [];
  for (const [name, want, ex] of T) {
    const color = pick(want);
    if (!color) break; // hết màu
    added.push({ id: uid(), name, color, exercises: ex.map((n) => ({ id: uid(), name: n })) });
  }
  saveCategories([...state.data.categories, ...added]);
}

// ---------- sync ----------
class HttpError extends Error {
  constructor(public status: number, public code?: string) {
    super(`HTTP ${status}`);
  }
}

function getKey() {
  try {
    return localStorage.getItem(LS_KEY) || '';
  } catch {
    return '';
  }
}
export function setKey(k: string) {
  try {
    localStorage.setItem(LS_KEY, k.trim());
  } catch {
    /* ignore */
  }
  sync();
}

async function call(ops: Op[]): Promise<Data> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const key = getKey();
  if (key) headers['x-app-key'] = key;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ops: ops.map(({ id: _id, ...rest }) => rest) }),
      cache: 'no-store',
      signal: ctrl.signal,
    });
    if (!res.ok) {
      let code: string | undefined;
      try {
        code = (await res.json()).error;
      } catch {
        /* not json */
      }
      throw new HttpError(res.status, code);
    }
    const j = await res.json();
    return { categories: j.categories ?? [], catT: j.catT ?? 0, days: j.days ?? {} };
  } finally {
    clearTimeout(timer);
  }
}

let inflight: Promise<void> | null = null;
let again = false;
let syncTimer: ReturnType<typeof setTimeout> | undefined;
let retryDelay = 5000;

function scheduleSync(ms: number) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(sync, ms);
}

export function sync(): Promise<void> {
  if (__DEMO__) {
    set({ ready: true });
    return Promise.resolve();
  }
  if (inflight) {
    again = true;
    return inflight;
  }
  inflight = (async () => {
    do {
      again = false;
      const batch = outbox.slice();
      if (batch.length) set({ sync: 'syncing' });
      try {
        const server = await call(batch);
        const sent = new Set(batch.map((o) => o.id));
        outbox = outbox.filter((o) => !sent.has(o.id));
        let data = server;
        for (const op of outbox) data = applyOp(data, op); // thay đổi mới phát sinh trong lúc gửi
        write(LS_DATA, data);
        write(LS_OUT, outbox);
        retryDelay = 5000;
        set({ data, ready: true, sync: outbox.length ? 'syncing' : 'synced', pending: outbox.length });
        if (outbox.length) again = true;
      } catch (e) {
        let s: SyncStatus = navigator.onLine ? 'error' : 'offline';
        if (e instanceof HttpError && e.status === 401) s = 'auth';
        else if (e instanceof HttpError && e.code === 'missing_db') s = 'nodb';
        set({ ready: true, sync: s });
        if (outbox.length && s !== 'auth') {
          scheduleSync(retryDelay);
          retryDelay = Math.min(retryDelay * 2, 60000);
        }
        again = false;
      }
    } while (again);
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

// ---------- khởi động ----------
let lastPull = 0;
export function startSync() {
  // ?key=xxx trên URL → lưu lại rồi xoá khỏi thanh địa chỉ
  try {
    const u = new URL(location.href);
    const k = u.searchParams.get('key');
    if (k) {
      localStorage.setItem(LS_KEY, k);
      u.searchParams.delete('key');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
  } catch {
    /* ignore */
  }

  // Máy mới chưa có dữ liệu: chờ server tối đa 2.5s rồi vẫn cho vào app
  if (!state.ready) setTimeout(() => set({ ready: true }), 2500);

  lastPull = Date.now();
  sync();
  addEventListener('online', () => sync());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastPull > 20000) {
      lastPull = Date.now();
      sync();
    }
  });
}
