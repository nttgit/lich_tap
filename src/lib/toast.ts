type L = (msg: string | null) => void;
let listener: L | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

export function toast(msg: string) {
  clearTimeout(timer);
  listener?.(msg);
  timer = setTimeout(() => listener?.(null), 1800);
}
export const onToast = (l: L) => {
  listener = l;
};
