# ให้ ChatGPT ช่วยออกแบบอะไรได้บ้าง + Prompt พร้อมใช้

## สรุปสั้น: อะไรควรให้ ChatGPT ทำ / อะไรให้โค้ดทำ
| ให้ ChatGPT (สร้างภาพ/คิดคำ) | ให้โค้ดทำ (อยู่ใน repo แล้ว) |
|---|---|
| มาสคอต + ท่าทางต่างๆ · ภาพประจำโซน · ตู้กาชาปอง/แคปซูล · สติกเกอร์ · พื้นหลังจอเวที · โลโก้ตัวอักษร (อังกฤษ) · OG image · โปสเตอร์ QR · คำพูด/สคริปต์พิธีกร | สี ฟอนต์ ปุ่ม การ์ด layout · **ข้อความภาษาไทยทุกตัว** · วงล้อ (Canvas) · แอนิเมชัน · confetti |

> ⚠️ **ห้ามให้ AI วาดตัวหนังสือไทยลงในภาพ** — มักสะกดเพี้ยน ให้สั่ง "no text" แล้วใส่ข้อความไทยด้วยโค้ดแทน
> ⚠️ แนบรูปถุงขนมเป็น **reference สไตล์เท่านั้น** — สั่งชัดว่าห้ามลอกโลโก้/ตัวละคร/ชื่อแบรนด์ (กันปัญหาลิขสิทธิ์)

---

## 0. วิธีใช้ (ทำครั้งเดียว)
1. เปิดแชทใหม่ใน ChatGPT (โหมดสร้างภาพ) แนบรูปถุงขนม
2. วาง **Prompt 0 (Style Lock)** ก่อน — ให้ทุกภาพหลังจากนี้สไตล์เดียวกัน
3. ทำ Prompt 1 (มาสคอต) ให้ได้ตัวที่ชอบก่อน แล้วค่อยทำข้ออื่นในแชทเดียวกัน (มันจะจำหน้าตัวละคร)
4. ดาวน์โหลด → ตั้งชื่อตามตาราง "ไฟล์ที่ต้องการ" → วางใน `public/brand/...` → แจ้ง Claude Code ให้เอาไปใส่

---

## Prompt 0 — Style Lock (วางก่อนทุกอย่าง)
```
I'm designing a fun, reusable company event web app called "PARTY CHALLENGE" (lucky-draw wheel, gift-exchange gachapon, and a fashion-walk voting game).
It will be reused for many kinds of events, so never add event-specific words (e.g. "outing", a year, a venue) to any image.
Use the attached snack bag ONLY as a style reference. Do NOT copy its logo, brand name, characters or text.

Style rules for every image in this chat:
- Bold cartoon sticker style, thick black outlines (~3px at 512px), flat colors, simple cel shading, no gradients blur
- Palette: chili red #E8262B, mustard yellow #FFD23F, tangerine #FF8A1F, jalapeño green #3BB54A,
  sky blue #5BC8F0, mint #3EC6A8, cocoa #6B3A1E, cream #FFF6E0, ink black #1A1414
- Energetic, playful, a bit retro 8-bit arcade (pixel fire, "game start" vibes)
- NO text, letters or numbers inside images unless I explicitly ask
- Transparent background (PNG) unless I say otherwise
Reply "ready" and wait for my next request.
```

## Prompt 1 — มาสคอตหลัก (Character sheet)
```
Create an original mascot: a cheerful chili pepper character named "Jeed" (red body, green stem like a little hat,
big expressive eyes, rosy cheeks, white cartoon gloves, sneakers). Friendly to all ages, slightly mischievous.
Make a character sheet on a plain cream background: front view, 3/4 view, back view, plus 3 facial expressions
(excited, nervous sweating, proud). Keep proportions simple so it can be redrawn consistently.
```
> ไม่ชอบพริก? เปลี่ยนเป็น "a cute matcha-cup character" (ให้เข้ากับ Matchazuki) หรือ "a gacha capsule character"

