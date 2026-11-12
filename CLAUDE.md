# Outing Challenge — คู่มือสำหรับ Claude Code

เว็บรวม 2 โมดูลสำหรับงานเอาท์ติ้ง: **Lucky Zone** (วงล้อคู่ + ตู้กาชาปอง) และ **Fashion Vote** (โหวตประกวดชุด)
ภาษาหน้าเว็บ: ไทย · ผู้ใช้สื่อสารภาษาไทย

อ่านตามลำดับก่อนเริ่มงาน:
1. `docs/PRODUCT.md` — decisions, open questions, roadmap, backlog (**ยึดไฟล์นี้ถ้าขัดกับ handoff**)
2. `docs/DESIGN.md` — ธีม Spicy Snack Pack, tokens, components
3. `docs/handoff/*/SPEC.md` — สเปกละเอียดของแต่ละเกม (รวม "สิ่งที่ผู้ใช้ปฏิเสธแล้ว ห้ามใส่กลับ")
4. `public/prototypes/*.html` — ต้นแบบที่ผู้ใช้อนุมัติแล้ว (หน้าตา/flow/ตรรกะ)

## Stack
Next.js 16 (App Router, TS) · Bootstrap 5.3 + SCSS (`styles/_tokens.scss` → `styles/globals.scss`) · Bootstrap Icons · `next/font` (Kanit/Anuphan/Press Start 2P)
แผน: Firestore (state + real-time) · Auth.js + Slack · Apps Script → Google Sheet (เรียกจาก server เท่านั้น)

## กติกา
- ใช้ Bootstrap grid/utility ก่อนเขียน CSS เอง · สี/ขนาดใหม่ให้เพิ่มเป็น token ใน `_tokens.scss`
- ข้อความไทยอยู่ในโค้ด ไม่อยู่ในภาพ · ภาพแบรนด์อยู่ใน `public/brand/**` (ดู `docs/CHATGPT-PROMPTS.md`)
- ห้ามเก็บ state ห้องใน memory ของ server (Vercel/Cloud Run scale หลาย instance) → ใช้ Firestore
- สุ่มกาชาปองต้องใช้ `lib/fair-draw.ts` ทั้ง server และหน้าตรวจผล
- ตรวจ `npm run typecheck && npm run build` ก่อน commit · ทดสอบมือถือ 390px ไม่มี scroll แนวนอน
