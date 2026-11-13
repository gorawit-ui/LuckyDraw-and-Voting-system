# DESIGN — Mood & Tone "Spicy Snack Pack"

อ้างอิง mood จากถุงขนมอัลมอนด์รสต่างๆ ที่แนบมา (ใช้แค่ **สไตล์** — ห้ามใช้โลโก้ ชื่อแบรนด์ หรือตัวละครของสินค้านั้น)

## 1. Keywords
**สนุก · ซ่า · มีพลัง · เกมตู้ 8-bit · สติกเกอร์การ์ตูน · ใช้ง่ายแบบไม่ต้องอ่านคู่มือ**

| สิ่งที่เห็นในรูปอ้างอิง | แปลงมาเป็น UI |
|---|---|
| พื้นแดงพริก + จุด halftone | `body` แดง `#E8262B` + จุด halftone (CSS radial-gradient) |
| ตัวหนังสือหนาเหลือง ขอบดำ เงาแข็ง | `.display-pop` — Kanit 900 + `-webkit-text-stroke` + `text-shadow` ไม่เบลอ |
| ป้าย "START" แบบพิกเซล + แถบพลังมีไฟ | `.pixel-badge` (Press Start 2P) · ใช้กับ PRESS START / PHASE / STEP |
| ซองขนมมินิหลายสี เรียงเป็นตาราง | `.snack-pack` — การ์ดเลือกเกม 1 ซอง = 1 โซน สีประจำโซน |
| มาสคอตการ์ตูนหน้าตาตลก ขอบหนา | มาสคอตของเราเอง (สั่งทำจาก ChatGPT) — ตอนนี้ใช้ emoji แทน |
| เส้นขอบดำหนาทุกชิ้น | `border: 3px solid #1A1414` + เงาแข็ง `6px 6px 0` |
| ไฟ พริก ดาว รอบๆ | sticker ลอย `.hero-floaty` (ปิดเองเมื่อผู้ใช้ตั้ง reduce motion) |

## 2. Color tokens (`styles/_tokens.scss`)
| Token | Hex | ใช้กับ |
|---|---|---|
| chili | `#E8262B` | พื้นหลังหลัก |
| chili-deep | `#B3121B` | จุด halftone / hover |
| mustard | `#FFD23F` | หัวข้อใหญ่ · ปุ่มหลัก (Bootstrap `primary`) |
| tangerine | `#FF8A1F` | ป้ายพิกเซล · `warning` |
| jalapeno | `#3BB54A` | สำเร็จ / ยืนยัน · `success` |
| sky | `#5BC8F0` | สีประจำ **Lucky Zone** |
| mint | `#3EC6A8` | สีประจำ **Fashion Vote** |
| cocoa | `#6B3A1E` | `secondary` |
| cream | `#FFF6E0` | พื้นการ์ด/ฟอร์ม (อ่านง่าย) |
| ink | `#1A1414` | ตัวอักษร + เส้นขอบทุกชิ้น |

**กฎ contrast:** ตัวอักษรบนพื้นแดงใช้ cream หรือ mustard ตัวหนาเท่านั้น · เนื้อหายาว/ฟอร์ม วางบน `.card-pop` (cream) เสมอ

## 3. Typography
| บทบาท | ฟอนต์ | หมายเหตุ |
|---|---|---|
| Display / หัวข้อ | **Kanit** 800–900 | หนา กลม อ่านไทยชัดบนโปรเจกเตอร์ |
| เนื้อหา | **Anuphan** 400–700 | ใช้ในทั้ง 2 handoff เดิม |
| ป้ายเกม | **Press Start 2P** | อังกฤษ/ตัวเลขเท่านั้น (ไม่มีไทย) ใช้สั้นๆ |

โหลดผ่าน `next/font/google` (self-host อัตโนมัติ ไม่ต้องพึ่ง Google Fonts ตอนรันจริง)

## 4. Components (Bootstrap 5 + class เสริม)
| Class | คือ | ตัวอย่าง |
|---|---|---|
| `.btn .btn-pop` (+`-green`, `-cream`) | ปุ่มนูน กดแล้วยุบ | CTA ทุกจุด |
| `.card-pop` | การ์ดสติกเกอร์พื้นครีม | ฟอร์ม, ผลลัพธ์ |
| `.snack-pack .pack-lucky/.pack-vote` | การ์ดเลือกเกมทรงซองขนม | หน้าแรก, `/lucky` |
| `.pixel-badge` (+`.blink`) | ป้ายพิกเซล | PRESS START, PHASE |
| `.chip-pop` | ป้ายเม็ดยา | tag, ลิงก์ย่อย, ชื่อคนในห้อง |
| `.display-pop` | ตัวหนังสือโลโก้ | Hero, จอเวที, GAME OVER |
| `.navbar-pop` | เมนูดำ ไฮไลต์เหลือง | ทุกหน้า |

ใช้ grid/utility ของ Bootstrap ตามปกติ (`row g-4`, `col-md-6`, `d-flex`, `gap-3`) — **อย่าเขียน CSS layout เองถ้า Bootstrap มีแล้ว**

## 5. Landing page layout (Phase 0)
```
┌ Navbar: [GO] PARTY CHALLENGE   ········ หน้าแรก | 🎡 Lucky Zone ▾ | 👑 Fashion Vote ▾ ┐
│ HERO   ▶ PRESS START                                                              │
│        PARTY / CHALLENGE   (ตัวใหญ่ขอบดำ)       🌶️ 🔥 ⭐ ลอยรอบๆ                    │
│        [3 เกม] [รวมเกมทุกงาน]       tagline                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌ ซองฟ้า: Lucky Zone ┐     ┌ ซองมิ้นต์: Fashion Vote ┐   ← การ์ดเอียงนิดๆ hover เด้ง  │
│  └ ชิป: วงล้อคู่ · กาชาปอง ┘ └ ชิป: โหวต · จอเวที · Host ┘                               │
├ แถบดำ: STEP 1 สแกน QR → STEP 2 เลือกเกม → STEP 3 ลุ้นบนจอใหญ่ ┤
└ footer ┘
```
มือถือ: การ์ดเรียงลงมาเป็นแถวเดียว · เมนูยุบเป็น hamburger สีเหลือง

## 6. Motion
- hover การ์ด: เด้งขึ้น + เอียง −1° (spring `cubic-bezier(.3,1.6,.5,1)`)
- ปุ่ม: กดแล้วยุบ 3px (เงาหาย) — ให้ความรู้สึกกดปุ่มตู้เกม
- ช่วงลุ้น (วงล้อ/กาชาปอง/reveal): ใช้ confetti + เสียงได้เต็มที่ · ส่วนอื่นเรียบ ไม่แย่งความสนใจ
- `prefers-reduced-motion` ปิด animation ทั้งหมด

## 7. Do / Don't
✅ ขอบดำหนา เงาแข็ง สีจัด ตัวใหญ่ · ✅ 1 หน้า = 1 ปุ่มหลัก · ✅ ข้อความสั้น เป็นกันเอง
❌ เงาเบลอ/gradient ฟุ้ง/glassmorphism · ❌ ตัวหนังสือบางบนพื้นแดง · ❌ ใช้ภาพ/โลโก้สินค้าจริงจากรูปอ้างอิง
❌ ใส่กลับสิ่งที่ผู้ใช้ปฏิเสธไว้ใน handoff (ผ้าคลุมวงล้อ, หมุดรอบวง, เข็มค้างคาหมุด)
