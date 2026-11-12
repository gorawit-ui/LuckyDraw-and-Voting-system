/**
 * Matchazuki Lucky Day — ตัวรับข้อมูลลงชีท (Google Apps Script)
 * ที่มา: แชท "เว็บวงล้อสุ่มสำหรับกิจกรรมบริษัท" (โค้ดเดิมตามที่คุยกันไว้)
 *
 * วิธีติดตั้ง
 *  1. เปิด Google Sheet ที่จะใช้เก็บข้อมูล
 *  2. เมนู Extensions > Apps Script  แล้ววางไฟล์นี้ทับของเดิมทั้งหมด
 *  3. แก้ SECRET ด้านล่างเป็นข้อความอะไรก็ได้ที่เดายาก แล้วจำไว้
 *  4. กด Deploy > New deployment > เลือก Web app
 *       Execute as        : Me
 *       Who has access    : Anyone
 *  5. กด Deploy แล้ว copy Web app URL เก็บไว้ เอาไปใส่ในหน้าเว็บกับ Cloud Run
 *
 * ถ้าแก้โค้ดนี้ทีหลัง ต้อง Deploy > Manage deployments > แก้เป็น New version
 * ไม่งั้น URL เดิมจะยังรันโค้ดเก่าอยู่
 */

const SECRET = 'เปลี่ยนเป็นรหัสของคุณ';

const TAB_WHEEL = 'วงล้อคู่';
const TAB_GACHA = 'กาชาปอง';

const HEADERS = {};
HEADERS[TAB_WHEEL] = ['เวลา', 'ชื่อ', 'ของขวัญ', 'รอบที่'];
HEADERS[TAB_GACHA] = ['เวลา', 'ผู้ให้', 'ต้องให้ของกับ', 'รหัสห้อง'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // กันการเขียนชนกันเวลาหลายเครื่องยิงมาพร้อมกัน
    lock.waitLock(20000);

    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) return reply({ ok: false, error: 'unauthorized' });

    const rows = normalize(body);
    if (!rows.length) return reply({ ok: false, error: 'no rows' });

    const sheet = getSheet(body.type === 'gacha' ? TAB_GACHA : TAB_WHEEL);
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);

    return reply({ ok: true, written: rows.length });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** เรียกดูได้จากเบราว์เซอร์เพื่อเช็คว่า deploy สำเร็จแล้ว */
function doGet() {
  return reply({ ok: true, service: 'matchazuki-lucky-logger' });
}

/**
 * รับได้ทั้งแบบแถวเดียวและหลายแถว
 *   วงล้อคู่   { type:'wheel', secret, name:'เบนซ์ (GM)', gift:'หม้อทอด', round:3 }
 *   กาชาปอง   { type:'gacha', secret, room:'OUTING-01', pairs:[{from:'เบนซ์', to:'ป๊อป'}, ...] }
 */
function normalize(body) {
  const ts = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');

  if (body.type === 'gacha') {
    const pairs = body.pairs || [];
    return pairs.map(function (p) {
      return [ts, p.from, p.to, body.room || ''];
    });
  }

  return [[ts, body.name, body.gift, body.round || '']];
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const head = HEADERS[name];
    sheet.getRange(1, 1, 1, head.length).setValues([head])
      .setFontWeight('bold').setBackground('#4E7A2E').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(3, 240);
  }
  return sheet;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
