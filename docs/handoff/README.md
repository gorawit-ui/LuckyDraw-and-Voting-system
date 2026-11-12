# Handoff: เว็บกิจกรรม outing 2 ตัว

| โฟลเดอร์ | เว็บ | แชทต้นทาง |
|---|---|---|
| `lucky-wheel-gacha/` | วงล้อคู่ + ตู้กาชาปองจับคู่แลกของ | เว็บวงล้อสุ่มสำหรับกิจกรรมบริษัท |
| `costume-vote/` | โหวตประกวดชุด | Costume contest voting web application |

แต่ละโฟลเดอร์มี `CLAUDE.md` (Claude Code อ่านอัตโนมัติ) · `SPEC.md` (สเปกเต็ม) · `prototype.html` (ต้นแบบล่าสุด)
วิธีใช้: เปิดแต่ละโฟลเดอร์เป็นโปรเจกต์แยกใน Claude Code แล้วสั่งเช่น "ทำตาม SPEC.md"

## ข้อควรรู้ตอนรวมเป็นเว็บเดียวทีหลัง
สองแชทตัดสินใจ stack ไม่ตรงกัน ต้องเลือกให้เป็นแบบเดียวก่อนรวม

| เรื่อง | วงล้อ + กาชาปอง | Costume Vote |
|---|---|---|
| Frontend | HTML/JS ธรรมดา ไม่มี build | Next.js (TypeScript) |
| Backend | Node 20 + Hono | Next.js API routes |
| เก็บข้อมูล | memory ของ server + Google Sheet | Firestore |
| Real-time | SSE ผ่าน Cloud Run | Firestore subscribe ตรงจากเบราว์เซอร์ |
| Login | ไม่มี (สแกน QR ใส่ชื่อ) | Sign in with Slack |
| Cloud Run | min=1, max=1 (~$5–8/เดือนถ้าเปิดทิ้ง) | min=0, request-based (บิล 0) |
| ธีม | Matchazuki เขียว/ครีม/ทอง · Chonburi+Anuphan | ม่วง/ชมพู · Mitr+Anuphan |

ประเด็นหลัก: กาชาปองเก็บห้องไว้ใน memory จึงต้อง `max-instances=1` และถ้าตั้ง `min-instances=0` เพื่อให้ฟรีแบบ Costume Vote
ห้องจะหายเมื่อ instance ปิดตอนไม่มีคนใช้ ถ้ารวมกันบน Cloud Run ตัวเดียวแล้วอยากให้ฟรีทั้งปี
ทางที่ง่ายสุดคือย้าย state ห้องกาชาปองไปไว้ใน Firestore เหมือน Costume Vote
และอาจใช้ Slack login แทนการพิมพ์ชื่อเอง (แก้ปัญหาชื่อซ้ำได้ด้วย) — ทั้งสองข้อนี้ยังไม่ได้คุยกันในแชท ต้องตัดสินใจตอนรวม
