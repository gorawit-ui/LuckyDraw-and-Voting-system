/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone = ได้ server.js ไฟล์เดียว เอาไปใส่ Docker บน Cloud Run ได้ทันที (Vercel ไม่สนค่านี้)
  output: 'standalone',
  sassOptions: {
    // Bootstrap 5.3 ยังใช้ @import / color functions แบบเก่า — ปิดคำเตือนของ Dart Sass ไม่ให้รก console
    quietDeps: true,
    silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'legacy-js-api'],
  },
};
export default nextConfig;
