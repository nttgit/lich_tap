export type Exercise = { id: string; name: string; deleted?: boolean };

export type Category = {
  id: string;
  name: string;
  color: string;
  exercises: Exercise[];
  /** Xoá mềm: ẩn khỏi danh sách nhưng lịch cũ vẫn giữ màu */
  deleted?: boolean;
};

export type DayStatus = 'done' | 'rest';

export type DayLog = {
  status: DayStatus;
  /** id danh mục đã tập */
  cats: string[];
  /** id bài tập đã tập */
  ex: string[];
  /** thời điểm sửa (ms) – dùng cho last-write-wins */
  t: number;
};

export type Data = {
  categories: Category[];
  catT: number;
  days: Record<string, DayLog>;
};

export type Op =
  | { id: string; k: 'day'; date: string; log: DayLog }
  | { id: string; k: 'cats'; cats: Category[]; t: number };
