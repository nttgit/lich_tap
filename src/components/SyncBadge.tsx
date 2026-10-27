import type { State } from '../lib/store';
import { setKey } from '../lib/store';

/** Chấm trạng thái đồng bộ. Chỉ hiện chữ khi có việc cần m chú ý. */
export function SyncBadge({ state }: { state: State }) {
  if (__DEMO__) return <span class="sync-pill">Bản demo</span>;
  const { sync, pending } = state;
  if (sync === 'auth') {
    return (
      <button
        class="sync-pill warn"
        onClick={() => {
          const k = prompt('Nhập mã truy cập (APP_KEY)');
          if (k) setKey(k);
        }}
      >
        Cần mã truy cập
      </button>
    );
  }
  if (sync === 'nodb') return <span class="sync-pill warn">Chưa kết nối DB</span>;
  if ((sync === 'offline' || sync === 'error') && pending) return <span class="sync-pill">Chưa đồng bộ {pending}</span>;
  const cls = sync === 'synced' ? 'ok' : sync === 'syncing' ? 'busy' : 'idle';
  return <i class={`sync-dot ${cls}`} title={sync} />;
}
