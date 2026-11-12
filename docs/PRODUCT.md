# PRODUCT — Outing Challenge (มุมมอง PO)

> เอกสารนี้คือ "ความจริงล่าสุด" ของโปรเจกต์ — ถ้าขัดกับ `docs/handoff/*` ให้ยึดไฟล์นี้

## 1. Vision
เว็บเดียวสำหรับวันเอาท์ติ้ง เปิดจากมือถือ/โน้ตบุ๊ก/จอเวทีได้หมด รวม 2 โมดูล
| โมดูล | เกม | ใครใช้ |
|---|---|---|
| **Lucky Zone** | วงล้อคู่ (ชื่อ ↔ ของรางวัล) · ตู้กาชาปองจับคู่แลกของขวัญ | คนคุมเวที + พนักงานทุกคน |
| **Fashion Vote** | โหวตประกวดชุดตอน Fashion Walk | พนักงานทุกคน (มือถือ) + host + จอเวที |

**Success metrics วันงาน**
- คนโหวตได้ภายใน 30 วินาทีหลังสแกน QR (ไม่ต้องถามใคร)
- 0 ข้อร้องเรียนเรื่อง "ระบบล็อกผล"
- รองรับ 100 คนพร้อมกันโดยไม่ค้าง · ผลทุกเกมเก็บลงชีท/CSV ได้ครบ

## 2. Decisions (ตัดสินใจแล้วใน Phase 0)
| # | เรื่อง | ตัดสินใจ | เหตุผล |
|---|---|---|---|
| D1 | Framework | **Next.js (App Router, TypeScript)** ทั้งเว็บ | Costume Vote เลือกไว้แล้ว · deploy ได้ทั้ง Vercel และ Cloud Run (`output: 'standalone'`) |
| D2 | UI | **Bootstrap 5.3 + SCSS theme** (`styles/_tokens.scss`) + Bootstrap Icons | grid/responsive/modal/navbar พร้อมใช้ ทำงานเหมือนกันบน macOS/Windows/มือถือ |
| D3 | Real-time + state | **Firestore** ทั้ง 2 โมดูล (รวมห้องกาชาปอง) | Vercel เป็น serverless เก็บห้องใน memory / ถือ SSE นานๆ ไม่ได้ · Cloud Run scale-to-zero ได้ บิล ≈ 0 |
| D4 | วงล้อคู่ | client-only (Canvas) ไม่ต้องมี backend · พอร์ตตรรกะจากต้นแบบเดิมทั้งหมด | ต้นแบบผ่านการอนุมัติแล้ว (ดู "สิ่งที่ห้ามใส่กลับ" ใน handoff) |
| D5 | สุ่มกาชาปอง | `lib/fair-draw.ts` ใช้ร่วม server + หน้าตรวจผล | โปร่งใส ตรวจซ้ำได้ |
| D6 | ธีม | **Spicy Snack Pack** (ดู `docs/DESIGN.md`) แทนธีม Matchazuki/ม่วงเดิม | ตาม mood ใหม่: สนุก มีพลัง สีสด |
| D7 | Hosting | **Vercel Hobby (ฟรี) เฉพาะ demo สั้นๆ ไม่มีข้อมูลจริง แล้วลบทิ้ง** → Cloud Run บริษัท (จริง) | ผู้ใช้เลือก 2026-11-12 · demo ใช้ข้อมูลตัวอย่างเท่านั้น ไม่ตั้ง env Slack/Sheet |
| D8 | ผลวงล้อเข้าชีท | ส่งผ่าน `POST /api/sheet` (secret อยู่ใน env ฝั่ง server) | แก้ข้อ 1–2 ใน handoff SPEC §6 · ไม่ตั้ง env = เก็บในเครื่อง + CSV |

