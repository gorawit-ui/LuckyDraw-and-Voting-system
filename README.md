# 🌶️ Outing Challenge

เว็บรวมเกมวันเอาท์ติ้ง — **Lucky Zone** (วงล้อคู่ · ตู้กาชาปอง) + **Fashion Vote** (โหวตประกวดชุด)

```bash
npm install
npm run dev        # http://localhost:3000
```

| หน้า | Path | สถานะ |
|---|---|---|
| หน้าแรก (เลือกเกม) | `/` | ✅ |
| Lucky Zone · วงล้อคู่ | `/lucky/wheel` | ✅ Phase 1 |
| Lucky Zone · กาชาปอง | `/lucky/gacha` | 🚧 placeholder → ต้นแบบ |
| Fashion Vote | `/vote` · `/vote/stage` · `/vote/admin` | 🟡 Phase 2a (backend จำลอง) |
| ต้นแบบเดิม (เล่นได้) | `/prototypes/lucky-wheel-gacha.html` · `/prototypes/costume-vote.html` | 📦 |

## เอกสาร
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — roadmap, backlog, คำถามที่ยังค้าง
- [`docs/DESIGN.md`](docs/DESIGN.md) — mood & tone, สี, ฟอนต์, components
- [`docs/CHATGPT-PROMPTS.md`](docs/CHATGPT-PROMPTS.md) — prompt ให้ ChatGPT ทำภาพ/มาสคอต/คำพูด
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — Vercel → Cloud Run
- [`docs/handoff/`](docs/handoff) — สเปกต้นทางจากแชทเดิม
