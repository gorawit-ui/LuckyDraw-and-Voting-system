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
6. **ต่อที่เก็บข้อมูลกลาง (ต้องทำ ไม่งั้นมือถือแต่ละเครื่องเห็นห้องไม่ตรงกัน)** — ฟรี
   1. ใน Project กดแท็บ **Storage** → **Create Database** (หรือ *Browse Marketplace*) → เลือก **Upstash → Upstash for Redis** → Continue
   2. Plan: **Free** · Region: ใกล้ที่สุด (เช่น Singapore) · ตั้งชื่อ เช่น `party-challenge-demo-kv` → Create
   3. หน้า *Connect Project* เลือก project นี้ ติ๊กทุก Environment → **Connect** (Vercel ใส่ env `KV_REST_API_URL` / `KV_REST_API_TOKEN` ให้เอง)
   4. แท็บ **Deployments** → ⋯ ที่ deploy ล่าสุด → **Redeploy** (env ใหม่มีผลหลัง deploy ใหม่)
   - ตรวจ: เปิด `https://<project>.vercel.app/api/store/gacha` ต้องเห็น `"backend":"redis"`
   - เก็บแค่ข้อมูลเดโม (ชื่อเล่น/ผลจับคู่) และหมดอายุเองใน 7 วัน
7. ลองเปิด: `/` · `/lucky/wheel` · `/lucky/gacha/host` · `/vote/admin` แล้วส่งลิงก์ให้ทีม — มือถือสแกน QR บนหน้า host ได้เลย
8. **จบเดโมแล้วลบ:** Storage → database นั้น → Settings → **Delete** แล้ว Project → **Settings → General** → เลื่อนล่างสุด **Delete Project**

**หมายเหตุ**
- branch ที่ deploy = branch หลักของ repo (ตอนนี้คือ `claude/lucid-ride-0x80b4` เพราะเป็น branch เดียว) ทุก push ใหม่จะ deploy อัตโนมัติ
- ถ้าภายหลังมี `main` แล้วอยากเดโม branch อื่น: Settings → Git → Production Branch หรือเปิดลิงก์ Preview ของ branch นั้นในแท็บ Deployments
- ข้อมูลกาชาปอง/โหวตอยู่ที่ server (`/api/store/*` → Upstash Redis) ทุกเครื่องเห็นชุดเดียวกัน · ล้างกลับเป็นตัวอย่างได้ที่ `/vote/admin` (ล้างข้อมูล demo) หรือเปิดห้องกาชาใหม่
- ตัวตนในเดโม (ชื่อที่เลือกตอน login / PIN host / ชื่อที่เข้าห้อง) จำไว้ในเบราว์เซอร์ของเครื่องนั้น — ปิดแท็บแล้วสแกนใหม่ยังเป็นคนเดิม
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

## A2. ทดสอบมือถือในวง Wi-Fi เดียวกัน (ไม่ต้องขึ้น Vercel)
```bash
npm run dev
```
- เปิดหน้า host บนคอม **ผ่าน IP ของเครื่อง** เช่น `http://192.168.1.20:3000/lucky/gacha/host` (ดู IP: macOS `ipconfig getifaddr en0` · Windows `ipconfig`)
  ถ้าเปิดด้วย `localhost` QR จะชี้ไป `localhost` ซึ่งมือถือเข้าไม่ได้ (หน้า host จะขึ้นแถบเตือน)
- มือถือต้องต่อ Wi-Fi วงเดียวกัน · Wi-Fi บริษัท/โรงแรมบางที่กันเครื่องคุยกันเอง (client isolation) → ใช้ hotspot มือถือแทน หรือขึ้น Vercel
- ไม่ต้องตั้ง Redis: เครื่องที่รัน `npm run dev` เก็บข้อมูลไว้ในหน่วยความจำ (หายเมื่อปิด server)

## C. ทดสอบข้ามแพลตฟอร์ม (ก่อนวันงาน)
| อุปกรณ์ | เบราว์เซอร์ |
|---|---|
| Windows | Chrome, Edge |
| macOS | Safari, Chrome |
| iPhone | Safari (iOS 16+) |
| Android | Chrome |
| โปรเจกเตอร์ | 1920×1080 เต็มจอ (F11 / ⌃⌘F) |