## 3. ❓ Open questions (ต้องตอบก่อนเริ่ม phase ที่เกี่ยว)
| # | คำถาม | กระทบ | ค่าเริ่มต้นถ้ายังไม่ตอบ |
|---|---|---|---|
| Q1 | กาชาปองแลกของ **เปิดเผย** หรือ **ลับ (Secret Santa)**? | Phase 3 จอเวที/หน้าตรวจผล | เปิดเผย |
| Q2 | ใช้ **Slack login** กับกาชาปองด้วยไหม (แก้ชื่อซ้ำ) หรือพิมพ์ชื่อเอง? | Phase 3 | พิมพ์ชื่อ + ตรวจชื่อซ้ำ |
| ~~Q3~~ | ~~Vercel demo ใช้บัญชีอะไร~~ | ✅ ตอบแล้ว → D7 | |
| Q4 | Fashion Vote มีหลายหมวดรางวัลไหม (สวยสุด/ฮาสุด) | Phase 2 data model | 1 หมวด แต่ออกแบบ schema ให้เพิ่มได้ |
| Q5 | วันงาน / จำนวนคน / wifi สถานที่ | ทดสอบโหลด + แผนสำรอง | 100 คน · มี hotspot สำรอง |
| Q6 | ชื่อเว็บจริง (ตอนนี้ใช้ OUTING CHALLENGE) | Branding | ใช้ชื่อนี้ (มาสคอต: ✅ จี๊ด สีเขียว — ผู้ใช้ยืนยัน 2026-11-12) |

## 4. Roadmap
| Phase | เป้าหมาย | ส่งมอบ | สถานะ |
|---|---|---|---|
| **0 · Foundation** | โครงเว็บ + ธีม + landing + เมนู + deploy demo | repo นี้ · หน้า landing · placeholder ทุกหน้า | ✅ โครงเสร็จ · ⏳ deploy Vercel |
| **0.5 · Brand assets** | ได้ภาพ/มาสคอตจาก ChatGPT มาแทน emoji | `public/brand/**` ตาม `docs/CHATGPT-PROMPTS.md` | ✅ ใส่ในหน้าแรก/วงล้อ/โหวต/404 แล้ว (มาสคอตจี๊ด สีเขียว) |
| **1 · วงล้อคู่** | พอร์ตวงล้อจากต้นแบบ (ใช้ได้ทันทีไม่ต้องมี backend) | `/lucky/wheel` | ✅ เสร็จ (รอภาพจริงจาก 0.5) |
| **2 · Fashion Vote** | Slack login + โหวต + หลังบ้าน + จอเวที | `/vote`, `/vote/admin`, `/vote/stage` | 🟡 2a เสร็จ (UI ครบ + backend จำลอง) · ⏳ 2b ต่อ Slack + Firestore |
| **3 · กาชาปอง** | ห้อง real-time + สุ่มลูกเต๋า + หน้าตรวจผล | `/lucky/gacha`, `/lucky/gacha/stage`, `/verify` | ⏳ รอ Q1, Q2 |
| **4 · Go-live** | ย้าย Cloud Run บริษัท + ซ้อม + load test | Dockerfile + deploy script | ⏳ |

> ลำดับ 1 ก่อน 2: วงล้อไม่ต้องมี backend จึงได้ของเล่นได้จริงเร็วสุด ระหว่างนั้นขอ Slack App/GCP ไปพร้อมกัน

## 5. Backlog (User stories + Acceptance criteria)

### Phase 0 — Foundation
- [x] **F-1** ในฐานะพนักงาน ฉันเปิดหน้าแรกแล้วเห็น 2 โซนชัดเจน กดเข้าได้ในแตะเดียว
  - AC: การ์ดซองขนม 2 ใบ · ลิงก์ย่อยใต้การ์ด · มือถือ 390px ไม่มี scroll แนวนอน
