# DEPLOY — Vercel (demo) → Google Cloud Run (บริษัท)

## ⚠️ ก่อนใช้ Vercel
Handoff เดิม (`costume-vote/SPEC.md` §3) **เคยตัด Vercel ออก** เพราะแพลน Hobby (ฟรี) ระบุให้ใช้ส่วนตัว/ไม่ใช่เชิงพาณิชย์เท่านั้น
งานภายในบริษัทอาจเข้าข่ายใช้ไม่ได้ — ทางเลือก:
1. ใช้ Vercel **Pro** (หรือ Pro trial) ของทีม สำหรับช่วง demo
2. ใช้ Hobby เฉพาะ demo สั้นๆ ไม่มีข้อมูลจริง แล้วลบทิ้ง (ให้หัวหน้า/IT รับทราบ)
3. ข้าม Vercel ไป deploy `party-challenge-demo` บน Cloud Run เลย (ขั้นตอนด้านล่าง ใช้เวลา ~5 นาที)

> ✅ **ตัดสินใจแล้ว (2026-11-12): ข้อ 2** — Vercel Hobby สำหรับ demo สั้นๆ ข้อมูลตัวอย่างเท่านั้น **ห้ามใส่ env Slack/Sheet/Firebase จริง** แล้วลบ project หลังจบ demo
> ลบ: Vercel → Project → Settings → General → Delete Project

โค้ดออกแบบให้ deploy ได้ทั้ง 2 ที่โดยไม่ต้องแก้ (`output: 'standalone'` + state อยู่ใน Firestore ไม่ใช่ memory)

## A. Vercel (demo — ทำเองจากเบราว์เซอร์ ~5 นาที)
> Claude ใน session นี้ deploy ให้ไม่ได้: ต่อ `api.vercel.com` ไม่ได้ (network policy) และไม่มี Vercel token

**ก่อนเริ่ม:** มีบัญชี Vercel (สมัครด้วย GitHub ได้) และบัญชี GitHub นั้นต้องเข้าถึง repo `gorawit-ui/LuckyDraw-and-Voting-system` ได้

1. เข้า https://vercel.com → **Log in with GitHub**
2. กด **Add New… → Project**
3. ในหัวข้อ *Import Git Repository* หา `LuckyDraw-and-Voting-system` → กด **Import**
   - ถ้าไม่เห็น repo: กด *Adjust GitHub App Permissions* → เลือก repo นี้ → Save แล้วกลับมาหน้าเดิม
4. หน้า *Configure Project* — ปล่อยค่าตามนี้
   - Project Name: เช่น `party-challenge-demo` (จะได้ลิงก์ `party-challenge-demo.vercel.app`)
   - Framework Preset: **Next.js** (ตรวจเจอเอง)
   - Root Directory: `./` · Build/Output/Install: ค่าเริ่มต้น
   - **Environment Variables: ไม่ต้องใส่** (เดโมใช้ข้อมูลตัวอย่าง ห้ามใส่ค่า Slack/Sheet จริง ตาม D7)
5. กด **Deploy** → รอ ~1–2 นาที → ได้ลิงก์ `https://<project>.vercel.app`
6. ลองเปิด: `/` · `/lucky/wheel` · `/lucky/gacha/host` · `/vote/admin` แล้วส่งลิงก์ให้ทีม
7. **จบเดโมแล้วลบ:** Project → **Settings → General** → เลื่อนล่างสุด **Delete Project**

**หมายเหตุ**
- branch ที่ deploy = branch หลักของ repo (ตอนนี้คือ `claude/lucid-ride-0x80b4` เพราะเป็น branch เดียว) ทุก push ใหม่จะ deploy อัตโนมัติ
- ถ้าภายหลังมี `main` แล้วอยากเดโม branch อื่น: Settings → Git → Production Branch หรือเปิดลิงก์ Preview ของ branch นั้นในแท็บ Deployments
- ข้อมูลเกมเก็บในเบราว์เซอร์ของแต่ละคน (ระบบจำลอง) — เปิดหลายแท็บเป็นคนละคนได้ แต่มือถือหลายเครื่องยังไม่เห็นข้อมูลเดียวกันจนกว่าจะขึ้น Google Cloud
- ถ้า build ไม่ผ่าน: ดู log ในแท็บ Deployments → ตรวจ Node.js Version ใน Settings → General เป็น 20.x ขึ้นไป

## B. Cloud Run (ตัวจริง)
```bash
gcloud run deploy party-challenge \
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
