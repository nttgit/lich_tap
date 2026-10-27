import { useMemo, useState } from 'preact/hooks';
import type { Category, DayLog, DayStatus } from '../types';
import { rgba } from '../lib/colors';
import { addTemplate } from '../lib/store';
import { IconCheck } from './Icons';

type Props = {
  log?: DayLog;
  categories: Category[];
  onSave: (status: DayStatus, cats: string[], ex: string[]) => void;
  onManage: () => void;
  /** trong sheet thì nút dính đáy sheet, ngoài màn hình chính thì dính trên tab bar */
  inSheet?: boolean;
  heading?: string;
};

export function DayEditor({ log, categories, onSave, onManage, inSheet, heading = 'Chọn những gì đã tập' }: Props) {
  const [cats, setCats] = useState<string[]>(log?.status === 'done' ? log.cats : []);
  const [ex, setEx] = useState<string[]>(log?.status === 'done' ? log.ex : []);

  // danh mục đã xoá vẫn hiện nếu ngày này từng chọn nó
  const visible = useMemo(() => categories.filter((c) => !c.deleted || cats.includes(c.id)), [categories]);
  const selected = visible.filter((c) => cats.includes(c.id));

  const toggleCat = (c: Category) => {
    if (cats.includes(c.id)) {
      setCats(cats.filter((x) => x !== c.id));
      const ids = new Set(c.exercises.map((e) => e.id));
      setEx(ex.filter((x) => !ids.has(x)));
    } else {
      setCats([...cats, c.id]);
    }
  };
  const toggleEx = (id: string) => setEx(ex.includes(id) ? ex.filter((x) => x !== id) : [...ex, id]);

  const save = (status: DayStatus) => {
    // lưu theo thứ tự danh mục để vòng màu trên lịch luôn ổn định
    const orderedCats = visible.filter((c) => cats.includes(c.id)).map((c) => c.id);
    onSave(status, orderedCats, ex);
  };

  const isRest = log?.status === 'rest';
  const noCats = visible.length === 0;

  return (
    <div class="editor">
      {noCats ? (
        <div class="empty">
          <p class="empty-title">Chưa có danh mục nào</p>
          <p class="empty-text">Tạo danh mục (Cardio, Thân trên…) để đánh dấu buổi tập theo màu.</p>
          <div class="empty-actions">
            <button class="btn primary" onClick={onManage}>Tạo danh mục</button>
            <button class="btn tinted" onClick={addTemplate}>Dùng mẫu có sẵn</button>
          </div>
        </div>
      ) : (
        <>
          <h2 class="sec-title">{heading}</h2>
          <div class="cat-grid">
            {visible.map((c) => {
              const on = cats.includes(c.id);
              const n = c.exercises.filter((e) => !e.deleted).length;
              return (
                <button
                  key={c.id}
                  class={`cat-card${on ? ' on' : ''}`}
                  style={{ '--c': c.color, '--c-soft': rgba(c.color, 0.18) }}
                  aria-pressed={on}
                  onClick={() => toggleCat(c)}
                >
                  <span class="cat-mark">{on && <IconCheck size={14} />}</span>
                  <span class="cat-name">{c.name}</span>
                  <span class="cat-count">{n ? `${n} bài` : 'Chưa có bài'}</span>
                </button>
              );
            })}
          </div>

          {selected.map((c) => {
            const list = c.exercises.filter((e) => !e.deleted || ex.includes(e.id));
            return (
              <section key={c.id} class="ex-sec" style={{ '--c': c.color, '--c-soft': rgba(c.color, 0.2) }}>
                <h3 class="ex-head">
                  <i class="dot" />
                  {c.name}
                </h3>
                {list.length ? (
                  <div class="chips">
                    {list.map((e) => {
                      const on = ex.includes(e.id);
                      return (
                        <button key={e.id} class={`chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggleEx(e.id)}>
                          {on && <IconCheck size={14} />}
                          {e.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p class="hint">
                    Chưa có bài tập. <button class="link-btn" onClick={onManage}>Thêm bài tập</button>
                  </p>
                )}
              </section>
            );
          })}
        </>
      )}

      <div class={`actions${inSheet ? ' in-sheet' : ''}`}>
        <button class={`btn ghost${isRest && !cats.length ? ' current' : ''}`} onClick={() => save('rest')}>
          Không tập
        </button>
        <button class="btn primary" disabled={!cats.length} onClick={() => save('done')}>
          <IconCheck size={18} />
          Xác nhận đã tập
        </button>
      </div>
    </div>
  );
}
