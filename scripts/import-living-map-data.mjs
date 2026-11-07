import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift().map(clean);
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, clean(values[index] ?? '')]))
  );
}

function clean(value) {
  return value
    .replace(/^\uFEFF/, '')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function validCoordinates(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat > 24.8 &&
    lat < 25.3 &&
    lng > 121.3 &&
    lng < 121.8
  );
}

function hospitalName(value) {
  const addressStart = value.search(/臺北市.{1,4}區/);
  return clean(addressStart > 0 ? value.slice(0, addressStart) : value);
}

function writeJson(filename, data) {
  writeFileSync(resolve('public/mock/find-place', filename), `${JSON.stringify(data, null, 2)}\n`);
}

const smokingRows = parseCsv(readFileSync('/tmp/taipei-smoking.csv', 'utf8'));
const smokingAreas = smokingRows.flatMap((row, index) => {
  const lat = Number(row['緯度']);
  const lng = Number(row['經度']);
  if (!validCoordinates(lat, lng)) return [];
  return [
    {
      id: `smoking-${index + 1}`,
      name: row['地點'],
      area: row['行政區'],
      address: row['地址'],
      lat,
      lng,
      style: row['樣態'],
      hours: row['開放時間'],
      relativeLocation: row['相對位置'],
      manager: row['管理單位'],
      phone: row['管理單位電話'],
      note: row['備註'],
      sourceTitle: '臺北市資料大平臺－臺北市指定吸菸區',
      sourceUrl: 'https://data.taipei/dataset/detail?id=8b2fcdeb-d14b-46c4-92d8-66ad07b96a91'
    }
  ];
});

const aedRows = parseCsv(readFileSync('/tmp/taiwan-aed.csv', 'utf8'));
const aedPlaces = aedRows.flatMap((row, index) => {
  if (row['場所縣市'] !== '臺北市') return [];
  const lat = Number(row['地點LAT']);
  const lng = Number(row['地點LNG']);
  if (!validCoordinates(lat, lng)) return [];
  return [
    {
      id: `aed-${row['AEDID'] || index + 1}`,
      name: row['場所名稱'],
      area: row['場所區域'],
      address: row['場所地址'],
      lat,
      lng,
      location: row['AED放置地點'],
      description: row['AED地點描述'],
      hours: row['開放使用時間備註'],
      phone: row['開放時間緊急連絡電話'],
      sourceTitle: '政府資料開放平臺－AED位置資訊',
      sourceUrl: 'https://data.gov.tw/dataset/12063'
    }
  ];
});

const hospitalText = new TextDecoder('big5').decode(readFileSync('/tmp/taipei-hospitals.csv'));
const hospitalRows = parseCsv(hospitalText);
const hospitals = hospitalRows.flatMap((row, index) => {
  const lat = Number(row['緯度']);
  const lng = Number(row['經度']);
  if (!validCoordinates(lat, lng)) return [];
  return [
    {
      id: `hospital-${index + 1}`,
      name: hospitalName(row['機構名稱']),
      address: row['地址'],
      lat,
      lng,
      sourceTitle: '臺北市政府衛生局－臺北市醫院清冊',
      sourceUrl: 'https://data.gov.tw/dataset/121182'
    }
  ];
});

writeJson('designated_smoking_areas.json', smokingAreas);
writeJson('aed_taipei.json', aedPlaces);
writeJson('taipei_hospitals.json', hospitals);

console.log(
  JSON.stringify({
    smokingAreas: smokingAreas.length,
    aedPlaces: aedPlaces.length,
    hospitals: hospitals.length
  })
);
