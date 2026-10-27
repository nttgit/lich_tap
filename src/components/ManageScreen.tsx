import { useRef, useState } from 'preact/hooks';
import type { Category } from '../types';
import { addExercise, addTemplate, deleteExercise, moveCategory, renameExercise } from '../lib/store';
import type { State } from '../lib/store';
import { CategorySheet } from './CategorySheet';
import { SyncBadge } from './SyncBadge';
import { IconChevron, IconDown, IconMinus, IconMore, IconPlus, IconUp } from './Icons';

export function ManageScreen({ state }: { state: State }) {
  const cats = state.data.categories.filter((c) => !c.deleted);
  const [open, setOpen] = useState<string | null>(cats[0]?.id ?? null);
  const [sheet, setSheet] = useState<{ cat?: Category } | null>(null);

  return (
    <div class="screen">
      <header class="large-head">
        <div class="head-row">
          <p class="head-sub">Danh mục và bài tập</p>
          <SyncBadge state={state} />
        </div>
        <div class="title-row">
          <h1>Bài tập</h1>
          {cats.length > 0 && (
            <button class="round-add" aria-label="Thêm danh mục" onClick={() => setSheet({})}>
              <IconPlus />
            </button>
          )}
        </div>
      </header>

      {cats.length === 0 ? (
        <div class="empty">
          <p class="empty-title">Bắt đầu bằng một danh mục</p>
          <p class="empty-text">Mỗi danh mục có một màu riêng, ngày nào tập danh mục nào thì lịch tô màu đó.</p>
          <div class="empty-actions">
            <button class="btn primary" onClick={() => setSheet({})}>
              Tạo danh mục
            </button>
            <button class="btn tinted" onClick={addTemplate}>
              Dùng mẫu có sẵn
            </button>
          </div>
        </div>
      ) : (
        <div class="cat-list">
          {cats.map((c, i) => (
            <CatBlock
              key={c.id}
              cat={c}
              open={open === c.id}
              first={i === 0}
              last={i === cats.length - 1}
              onToggle={() => setOpen(open === c.id ? null : c.id)}
              onEdit={() => setSheet({ cat: c })}
            />
          ))}
        </div>
      )}

      {sheet && (
        <CategorySheet
          cat={sheet.cat}
          taken={cats.filter((c) => c.id !== sheet.cat?.id).map((c) => c.color)}
          onClose={() => setSheet(null)}
          onCreated={(id) => setOpen(id)}
        />
      )}
    </div>
  );
}

function CatBlock({
  cat,
  open,
  first,
  last,
  onToggle,
  onEdit,
}: {
  cat: Category;
  open: boolean;
  first: boolean;
  last: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const list = cat.exercises.filter((e) => !e.deleted);
  const [text, setText] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const add = (e: Event) => {
    e.preventDefault();
    const n = text.trim();
    if (!n) return;
    addExercise(cat.id, n);
    setText('');
    input.current?.focus(); // giữ bàn phím để thêm liên tục
  };

  return (
    <div class={`cblock${open ? ' open' : ''}`} style={{ '--c': cat.color }}>
      <div class="cb-head">
        <button class="cb-toggle" aria-expanded={open} onClick={onToggle}>
          <span class="cb-swatch" />
          <span class="cb-title">
            {cat.name}
            <small>{list.length ? `${list.length} bài tập` : 'Chưa có bài tập'}</small>
          </span>
          <span class="cb-chev">
            <IconChevron />
          </span>
        </button>
        <button class="icon-btn" aria-label={`Sửa ${cat.name}`} onClick={onEdit}>
          <IconMore />
        </button>
      </div>

      {open && (
        <div class="cb-body">
          {list.map((e) => (
            <ExRow key={e.id} name={e.name} onRename={(n) => renameExercise(cat.id, e.id, n)} onDelete={() => deleteExercise(cat.id, e.id)} />
          ))}
          <form class="ex-add" onSubmit={add}>
            <input
              ref={input}
              value={text}
              onInput={(e) => setText((e.target as HTMLInputElement).value)}
              placeholder="Thêm bài tập…"
              maxLength={40}
              enterKeyHint="enter"
            />
            <button class="btn small primary" type="submit" disabled={!text.trim()}>
              Thêm
            </button>
          </form>
          <div class="cb-order">
            <button class="icon-btn" disabled={first} aria-label="Chuyển lên" onClick={() => moveCategory(cat.id, -1)}>
              <IconUp />
            </button>
            <button class="icon-btn" disabled={last} aria-label="Chuyển xuống" onClick={() => moveCategory(cat.id, 1)}>
              <IconDown />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExRow({ name, onRename, onDelete }: { name: string; onRename: (n: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(name);

  const commit = () => {
    const n = val.trim();
    if (n && n !== name) onRename(n);
    else setVal(name);
    setEditing(false);
  };

  return (
    <div class="ex-row">
      {editing ? (
        <input
          class="ex-edit"
          value={val}
          autoFocus
          maxLength={40}
          onInput={(e) => setVal((e.target as HTMLInputElement).value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      ) : (
        <button class="ex-name" onClick={() => setEditing(true)}>
          {name}
        </button>
      )}
      <button
        class="del-btn"
        aria-label={`Xoá ${name}`}
        onClick={() => {
          if (confirm(`Xoá bài “${name}”?`)) onDelete();
        }}
      >
        <IconMinus />
      </button>
    </div>
  );
}
