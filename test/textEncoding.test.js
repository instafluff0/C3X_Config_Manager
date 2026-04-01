const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const iconv = require('iconv-lite');

const {
  detectTextFileEncodingFromBuffer,
  readTextFileWithEncodingInfoIfExists,
  buildScenarioCivilopediaEditResult,
  buildScenarioDiplomacyEditResult
} = require('../src/configCore');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-encoding-'));
}

function writeEncoded(filePath, text, encoding) {
  fs.writeFileSync(filePath, iconv.encode(text, encoding));
}

function norm(text) {
  return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

const LEGACY_CASES = [
  {
    label: 'Windows-1251 Cyrillic',
    encoding: 'windows-1251',
    sample: '#RACE_TEST\nРусский текст энциклопедии\n',
    updated: 'Обновленный текст цивилопедии'
  },
  {
    label: 'GBK Simplified Chinese',
    encoding: 'gbk',
    sample: '#RACE_TEST\n简体中文百科内容\n',
    updated: '更新后的简体中文内容'
  },
  {
    label: 'Big5 Traditional Chinese',
    encoding: 'big5',
    sample: '#RACE_TEST\n繁體中文百科內容\n',
    updated: '更新後的繁體中文內容'
  },
  {
    label: 'Shift-JIS Japanese',
    encoding: 'shift_jis',
    sample: '#RACE_TEST\n日本語の百科事典テキスト\n',
    updated: '更新後の日本語テキスト'
  },
  {
    label: 'EUC-KR Korean',
    encoding: 'euc-kr',
    sample: '#RACE_TEST\n한국어 백과사전 텍스트\n',
    updated: '업데이트된 한국어 텍스트'
  }
];

for (const entry of LEGACY_CASES) {
  test(`detectTextFileEncodingFromBuffer identifies ${entry.label}`, () => {
    const buffer = iconv.encode(entry.sample, entry.encoding);
    assert.equal(detectTextFileEncodingFromBuffer(buffer, 'auto'), entry.encoding);
  });

  test(`readTextFileWithEncodingInfoIfExists decodes ${entry.label}`, () => {
    const root = mkTmpDir();
    const filePath = path.join(root, 'Civilopedia.txt');
    writeEncoded(filePath, entry.sample, entry.encoding);

    const info = readTextFileWithEncodingInfoIfExists(filePath, { preferredEncoding: 'auto' });
    assert.ok(info);
    assert.equal(info.encoding, entry.encoding);
    assert.equal(norm(info.text), norm(entry.sample));
    assert.equal(info.bom, false);
  });

  test(`buildScenarioCivilopediaEditResult preserves ${entry.label} on save`, () => {
    const root = mkTmpDir();
    const filePath = path.join(root, 'Civilopedia.txt');
    const initial = ['#RACE_TEST', entry.sample.split('\n')[1], '', ''].join('\n');
    writeEncoded(filePath, initial, entry.encoding);

    const result = buildScenarioCivilopediaEditResult({
      targetPath: filePath,
      edits: [{ sectionKey: 'RACE_TEST', value: entry.updated }],
      preferredEncoding: 'auto'
    });

    assert.equal(result.ok, true);
    assert.equal(result.encoding, entry.encoding);
    fs.writeFileSync(filePath, result.buffer);

    const info = readTextFileWithEncodingInfoIfExists(filePath, { preferredEncoding: 'auto' });
    assert.ok(info);
    assert.equal(info.encoding, entry.encoding);
    assert.match(info.text, new RegExp(entry.updated.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
}

test('buildScenarioDiplomacyEditResult preserves UTF-8 BOM when rewriting text', () => {
  const root = mkTmpDir();
  const filePath = path.join(root, 'diplomacy.txt');
  const initial = '#AIFIRSTCONTACT\n^Hello there\n#AIFIRSTDEAL\n^Deal text\n';
  fs.writeFileSync(filePath, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(initial, 'utf8')]));

  const result = buildScenarioDiplomacyEditResult({
    targetPath: filePath,
    sourcePath: filePath,
    edits: [{ index: 0, firstContact: '你好', firstDeal: '成交' }],
    preferredEncoding: 'auto'
  });

  assert.equal(result.ok, true);
  assert.equal(result.encoding, 'utf8');
  assert.equal(result.bom, true);
  assert.equal(result.buffer[0], 0xef);
  assert.equal(result.buffer[1], 0xbb);
  assert.equal(result.buffer[2], 0xbf);
});
