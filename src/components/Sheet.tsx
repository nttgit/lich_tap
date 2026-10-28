import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { render, type ComponentChildren } from 'preact';

/**
 * Vẽ nội dung thẳng vào <body>, nằm ngoài mọi màn hình con.
 * Trên iOS, vùng cuộn của từng màn tạo "lớp" riêng, nên sheet mở từ trong màn
 * Bài tập bị tab bar đè lên (che mất nút Xoá). Đưa ra <body> thì sheet luôn nằm trên cùng.
 */
function Portal({ children }: { children: ComponentChildren }) {
  const host = useRef<HTMLDivElement | null>(null);
  if (!host.current) host.current = document.createElement('div');
  useLayoutEffect(() => {
    const el = host.current!;
    document.body.appendChild(el);
    return () => {
      render(null, el);
      el.remove();
    };
  }, []);
  useLayoutEffect(() => {
    render(<>{children}</>, host.current!);
  });
  return null;
}

// Khi có sheet đang mở thì ẩn tab bar (giống app iOS gốc). Không phụ thuộc thứ tự lớp
// của Safari, nên nút ở đáy sheet (Lưu, Xoá) không bao giờ bị che.
let openSheets = 0;

type Props = {
  title: string;
  onClose: () => void;
  children: (close: () => void) => ComponentChildren;
};

/** Bottom sheet kiểu iOS: kéo xuống hoặc chạm nền để đóng. */
export function Sheet({ title, onClose, children }: Props) {
  const [closing, setClosing] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    openSheets++;
    document.body.classList.add('sheet-open');
    return () => {
      if (--openSheets === 0) document.body.classList.remove('sheet-open');
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const start = (e: TouchEvent) => {
    drag.current = { y: e.touches[0].clientY, dy: 0 };
    if (sheet.current) sheet.current.style.transition = 'none';
  };
  const move = (e: TouchEvent) => {
    if (!drag.current || !sheet.current) return;
    const dy = Math.max(0, e.touches[0].clientY - drag.current.y);
    drag.current.dy = dy;
    sheet.current.style.transform = `translateY(${dy}px)`;
  };
  const end = () => {
    if (!drag.current || !sheet.current) return;
    const { dy } = drag.current;
    drag.current = null;
    sheet.current.style.transition = '';
    if (dy > 90) close();
    else sheet.current.style.transform = '';
  };

  return (
    <Portal>
      <div class={`sheet-wrap${closing ? ' closing' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div class="backdrop" onClick={close} />
        <div class="sheet" ref={sheet}>
          <div class="sheet-head" onTouchStart={start} onTouchMove={move} onTouchEnd={end}>
            <div class="grabber" />
            <div class="sheet-title">{title}</div>
            <button class="link-btn" onClick={close}>Đóng</button>
          </div>
          <div class="sheet-body">{children(close)}</div>
        </div>
      </div>
    </Portal>
  );
}