- [x] **F-2** เมนูบาร์ทุกหน้า มี dropdown เข้าแต่ละหน้าย่อย (มือถือเป็น hamburger)
- [x] **F-3** ธีมรวมศูนย์ที่ `styles/_tokens.scss` · ปุ่ม `.btn-pop` · การ์ด `.card-pop` · `.snack-pack`
- [x] **F-4** รองรับ `prefers-reduced-motion`
- [ ] **F-5** Deploy Vercel preview จาก branch → ได้ URL ให้ทีมลอง
- [x] **F-6** ใส่ภาพจริงจาก ChatGPT แทน emoji (มาสคอต hero, ภาพการ์ด 2 โซน, OG image, favicon)

### Phase 1 — วงล้อคู่
- [x] **W-1** คนคุมเวทีแก้รายชื่อ/ของรางวัล (เก็บ localStorage) · AC: ตัดคำไทยตาม SPEC (`Intl.Segmenter`, ตัดบรรทัดสมดุล)
- [x] **W-2** กด "เริ่มหมุน" → วงซ้ายหยุด → วงขวาหมุนค้าง → แตะตรงไหนก็ได้เพื่อหยุด · AC: สุ่ม ณ ตอนกดหยุด · หยุดแล้วไม่เด้ง/ไม่ไหล
- [x] **W-3** "บันทึกแล้วหมุนต่อ" → ตัดออกจากวง + log + CSV + ส่งชีท (ผ่าน API route ไม่ฝัง secret ในหน้าเว็บ) + retry
- [x] **W-4** เสียงติ๊ก + พลุ (เปิด/ปิดเสียงได้) · โหมดเต็มจอสำหรับโปรเจกเตอร์

**Phase 1 — สิ่งที่ต่างจากต้นแบบ (ตั้งใจ)**
- แก้บั๊กต้นแบบ: ป้ายหลายบรรทัดครึ่งวงซ้ายเรียงบรรทัดกลับลำดับ
- ทำตาม SPEC ให้ครบ: ลดขนาดตัวอักษรก่อน (ตัดที่รอยต่อคำ) แล้วค่อยตัดกลางคำ · ไม่ทิ้ง `(` ท้ายบรรทัด / ไม่ขึ้นบรรทัดด้วย `)`
- ตัดชื่อ/ของรางวัลออก "ตามตำแหน่ง" (ชื่อซ้ำจะไม่โดนลบพร้อมกัน) · สุ่มด้วย `crypto.getRandomValues`
- เพิ่ม: คีย์ลัด Space/Enter/→/PageDown (ใช้รีโมตพรีเซนต์ได้) · ปุ่มเต็มจอ · สถานะชีทต่อแถว + ปุ่มส่งซ้ำ · CSV มีรอบที่
- เอาช่อง URL Apps Script ออกจากหน้าเว็บ → ใช้ env `SHEET_LOGGER_URL` / `SHEET_LOGGER_SECRET`

### Phase 2 — Fashion Vote (ทำตาม `docs/handoff/costume-vote/SPEC.md`)
**2a (เสร็จ) — UI ครบทุกหน้า บน backend จำลอง** `lib/vote/mock-store.ts` (localStorage + BroadcastChannel ซิงก์ข้ามแท็บ, login จำลองแยกต่อแท็บ)
- [x] **V-2** สมัครประกวด + ย่อรูป 480px JPEG q0.8 → pending → host อนุมัติ · ถอนใบสมัครได้ขณะ pending
- [x] **V-3 (กฎ)** `lib/vote/logic.ts` ฟังก์ชันล้วน: เปิดอยู่+ไม่หมดเวลา · 1 คน 1 โหวต · ผู้ประกวดโหวตไม่ได้ · น้ำหนัก 10/1 คิดจากข้อมูลผู้ใช้ — **ใช้ซ้ำใน API จริงได้ทันที**
- [x] **V-4** หลังบ้าน 4 แท็บ: ภาพรวม (stepper, ตั้งเวลา, +1 นาที, ปิด/เปิดต่อ +2, stats, ผู้ชนะ, คะแนนสด, ใครโหวตใคร, CSV, รีเซ็ต 2 แบบ, จำลองโหวต) · ผู้ประกวด · ผู้ใช้และสิทธิ์ · งานทั้งหมด
- [x] **V-5** จอเวที: นับคนโหวต + progress + นับถอยหลัง (ไม่โชว์คะแนน) → เปิดผลทีละอันดับจากท้าย (Space/→/←, การ์ดพลิก) → ผู้ชนะ + มาสคอต + พลุ · ปิดอัตโนมัติเมื่อหมดเวลา
- [x] ทดสอบ E2E 4 แท็บพร้อมกัน (host / จอเวที / พนักงาน / เมเนเจอร์) ผ่าน

