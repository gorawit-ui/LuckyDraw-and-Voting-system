# DEPLOY — Vercel (demo) → Google Cloud Run (บริษัท)

## ⚠️ ก่อนใช้ Vercel
Handoff เดิม (`costume-vote/SPEC.md` §3) **เคยตัด Vercel ออก** เพราะแพลน Hobby (ฟรี) ระบุให้ใช้ส่วนตัว/ไม่ใช่เชิงพาณิชย์เท่านั้น
งานภายในบริษัทอาจเข้าข่ายใช้ไม่ได้ — ทางเลือก:
1. ใช้ Vercel **Pro** (หรือ Pro trial) ของทีม สำหรับช่วง demo
2. ใช้ Hobby เฉพาะ demo สั้นๆ ไม่มีข้อมูลจริง แล้วลบทิ้ง (ให้หัวหน้า/IT รับทราบ)
3. ข้าม Vercel ไป deploy `outing-demo` บน Cloud Run เลย (ขั้นตอนด้านล่าง ใช้เวลา ~5 นาที)

โค้ดออกแบบให้ deploy ได้ทั้ง 2 ที่โดยไม่ต้องแก้ (`output: 'standalone'` + state อยู่ใน Firestore ไม่ใช่ memory)

## A. Vercel
1. vercel.com → Add New Project → Import repo `LuckyDraw-and-Voting-system`
2. Framework: Next.js (ตรวจเจออัตโนมัติ) · Build: `npm run build` · Node 20+
3. Environment Variables: ใส่ตาม `.env.example` (Phase 0 ยังไม่ต้องใส่อะไร)
4. ทุก push เข้า branch → ได้ Preview URL อัตโนมัติ

## B. Cloud Run (ตัวจริง)
```bash
gcloud run deploy outing-challenge \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --min-instances=0 --max-instances=3 \
  --cpu-throttling \
  --memory=512Mi
```
- `--source .` ใช้ `Dockerfile` ใน repo (Next.js standalone)
- `--min-instances=0` + `--cpu-throttling` (request-based billing) → เปิดทิ้งทั้งปีบิล ≈ 0
- เปิด max-instances > 1 ได้เพราะ state อยู่ใน Firestore (ไม่ใช่ memory แบบต้นแบบเดิม)
- วันงาน: ตั้ง `--min-instances=1` ชั่วคราวกัน cold start แล้วลดกลับเป็น 0 หลังงาน
- ตั้ง budget alert $1/เดือน · Artifact Registry cleanup policy เก็บ 2–3 image ล่าสุด
- Secrets (Slack, Firebase admin, Sheet logger) → Secret Manager แล้ว `--set-secrets`

## C. ทดสอบข้ามแพลตฟอร์ม (ก่อนวันงาน)
| อุปกรณ์ | เบราว์เซอร์ |
|---|---|
| Windows | Chrome, Edge |
| macOS | Safari, Chrome |
| iPhone | Safari (iOS 16+) |
| Android | Chrome |
| โปรเจกเตอร์ | 1920×1080 เต็มจอ (F11 / ⌃⌘F) |
