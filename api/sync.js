// Vercel Function: POST /api/sync
// Body: { ops: Op[] }  →  áp dụng các thay đổi rồi trả về toàn bộ dữ liệu.
// Gửi ops rỗng = chỉ đọc. Một request duy nhất cho cả ghi lẫn đọc → ít round-trip.
//
// Dữ liệu trong Redis (Upstash, tạo từ Vercel Marketplace):
//   <prefix>:cats  → { categories: Category[], t: number }
//   <prefix>:days  → hash, field = "YYYY-MM-DD", value = { status, cats, ex, t }
import { Redis } from '@upstash/redis';

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const PREFIX = process.env.KEY_PREFIX || 'lichtap';
const K_CATS = `${PREFIX}:cats`;
const K_DAYS = `${PREFIX}:days`;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isStrArr = (a) => Array.isArray(a) && a.length <= 200 && a.every((x) => typeof x === 'string' && x.length <= 64);

function validLog(l) {
  return (
    l && typeof l === 'object' &&
    (l.status === 'done' || l.status === 'rest') &&
    isStrArr(l.cats) && isStrArr(l.ex) &&
    typeof l.t === 'number'
  );
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!redis) {
    return res.status(500).json({ error: 'missing_db', message: 'Chưa kết nối Redis: thiếu KV_REST_API_URL / KV_REST_API_TOKEN' });
  }
  const appKey = process.env.APP_KEY;
  if (appKey && req.headers['x-app-key'] !== appKey) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const [catsRaw, daysRaw] = await Promise.all([redis.get(K_CATS), redis.hgetall(K_DAYS)]);
    let cats = catsRaw && typeof catsRaw === 'object' ? catsRaw : { categories: [], t: 0 };
    const days = daysRaw || {};

    const body = typeof req.body === 'string' ? safeJson(req.body) : req.body;
    const ops = Array.isArray(body?.ops) ? body.ops.slice(0, 500) : [];

    const dayWrites = {};
    let catsChanged = false;

    for (const op of ops) {
      if (op?.k === 'day' && DATE_RE.test(op.date) && validLog(op.log)) {
        const cur = days[op.date];
        // last-write-wins theo thời điểm sửa trên máy
        if (!cur || (cur.t || 0) <= op.log.t) {
          days[op.date] = op.log;
          dayWrites[op.date] = op.log;
        }
      } else if (op?.k === 'cats' && Array.isArray(op.cats) && typeof op.t === 'number') {
        if ((cats.t || 0) <= op.t) {
          cats = { categories: op.cats, t: op.t };
          catsChanged = true;
        }
      }
    }

    const writes = [];
    if (Object.keys(dayWrites).length) writes.push(redis.hset(K_DAYS, dayWrites));
    if (catsChanged) writes.push(redis.set(K_CATS, cats));
    await Promise.all(writes);

    return res.status(200).json({ categories: cats.categories || [], catT: cats.t || 0, days });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return null; }
}