**2b (ถัดไป) — ต่อของจริง** ⚠️ ต้องมีของจาก IT/Admin ก่อน (ดูหัวข้อ "สิ่งที่ต้องเตรียม")
- [ ] **V-1** Sign in with Slack (Auth.js + OIDC, ตรวจ team ID) แทน `SignIn` จำลอง
- [ ] **V-3 (API)** `POST /api/vote` ใช้ `castVote()` ใน Firestore transaction · doc id = slackId
- [ ] **V-6** แทน `mock-store.ts` ด้วย Firestore (หน้า host/จอเวที subscribe ตรง · มือถืออ่านครั้งเดียว) + Security Rules
- [ ] **V-7** sync เมเนเจอร์จาก Slack user group · ปิดโหวตตามเวลาที่ server
- [ ] QR บนจอเวที (ข้อเสนอ — รอผู้ใช้ยืนยัน)

**สิ่งที่ต้องเตรียมสำหรับ 2b (งาน IT/Admin ของบริษัท)**
1. Slack App: OIDC scopes `openid profile email` + bot scopes `users:read usergroups:read` + Redirect URL ของ demo/prod · บอก Team ID และชื่อ user group เมเนเจอร์
2. GCP project: เปิด Firestore (Native mode, `asia-southeast1`) + service account สำหรับ server
3. Demo บน Vercel ใช้ backend จำลองได้เลย (ข้อมูลตัวอย่าง ไม่มีข้อมูลจริง ตาม D7)

### Phase 3 — กาชาปอง (ทำตาม `docs/handoff/lucky-wheel-gacha/SPEC.md` §4, state บน Firestore)
- [ ] **G-1** สแกน QR เข้าห้อง ใส่ชื่อ (เตือนชื่อซ้ำ) · host เห็น chip real-time ลบได้
- [ ] **G-2** ล็อกห้องต่อหน้าทุกคน → กรอกเลขลูกเต๋า → สุ่มที่ server ครั้งเดียว (`lib/fair-draw.ts`)
- [ ] **G-3** ทุกเครื่อง (รวม host) เล่นแอนิเมชันพร้อมกันแล้วเปิดผล · **ห้ามมีตารางผลบนหน้า host ก่อน**
- [ ] **G-4** จอเวทีตรวจกติกา 3 ข้อ ✓ + QR ไป `/verify` · ส่งผลลงชีททีเดียวจาก server

### Phase 4 — Go-live
- [ ] **L-1** Dockerfile + `scripts/deploy-cloudrun.sh` (min=0, request-based billing, budget alert)
- [ ] **L-2** Firestore Security Rules + Secret Manager
- [ ] **L-3** Load test 100 แท็บ · ทดสอบ Safari iOS / Chrome Android / Edge Windows / Safari macOS
- [ ] **L-4** ซ้อมจริงกับผู้ใหญ่ที่กังวลเรื่องความโปร่งใส · เตรียม hotspot สำรอง

## 6. Definition of Done (ทุก story)
- ใช้ได้บน Chrome/Edge (Windows), Safari/Chrome (macOS), Safari iOS, Chrome Android
- มือถือ 360px ไม่มี scroll แนวนอน · ปุ่มแตะได้ ≥ 44px
- ข้อความไทยทั้งหมด · `npm run build` + `npm run typecheck` ผ่าน
- ไม่ฝัง secret ในโค้ดฝั่งเบราว์เซอร์