## Prompt 2 — มาสคอตท่าต่างๆ สำหรับแต่ละหน้า (สั่งทีละภาพ)
```
Using the same mascot Jeed, draw it [POSE], full body, transparent background, 1024x1024, centered with padding.
```
แทน `[POSE]` ทีละข้อ:
| ไฟล์ | POSE | ใช้ที่ |
|---|---|---|
| `mascot/hero.png` | jumping with both arms up, holding a game controller, pixel flames behind | Hero หน้าแรก |
| `mascot/wheel.png` | spinning a big colorful prize wheel with one hand, excited face | การ์ด Lucky / หน้าวงล้อ |
| `mascot/gacha.png` | hugging a big gacha capsule, sparkles around | หน้ากาชาปอง |
| `mascot/judge.png` | wearing a tiny crown, holding up a score card (blank card, no numbers) | การ์ด Fashion Vote |
| `mascot/runway.png` | striking a fashion model pose with sunglasses on a mini runway | หน้าโหวต |
| `mascot/nervous.png` | biting nails, sweat drops, waiting anxiously | หน้ารอผล / นับถอยหลัง |
| `mascot/winner.png` | holding a golden trophy, confetti bursting | ประกาศผู้ชนะ |
| `mascot/sad.png` | sitting and shrugging, a small storm cloud above | 404 / error |

## Prompt 3 — ภาพประจำโซน (การ์ดซองขนมหน้าแรก)
```
Design key art for a game-selection card, portrait 4:5 (1024x1280), no text.
Theme: [THEME]. Background solid [COLOR] with a subtle halftone dot pattern, mascot Jeed in the middle,
props around it, thick black outlines, leave the bottom 30% fairly clean (UI text will be placed there).
```
| ไฟล์ | THEME | COLOR |
|---|---|---|
| `zones/lucky.png` | lucky draw: a big prize wheel, gift boxes, gacha capsules, stars | sky blue #5BC8F0 |
| `zones/vote.png` | fashion walk contest: runway, spotlight, crown, camera flashes | mint #3EC6A8 |

## Prompt 4 — ตู้กาชาปอง + แคปซูล (สำหรับแอนิเมชัน)
```
Draw a cute retro gachapon capsule machine, front view, transparent background, 1024x1280.
Red body #E8262B, clear glass dome full of colorful capsules, mustard coin knob, chute at the bottom. No text.
```
```
Draw a sprite set of gacha capsules on transparent background, same style:
(1) closed capsule top half mustard, bottom half cream; (2) same capsule cracking; (3) capsule popped open with sparkles.
Each 512x512, arranged in a row, equal spacing.
```
→ `stickers/gacha-machine.png`, `stickers/capsule-closed.png`, `capsule-crack.png`, `capsule-open.png` (ตัดแยกไฟล์)

## Prompt 5 — สติกเกอร์ตกแต่ง
```
Create a sticker sheet on transparent background, 8 separate stickers with white outer border + black outline:
chili pepper, pixel flame, star, crown, trophy, gift box, dice showing 5, camera flash. Each ~256px, no text.
```
→ `stickers/*.png` ใช้แทน emoji 🌶️🔥⭐ ที่ลอยใน hero

## Prompt 6 — พื้นหลังจอเวที (โปรเจกเตอร์ 16:9)
```
Wide 16:9 stage background (1920x1080), no text, no characters:
[SCENE]. Keep the center 60% darker and clean so big white/yellow numbers stay readable. Thick outline cartoon style.
```
| ไฟล์ | SCENE |
|---|---|
| `backgrounds/stage-vote.png` | red theater curtains on both sides, runway in perspective, spotlights, deep purple floor |
| `backgrounds/stage-lucky.png` | retro arcade stage, pixel flames on the edges, chili red with halftone dots |

## Prompt 7 — โลโก้ตัวอักษร (อังกฤษเท่านั้น)
```
Design a wordmark logo "PARTY CHALLENGE" in two lines, chunky rounded heavy letters, mustard yellow fill,
thick black outline, hard offset black shadow, small pixel-flame accent. Transparent background, 1600x800.
Spell it exactly: P-A-R-T-Y  C-H-A-L-L-E-N-G-E.
```
→ `logo.png` (ถ้าตัวสะกดเพี้ยน ไม่ต้องใช้ — โค้ดทำโลโก้ด้วย CSS ได้อยู่แล้ว)

