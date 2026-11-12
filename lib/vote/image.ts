/** ย่อรูปชุดในเบราว์เซอร์ก่อนเก็บ: ด้านยาว 480px, JPEG q0.8 (SPEC §2) → ~50–100KB */
export async function resizeToDataUrl(file: File, maxSide = 480, quality = 0.8): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('ไฟล์นี้ไม่ใช่รูปภาพ');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('เปิดรูปไม่ได้ (ลองใช้ JPG/PNG)'));
      i.src = url;
    });
    const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
