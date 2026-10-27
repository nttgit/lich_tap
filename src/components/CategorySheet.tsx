import { useState } from 'preact/hooks';
import type { Category } from '../types';
import { PALETTE, ringGradient } from '../lib/colors';
import { uid } from '../lib/id';
import { deleteCategory, upsertCategory } from '../lib/store';
import { toast } from '../lib/toast';
import { Sheet } from './Sheet';

/** taken = màu các danh mục khác đang dùng → không cho chọn trùng */
type Props = { cat?: Category; taken: string[]; onClose: () => void; onCreated?: (id: string) => void };

export function CategorySheet({ cat, taken, onClose, onCreated }: Props) {
  const [name, setName] = useState(cat?.name ?? '');
  // tạo mới: tự chọn sẵn màu đầu tiên chưa ai dùng
  const [color, setColor] = useState<string | null>(cat?.color ?? PALETTE.find((c) => !taken.includes(c)) ?? null);
  const isNew = !cat;
  const noColorLeft = color == null;

  return (
    <Sheet title={isNew ? 'Danh mục mới' : 'Sửa danh mục'} onClose={onClose}>
      {(close) => {
        const save = (e?: Event) => {
          e?.preventDefault();
          const n = name.trim();
          if (!n || !color) return;
          if (cat) upsertCategory({ ...cat, name: n, color });
          else {
            const id = uid();
            upsertCategory({ id, name: n, color, exercises: [] });
            onCreated?.(id);
          }
          toast(isNew ? 'Đã tạo danh mục' : 'Đã lưu danh mục');
          close();
        };
        return (
          <form class="form" onSubmit={save}>
            <div class="preview">
              <span class="disc big" style={color ? { '--seg': ringGradient([color]) } : undefined}>
                <span class="num">27</span>
              </span>
              <span class="preview-name">{name.trim() || 'Tên danh mục'}</span>
            </div>

            <label class="field">
              <span>Tên</span>
              <input
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
                placeholder="VD: Cardio, Thân trên, Bơi…"
                maxLength={30}
                enterKeyHint="done"
                autoFocus={isNew}
              />
            </label>

            <div class="field">
              <span>Màu</span>
              <div class="swatches">
                {PALETTE.map((c) => {
                  const isTaken = taken.includes(c);
                  return (
                    <button
                      type="button"
                      key={c}
                      class={`swatch${c === color ? ' on' : ''}${isTaken ? ' taken' : ''}`}
                      style={{ '--c': c }}
                      disabled={isTaken}
                      aria-label={isTaken ? 'Màu đã có danh mục dùng' : 'Chọn màu này'}
                      aria-pressed={c === color}
                      onClick={() => setColor(c)}
                    />
                  );
                })}
              </div>
              {noColorLeft ? (
                <p class="field-note warn">Đã dùng hết {PALETTE.length} màu. Xoá bớt một danh mục để có màu trống.</p>
              ) : (
                taken.length > 0 && <p class="field-note">Màu bị gạch là màu đã có danh mục dùng.</p>
              )}
            </div>

            <button class="btn primary block" type="submit" disabled={!name.trim() || noColorLeft}>
              {isNew ? 'Tạo danh mục' : 'Lưu'}
            </button>
            {cat && (
              <button
                type="button"
                class="btn danger block"
                onClick={() => {
                  if (confirm(`Xoá danh mục “${cat.name}”? Những ngày đã tập vẫn giữ màu trên lịch.`)) {
                    deleteCategory(cat.id);
                    toast('Đã xoá danh mục');
                    close();
                  }
                }}
              >
                Xoá danh mục
              </button>
            )}
          </form>
        );
      }}
    </Sheet>
  );
}
