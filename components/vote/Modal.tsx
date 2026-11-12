'use client';
import { useEffect } from 'react';

/** Modal แบบ controlled ใช้ class ของ Bootstrap (ไม่พึ่ง bootstrap.js) */
export default function Modal({ open, onClose, title, children, footer, size }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; size?: 'sm' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
        <div className={`modal-dialog modal-dialog-centered ${size ? 'modal-' + size : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="modal-content card-pop">
            <div className="modal-header border-0 pb-0">
              <h2 className="modal-title h4">{title}</h2>
              <button type="button" className="btn-close" aria-label="ปิด" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer border-0 pt-0">{footer}</div>}
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
