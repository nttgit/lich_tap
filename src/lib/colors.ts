// Bảng màu hệ thống iOS (bản dark). Không có xám: xám dành cho ngày không tập.
export const PALETTE = [
  '#FF453A', // đỏ
  '#FF9F0A', // cam
  '#FFD60A', // vàng
  '#A4D94B', // xanh nõn
  '#30D158', // xanh lá
  '#63E6E2', // bạc hà
  '#64D2FF', // xanh trời
  '#0A84FF', // xanh dương
  '#5E5CE6', // chàm
  '#BF5AF2', // tím
  '#FF375F', // hồng
  '#C69C6D', // nâu
];

export function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Vòng tròn chia phần: mỗi danh mục một cung, có khe hở nhỏ giữa các cung. */
export function ringGradient(colors: string[], gap = 16 /* độ */) {
  if (colors.length === 0) return undefined;
  if (colors.length === 1) return colors[0];
  const seg = 360 / colors.length;
  const parts: string[] = [];
  colors.forEach((c, i) => {
    const a = i * seg;
    const b = a + seg;
    parts.push(`transparent ${a}deg ${a + gap / 2}deg`, `${c} ${a + gap / 2}deg ${b - gap / 2}deg`, `transparent ${b - gap / 2}deg ${b}deg`);
  });
  return `conic-gradient(${parts.join(',')})`;
}

/** Nền mờ bên trong vòng tròn: chia phần giống vòng, không có khe. */
export function fillGradient(colors: string[], a = 0.16) {
  if (colors.length === 0) return undefined;
  if (colors.length === 1) return rgba(colors[0], a);
  const seg = 360 / colors.length;
  return `conic-gradient(${colors.map((c, i) => `${rgba(c, a)} ${i * seg}deg ${(i + 1) * seg}deg`).join(',')})`;
}
