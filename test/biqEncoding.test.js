const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { decompress } = require('../src/biq/decompress');
const { parseBiqBuffer, applyBiqEdits } = require('../src/biq/biqBridgeJs');

function loadInflatedFixture(name) {
  const fixturePath = path.join(__dirname, 'fixtures', name);
  const raw = fs.readFileSync(fixturePath);
  if (raw.subarray(0, 4).toString('latin1').startsWith('BIC')) return raw;
  const result = decompress(raw);
  if (!result.ok) throw new Error(result.error || 'Failed to decompress BIQ fixture');
  return result.data;
}

const ENCODING_CASES = [
  { label: 'Windows-1251', encoding: 'windows-1251', civName: 'Ацтеки', leaderName: 'Монтесума' },
  { label: 'GBK', encoding: 'gbk', civName: '阿兹特克', leaderName: '蒙特祖马' },
  { label: 'Big5', encoding: 'big5', civName: '阿茲特克', leaderName: '蒙特祖馬' },
  { label: 'Shift-JIS', encoding: 'shift_jis', civName: 'アステカ', leaderName: 'モンテスマ' },
  { label: 'EUC-KR', encoding: 'euc-kr', civName: '아즈텍', leaderName: '몬테수마' }
];

for (const entry of ENCODING_CASES) {
  test(`applyBiqEdits round-trips BIQ RACE strings in ${entry.label}`, () => {
    const buffer = loadInflatedFixture('biq_playable_civs_fixture.biq');
    const edited = applyBiqEdits({
      buffer,
      textEncoding: entry.encoding,
      edits: [
        { sectionCode: 'RACE', recordRef: 'RACE_AZTECS', fieldKey: 'civilization_name', value: entry.civName },
        { sectionCode: 'RACE', recordRef: 'RACE_AZTECS', fieldKey: 'name', value: entry.leaderName }
      ]
    });

    assert.equal(edited.ok, true);

    const reparsed = parseBiqBuffer(edited.buffer, { textEncoding: entry.encoding });
    assert.equal(reparsed.ok, true);
    const raceSection = reparsed.sections.find((section) => section.code === 'RACE');
    assert.ok(raceSection);
    const aztecs = raceSection.records.find((record) => /RACE_AZTECS/.test(String(record.english || '')));
    assert.ok(aztecs);
    assert.match(String(aztecs.english || ''), new RegExp(`civilizationName: ${entry.civName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.match(String(aztecs.english || ''), new RegExp(`name: ${entry.leaderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  });
}