## Prompt 7b — แก้โลโก้เดิมเป็น PARTY CHALLENGE (2026-11-13)
แนบไฟล์ `OUTING_CHALLENGE_Wordmark_1600x800.png` เดิมแล้ววาง:
```
Edit the attached wordmark logo. Replace the word "OUTING" with "PARTY" so it reads "PARTY CHALLENGE" on two lines
(line 1: PARTY, line 2: CHALLENGE). Keep EVERYTHING else identical: the same chunky rounded heavy letters,
mustard yellow fill #FFD23F, thick black outline, hard offset black shadow, the small pixel flame accent
at the top-right of the first line, transparent background, 1600x800.
Center line 1 above line 2 (PARTY is shorter than OUTING, so do not leave a gap on the right).
Spell it exactly: P-A-R-T-Y  C-H-A-L-L-E-N-G-E. No other text, no year, no event name.
```
→ ตั้งชื่อ `PARTY_CHALLENGE_Wordmark_1600x800.png` ใส่โฟลเดอร์ "06: Prompt 7" ใน Drive แล้วแจ้ง Claude
(ถ้าแก้แล้วตัวอักษรเพี้ยน ใช้ Prompt 7 ด้านบนสร้างใหม่แทน — ชื่อในนั้นอัปเดตแล้ว)

## Prompt 8 — OG image + favicon
```
Social share image 1200x630: chili red halftone background, mascot Jeed on the right holding a game controller,
left 55% empty for text overlay. No text.
```
```
App icon 512x512: mascot Jeed's face only, mustard circle background, thick outline, must be readable at 32px.
```
→ `og.png`, `icon.png`

## Prompt 9 — คำพูดบนเว็บ + สคริปต์พิธีกร (ข้อความ ไม่ใช่ภาพ)
```
ช่วยเขียน microcopy ภาษาไทยสำหรับเว็บเกมงานกิจกรรมบริษัท (ใช้ได้ทุกงาน ห้ามระบุชื่องาน) โทนสนุก กวนนิดๆ สุภาพกับผู้ใหญ่ สั้นไม่เกิน 6 คำต่อปุ่ม
ขอเป็นตาราง: จุดที่ใช้ | ข้อความ 3 ตัวเลือก
จุดที่ใช้: ปุ่มเริ่มหมุนวงล้อ, ปุ่มหยุดวงล้อ, ข้อความตอนได้ของรางวัล, ปุ่มบันทึกแล้วหมุนต่อ,
หน้ารอเข้าห้องกาชาปอง, ข้อความตอนแคปซูลแตก, ปุ่มโหวต, ข้อความยืนยันโหวต (เตือนว่าแก้ไม่ได้),
ข้อความหลังโหวตแล้ว, จอเวทีระหว่างรอผล, ประกาศผู้ชนะ, หน้า 404
และเขียนสคริปต์พิธีกร 1 นาทีอธิบายว่ากาชาปองสุ่มด้วยลูกเต๋าจริง ระบบล็อกผลไม่ได้ ใครสงสัยตรวจเองได้
```
→ วางผลลงไฟล์ `docs/copy.md` แล้วให้ Claude Code เอาไปใส่

## Prompt 10 — โปสเตอร์ QR ตั้งโต๊ะ (A4)
```
A4 portrait poster background (2480x3508), chili red halftone, mascot Jeed pointing down to a large empty cream
rounded square in the center (a QR code will be placed there), pixel flame border. No text.
```
→ `backgrounds/qr-poster.png` (ใส่ QR + ข้อความไทยทีหลังด้วยโค้ด/Canva)

---

## ไฟล์ที่ต้องการ (checklist ส่งกลับมา)

> ✅ รอบที่ 1 ได้ครบแล้ว (2026-11-12) — ผลตรวจอยู่ที่ `docs/brand/ASSETS.md`

| Path ใน `public/brand/` | ขนาด | พื้นหลัง | ความสำคัญ |
|---|---|---|---|
| `mascot/hero.png` | 1024² | โปร่งใส | ⭐ ต้องมี |
| `zones/lucky.png`, `zones/vote.png` | 1024×1280 | สีทึบ | ⭐ ต้องมี |
| `og.png` · `icon.png` | 1200×630 · 512² | ทึบ | ⭐ ต้องมี |
| `mascot/{wheel,gacha,judge,runway,nervous,winner,sad}.png` | 1024² | โปร่งใส | ดีถ้ามี |
| `stickers/*.png` (8 ชิ้น + gacha set) | 256–1024 | โปร่งใส | ดีถ้ามี |
| `backgrounds/stage-{vote,lucky}.png` | 1920×1080 | ทึบ | ดีถ้ามี |
| `backgrounds/qr-poster.png` | A4 | ทึบ | วันงาน |
| `docs/copy.md` | — | — | ดีถ้ามี |

**ก่อนส่ง:** ย่อไฟล์ด้วย squoosh.app / tinypng ให้ภาพละ < 300 KB (PNG โปร่งใส) — เว็บจะเปิดเร็วบนเน็ตมือถือ
