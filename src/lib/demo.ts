// Dữ liệu mẫu cho bản demo (chỉ dùng khi build --mode demo).
import type { Category, Data, DayLog } from '../types';
import { addDays, todayKey } from './date';

export function makeDemoData(): Data {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const mk = (id: string, name: string, color: string, ex: string[]): Category => ({
    id, name, color, exercises: ex.map((n, i) => ({ id: `${id}${i}`, name: n })),
  });
  const categories = [
    mk('c', 'Cardio', '#FF453A', ['Chạy bộ', 'Đạp xe', 'Nhảy dây', 'Bơi']),
    mk('u', 'Thân trên', '#0A84FF', ['Hít đất', 'Kéo xà', 'Đẩy ngực', 'Đẩy vai', 'Tay trước', 'Tay sau']),
    mk('l', 'Thân dưới', '#30D158', ['Squat', 'Lunge', 'Deadlift', 'Bắp chân']),
    mk('a', 'Bụng', '#FF9F0A', ['Plank', 'Gập bụng', 'Leo núi', 'Nâng chân']),
    mk('y', 'Giãn cơ', '#BF5AF2', ['Yoga', 'Giãn cơ', 'Lăn foam']),
  ];

  const days: Record<string, DayLog> = {};
  const today = todayKey();
  for (let i = 1; i <= 440; i++) {
    const k = addDays(today, -i);
    const r = rnd();
    if (r < 0.22) continue; // không xác nhận
    if (r < 0.32) {
      days[k] = { status: 'rest', cats: [], ex: [], t: 1 };
      continue;
    }
    const n = rnd() < 0.55 ? 1 : rnd() < 0.8 ? 2 : 3;
    const picked = [...categories].sort(() => rnd() - 0.5).slice(0, n);
    const order = categories.filter((c) => picked.includes(c));
    days[k] = {
      status: 'done',
      cats: order.map((c) => c.id),
      ex: order.flatMap((c) => c.exercises.filter(() => rnd() < 0.45).map((e) => e.id)),
      t: 1,
    };
  }
  // vài ngày gần nhất cho đẹp chuỗi
  days[addDays(today, -1)] = { status: 'done', cats: ['u', 'a'], ex: ['u0', 'u1', 'a0'], t: 1 };
  days[addDays(today, -2)] = { status: 'done', cats: ['c'], ex: ['c0'], t: 1 };
  days[addDays(today, -3)] = { status: 'done', cats: ['l', 'y'], ex: ['l0', 'l2', 'y1'], t: 1 };
  return { categories, catT: 1, days };
}
