const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  saveBundle,
  parseCivilopediaDocumentWithOrder,
  parsePediaIconsDocumentWithOrder
} = require('../src/configCore');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-text-matrix-'));
}

function docTextByKey(doc, key) {
  const upper = String(key || '').trim().toUpperCase();
  const sec = doc.sections[upper];
  if (!sec || !Array.isArray(sec.rawLines)) return '';
  return sec.rawLines.join('\n').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function normPediaLines(lines) {
  return (Array.isArray(lines) ? lines : [])
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .map((line) => line.replace(/\\/g, '/'));
}

function setupScenarioTextFiles() {
  const root = mkTmpDir();
  const scenario = mkTmpDir();
  const textDir = path.join(scenario, 'Text');
  fs.mkdirSync(textDir, { recursive: true });

  const civilopediaPath = path.join(textDir, 'Civilopedia.txt');
  const pediaIconsPath = path.join(textDir, 'PediaIcons.txt');

  const civilopedia = [
    '#RACE_TEST_CIV',
    'Original civ overview line.',
    '',
    '#DESC_RACE_TEST_CIV',
    'Original civ description.',
    '',
    '#TECH_TEST_TECH',
    'Original tech overview.',
    '',
    '#DESC_TECH_TEST_TECH',
    'Original tech description.',
    '',
    '#GOOD_TEST_RESOURCE',
    'Original resource overview.',
    '',
    '#DESC_GOOD_TEST_RESOURCE',
    'Original resource description.',
    '',
    '#BLDG_TEST_IMPROVEMENT',
    'Original improvement overview.',
    '',
    '#DESC_BLDG_TEST_IMPROVEMENT',
    'Original improvement description.',
    '',
    '#GOVT_TEST_GOV',
    'Original government overview.',
    '',
    '#DESC_GOVT_TEST_GOV',
    'Original government description.',
    '',
    '#PRTO_TEST_UNIT',
    'Original unit overview.',
    '',
    '#DESC_PRTO_TEST_UNIT',
    'Original unit description.',
    '',
    '#GCON_TEST_CONCEPT',
    'Original concept overview.',
    '',
    '#DESC_GCON_TEST_CONCEPT',
    'Original concept description.',
    '',
    '#TERR_TEST_TERRAIN',
    'Original terrain overview.',
    '',
    '#DESC_TERR_TEST_TERRAIN',
    'Original terrain description.',
    '',
    '#TFRM_TEST_WORK',
    'Original worker action overview.',
    '',
    '#DESC_TFRM_TEST_WORK',
    'Original worker action description.',
    '',
    '#RACE_UNTOUCHED',
    'founded Tenochtitl\u00e1n',
    '',
    '#DESC_RACE_UNTOUCHED',
    'Unchanged long description.',
    ''
  ].join('\n');

  const pediaIcons = [
    '#ICON_RACE_TEST_CIV',
    'art\\civilopedia\\icons\\races\\test-civ-large.pcx',
    'art\\civilopedia\\icons\\races\\test-civ-small.pcx',
    '',
    '#ICON_GOOD_TEST_RESOURCE',
    'art\\civilopedia\\icons\\resources\\resource-large.pcx',
    'art\\civilopedia\\icons\\resources\\resource-small.pcx',
    '',
    '#ICON_BLDG_TEST_IMPROVEMENT',
    'art\\civilopedia\\icons\\buildings\\impr-large.pcx',
    'art\\civilopedia\\icons\\buildings\\impr-small.pcx',
    '',
    '#TECH_TEST_TECH',
    'art\\civilopedia\\icons\\tech chooser\\tech-small.pcx',
    '',
    '#TECH_TEST_TECH_LARGE',
    'art\\civilopedia\\icons\\tech chooser\\tech-large.pcx',
    '',
    '#ANIMNAME_PRTO_TEST_UNIT',
    'TestUnit',
    '',
    '#ICON_RACE_UNTOUCHED',
    'art\\civilopedia\\icons\\races\\untouched-large.pcx',
    'art\\civilopedia\\icons\\races\\untouched-small.pcx',
    ''
  ].join('\n');

  fs.writeFileSync(civilopediaPath, Buffer.from(civilopedia, 'latin1'));
  fs.writeFileSync(pediaIconsPath, Buffer.from(pediaIcons, 'latin1'));

  return { root, scenario, civilopediaPath, pediaIconsPath };
}

function makeEntry(civilopediaKey, overrides = {}) {
  return {
    civilopediaKey,
    civilopediaSection1: `Updated ${civilopediaKey} overview`,
    originalCivilopediaSection1: `Original ${civilopediaKey} overview`,
    civilopediaSection2: `Updated ${civilopediaKey} description`,
    originalCivilopediaSection2: `Original ${civilopediaKey} description`,
    iconPaths: [],
    originalIconPaths: [],
    racePaths: [],
    originalRacePaths: [],
    animationName: '',
    originalAnimationName: '',
    biqFields: [],
    ...overrides
  };
}

test('text write matrix: all supported Civilopedia/PediaIcons edit kinds persist and untouched sections remain valid', () => {
  const { root, scenario, civilopediaPath, pediaIconsPath } = setupScenarioTextFiles();

  const tabs = {
    civilizations: {
      title: 'Civs',
      type: 'reference',
      entries: [
        makeEntry('RACE_TEST_CIV', {
          civilopediaSection1: 'Updated civ overview text.',
          originalCivilopediaSection1: 'Original civ overview line.',
          civilopediaSection2: 'Updated civ description text.',
          originalCivilopediaSection2: 'Original civ description.',
          iconPaths: [
            'art\\civilopedia\\icons\\races\\new-civ-large.pcx',
            'art\\civilopedia\\icons\\races\\new-civ-small.pcx'
          ],
          originalIconPaths: [
            'art\\civilopedia\\icons\\races\\test-civ-large.pcx',
            'art\\civilopedia\\icons\\races\\test-civ-small.pcx'
          ]
        })
      ],
      sourceDetails: {
        civilopediaScenario: civilopediaPath,
        pediaIconsScenarioWrite: pediaIconsPath
      }
    },
    technologies: {
      title: 'Techs',
      type: 'reference',
      entries: [
        makeEntry('TECH_TEST_TECH', {
          civilopediaSection1: 'Updated tech overview text.',
          originalCivilopediaSection1: 'Original tech overview.',
          civilopediaSection2: 'Updated tech description text.',
          originalCivilopediaSection2: 'Original tech description.',
          iconPaths: [
            'art\\civilopedia\\icons\\tech chooser\\new-tech-small.pcx',
            'art\\civilopedia\\icons\\tech chooser\\new-tech-large.pcx'
          ],
          originalIconPaths: [
            'art\\civilopedia\\icons\\tech chooser\\tech-small.pcx',
            'art\\civilopedia\\icons\\tech chooser\\tech-large.pcx'
          ]
        })
      ]
    },
    resources: {
      title: 'Resources',
      type: 'reference',
      entries: [
        makeEntry('GOOD_TEST_RESOURCE', {
          civilopediaSection1: 'Updated resource overview text.',
          originalCivilopediaSection1: 'Original resource overview.',
          civilopediaSection2: 'Updated resource description text.',
          originalCivilopediaSection2: 'Original resource description.',
          iconPaths: [
            'art\\civilopedia\\icons\\resources\\new-resource-large.pcx',
            'art\\civilopedia\\icons\\resources\\new-resource-small.pcx'
          ],
          originalIconPaths: [
            'art\\civilopedia\\icons\\resources\\resource-large.pcx',
            'art\\civilopedia\\icons\\resources\\resource-small.pcx'
          ]
        })
      ]
    },
    improvements: {
      title: 'Improvements',
      type: 'reference',
      entries: [
        makeEntry('BLDG_TEST_IMPROVEMENT', {
          civilopediaSection1: 'Updated improvement overview text.',
          originalCivilopediaSection1: 'Original improvement overview.',
          civilopediaSection2: 'Updated improvement description text.',
          originalCivilopediaSection2: 'Original improvement description.',
          iconPaths: [
            'art\\civilopedia\\icons\\buildings\\new-impr-large.pcx',
            'art\\civilopedia\\icons\\buildings\\new-impr-small.pcx'
          ],
          originalIconPaths: [
            'art\\civilopedia\\icons\\buildings\\impr-large.pcx',
            'art\\civilopedia\\icons\\buildings\\impr-small.pcx'
          ]
        })
      ]
    },
    governments: {
      title: 'Governments',
      type: 'reference',
      entries: [
        makeEntry('GOVT_TEST_GOV', {
          civilopediaSection1: 'Updated government overview text.',
          originalCivilopediaSection1: 'Original government overview.',
          civilopediaSection2: 'Updated government description text.',
          originalCivilopediaSection2: 'Original government description.'
        })
      ]
    },
    units: {
      title: 'Units',
      type: 'reference',
      entries: [
        makeEntry('PRTO_TEST_UNIT', {
          civilopediaSection1: 'Updated unit overview text.',
          originalCivilopediaSection1: 'Original unit overview.',
          civilopediaSection2: 'Updated unit description text.',
          originalCivilopediaSection2: 'Original unit description.',
          animationName: 'TestUnitNew',
          originalAnimationName: 'TestUnit',
          unitIniEditor: {}
        })
      ]
    },
    gameConcepts: {
      title: 'Game Concepts',
      type: 'reference',
      entries: [
        makeEntry('GCON_TEST_CONCEPT', {
          civilopediaSection1: 'Updated concept overview text.',
          originalCivilopediaSection1: 'Original concept overview.',
          civilopediaSection2: 'Updated concept description text.',
          originalCivilopediaSection2: 'Original concept description.'
        })
      ]
    },
    terrainPedia: {
      title: 'Terrain',
      type: 'reference',
      entries: [
        makeEntry('TERR_TEST_TERRAIN', {
          civilopediaSection1: 'Updated terrain overview text.',
          originalCivilopediaSection1: 'Original terrain overview.',
          civilopediaSection2: 'Updated terrain description text.',
          originalCivilopediaSection2: 'Original terrain description.'
        })
      ]
    },
    workerActions: {
      title: 'Worker Actions',
      type: 'reference',
      entries: [
        makeEntry('TFRM_TEST_WORK', {
          civilopediaSection1: 'Updated worker overview text.',
          originalCivilopediaSection1: 'Original worker action overview.',
          civilopediaSection2: 'Updated worker description text.',
          originalCivilopediaSection2: 'Original worker action description.'
        })
      ]
    }
  };

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: root,
    civ3Path: '',
    scenarioPath: scenario,
    tabs
  });

  assert.equal(result.ok, true, String(result.error || 'save failed'));

  const civilopediaSaved = fs.readFileSync(civilopediaPath).toString('latin1');
  const pediaSaved = fs.readFileSync(pediaIconsPath).toString('latin1');
  const civDoc = parseCivilopediaDocumentWithOrder(civilopediaSaved);
  const pediaDoc = parsePediaIconsDocumentWithOrder(pediaSaved);

  assert.match(docTextByKey(civDoc, 'RACE_TEST_CIV'), /Updated civ overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_RACE_TEST_CIV'), /Updated civ description text\./);
  assert.match(docTextByKey(civDoc, 'TECH_TEST_TECH'), /Updated tech overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_TECH_TEST_TECH'), /Updated tech description text\./);
  assert.match(docTextByKey(civDoc, 'GOOD_TEST_RESOURCE'), /Updated resource overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_GOOD_TEST_RESOURCE'), /Updated resource description text\./);
  assert.match(docTextByKey(civDoc, 'BLDG_TEST_IMPROVEMENT'), /Updated improvement overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_BLDG_TEST_IMPROVEMENT'), /Updated improvement description text\./);
  assert.match(docTextByKey(civDoc, 'GOVT_TEST_GOV'), /Updated government overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_GOVT_TEST_GOV'), /Updated government description text\./);
  assert.match(docTextByKey(civDoc, 'PRTO_TEST_UNIT'), /Updated unit overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_PRTO_TEST_UNIT'), /Updated unit description text\./);
  assert.match(docTextByKey(civDoc, 'GCON_TEST_CONCEPT'), /Updated concept overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_GCON_TEST_CONCEPT'), /Updated concept description text\./);
  assert.match(docTextByKey(civDoc, 'TERR_TEST_TERRAIN'), /Updated terrain overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_TERR_TEST_TERRAIN'), /Updated terrain description text\./);
  assert.match(docTextByKey(civDoc, 'TFRM_TEST_WORK'), /Updated worker overview text\./);
  assert.match(docTextByKey(civDoc, 'DESC_TFRM_TEST_WORK'), /Updated worker description text\./);

  assert.match(docTextByKey(civDoc, 'RACE_UNTOUCHED'), /founded Tenochtitl\u00e1n/);
  assert.match(docTextByKey(civDoc, 'DESC_RACE_UNTOUCHED'), /Unchanged long description\./);

  assert.deepEqual(normPediaLines(pediaDoc.blocks.TECH_TEST_TECH), ['art/civilopedia/icons/tech chooser/new-tech-small.pcx']);
  assert.deepEqual(normPediaLines(pediaDoc.blocks.TECH_TEST_TECH_LARGE), ['art/civilopedia/icons/tech chooser/new-tech-large.pcx']);
  assert.deepEqual(normPediaLines(pediaDoc.blocks.ICON_GOOD_TEST_RESOURCE), [
    'art/civilopedia/icons/resources/new-resource-large.pcx',
    'art/civilopedia/icons/resources/new-resource-small.pcx'
  ]);
  assert.deepEqual(normPediaLines(pediaDoc.blocks.ICON_BLDG_TEST_IMPROVEMENT), [
    'art/civilopedia/icons/buildings/new-impr-large.pcx',
    'art/civilopedia/icons/buildings/new-impr-small.pcx'
  ]);
  assert.deepEqual(normPediaLines(pediaDoc.blocks.ICON_RACE_TEST_CIV), [
    'art/civilopedia/icons/races/new-civ-large.pcx',
    'art/civilopedia/icons/races/new-civ-small.pcx'
  ]);
  assert.deepEqual(normPediaLines(pediaDoc.blocks.ANIMNAME_PRTO_TEST_UNIT), ['TestUnitNew']);
  assert.deepEqual(normPediaLines(pediaDoc.blocks.ICON_RACE_UNTOUCHED), [
    'art/civilopedia/icons/races/untouched-large.pcx',
    'art/civilopedia/icons/races/untouched-small.pcx'
  ]);
});

test('large Civilopedia file: single-entry edit keeps all other entries parseable and unchanged', () => {
  const root = mkTmpDir();
  const scenario = mkTmpDir();
  const textDir = path.join(scenario, 'Text');
  fs.mkdirSync(textDir, { recursive: true });
  const civilopediaPath = path.join(textDir, 'Civilopedia.txt');

  const sections = [];
  for (let i = 0; i < 220; i += 1) {
    const key = `GCON_BULK_${i}`;
    sections.push(`#${key}`);
    sections.push(`Overview ${i}`);
    sections.push('');
    sections.push(`#DESC_${key}`);
    sections.push(`Description ${i}`);
    sections.push('');
  }
  fs.writeFileSync(civilopediaPath, Buffer.from(sections.join('\n'), 'latin1'));

  const tabs = {
    civilizations: {
      title: 'Civs',
      type: 'reference',
      entries: [],
      sourceDetails: {
        civilopediaScenario: civilopediaPath
      }
    },
    gameConcepts: {
      title: 'Game Concepts',
      type: 'reference',
      entries: [
        {
          civilopediaKey: 'GCON_BULK_111',
          civilopediaSection1: 'Overview 111 edited',
          originalCivilopediaSection1: 'Overview 111',
          civilopediaSection2: 'Description 111 edited',
          originalCivilopediaSection2: 'Description 111',
          iconPaths: [],
          originalIconPaths: [],
          racePaths: [],
          originalRacePaths: [],
          animationName: '',
          originalAnimationName: '',
          biqFields: []
        }
      ]
    }
  };

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: root,
    civ3Path: '',
    scenarioPath: scenario,
    tabs
  });
  assert.equal(result.ok, true, String(result.error || 'save failed'));

  const saved = fs.readFileSync(civilopediaPath).toString('latin1');
  const doc = parseCivilopediaDocumentWithOrder(saved);
  assert.equal(doc.order.length, 440);
  assert.equal(docTextByKey(doc, 'GCON_BULK_0'), 'Overview 0');
  assert.equal(docTextByKey(doc, 'DESC_GCON_BULK_0'), 'Description 0');
  assert.equal(docTextByKey(doc, 'GCON_BULK_111'), 'Overview 111 edited');
  assert.equal(docTextByKey(doc, 'DESC_GCON_BULK_111'), 'Description 111 edited');
  assert.equal(docTextByKey(doc, 'GCON_BULK_219'), 'Overview 219');
  assert.equal(docTextByKey(doc, 'DESC_GCON_BULK_219'), 'Description 219');
});

test('scenario save rewrites imported tech icon paths to scenario-root-relative Windows paths', () => {
  const root = mkTmpDir();
  const scenario = path.join(root, 'MyScenario');
  const sourceScenario = path.join(root, 'Eldorado5');
  const textDir = path.join(scenario, 'Text');
  const sourceArtDir = path.join(sourceScenario, 'Art', 'tech chooser', 'Icons');
  fs.mkdirSync(textDir, { recursive: true });
  fs.mkdirSync(sourceArtDir, { recursive: true });

  const pediaIconsPath = path.join(textDir, 'PediaIcons.txt');
  fs.writeFileSync(pediaIconsPath, Buffer.from([
    '#TECH_003',
    'Art\\tech chooser\\Icons\\old-small.pcx',
    '#TECH_003_LARGE',
    'Art\\tech chooser\\Icons\\old-large.pcx',
    ''
  ].join('\n'), 'latin1'));
  fs.writeFileSync(path.join(sourceArtDir, 'Pirate_Small.pcx'), 'small');
  fs.writeFileSync(path.join(sourceArtDir, 'Pirate_Large.pcx'), 'large');

  const tabs = {
    civilizations: {
      sourceDetails: {
        pediaIconsScenarioWrite: pediaIconsPath
      }
    },
    technologies: {
      entries: [{
        civilopediaKey: 'TECH_003',
        isNew: true,
        _importScenarioPath: path.join(root, 'Eldorado5.biq'),
        iconPaths: [
          'Eldorado5/Art/tech chooser/Icons/Pirate_Small.pcx',
          'Eldorado5/Art/tech chooser/Icons/Pirate_Large.pcx'
        ],
        originalIconPaths: [
          'Eldorado5/Art/tech chooser/Icons/Pirate_Small.pcx',
          'Eldorado5/Art/tech chooser/Icons/Pirate_Large.pcx'
        ],
        racePaths: [],
        originalRacePaths: [],
        animationName: '',
        originalAnimationName: '',
        biqFields: []
      }],
      recordOps: [{
        op: 'add',
        newRecordRef: 'TECH_003',
        importArtFrom: path.join(root, 'Eldorado5.biq')
      }]
    }
  };

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: root,
    civ3Path: root,
    scenarioPath: scenario,
    tabs
  });

  assert.equal(result.ok, true, String(result.error || 'save failed'));
  const saved = fs.readFileSync(pediaIconsPath).toString('latin1');
  assert.match(saved, /#TECH_003\r?\nArt\\tech chooser\\Icons\\Pirate_Small\.pcx/);
  assert.match(saved, /#TECH_003_LARGE\r?\nArt\\tech chooser\\Icons\\Pirate_Large\.pcx/);
  assert.doesNotMatch(saved, /Eldorado5[\\/]/);
  assert.deepEqual(tabs.technologies.entries[0].iconPaths, [
    'Art/tech chooser/Icons/Pirate_Small.pcx',
    'Art/tech chooser/Icons/Pirate_Large.pcx'
  ]);
});

test('scenario save rewrites imported generic icon and race path blocks to scenario-root-relative Windows paths', () => {
  const root = mkTmpDir();
  const scenario = path.join(root, 'MyScenario');
  const textDir = path.join(scenario, 'Text');
  fs.mkdirSync(textDir, { recursive: true });

  const pediaIconsPath = path.join(textDir, 'PediaIcons.txt');
  fs.writeFileSync(pediaIconsPath, Buffer.from([
    '#ICON_GOOD_TEST_RESOURCE',
    'Art\\Civilopedia\\Icons\\Resources\\old-large.pcx',
    'Art\\Civilopedia\\Icons\\Resources\\old-small.pcx',
    '#ICON_RACE_AMAZONIANS',
    'Art\\Civilopedia\\Icons\\Races\\old-race-large.pcx',
    'Art\\Civilopedia\\Icons\\Races\\old-race-small.pcx',
    '#RACE_AMAZONIANS',
    'Art\\Advisors\\old_all.pcx',
    'Art\\Leaderheads\\old large.pcx',
    ''
  ].join('\n'), 'latin1'));

  const tabs = {
    civilizations: {
      sourceDetails: {
        pediaIconsScenarioWrite: pediaIconsPath
      },
      entries: [{
        civilopediaKey: 'RACE_AMAZONIANS',
        isNew: true,
        _importScenarioPath: path.join(root, 'Eldorado5.biq'),
        iconPaths: [
          'Eldorado5/Art/Civilopedia/Icons/Races/AmazoniansLarge.pcx',
          'Eldorado5/Art/Civilopedia/Icons/Races/AmazoniansSmall.pcx'
        ],
        originalIconPaths: [
          'Eldorado5/Art/Civilopedia/Icons/Races/AmazoniansLarge.pcx',
          'Eldorado5/Art/Civilopedia/Icons/Races/AmazoniansSmall.pcx'
        ],
        racePaths: [
          'Eldorado5/Art/Advisors/amazonians_all.pcx',
          'Eldorado5/Art/Leaderheads/amazonians large.pcx'
        ],
        originalRacePaths: [
          'Eldorado5/Art/Advisors/amazonians_all.pcx',
          'Eldorado5/Art/Leaderheads/amazonians large.pcx'
        ],
        animationName: '',
        originalAnimationName: '',
        biqFields: []
      }],
      recordOps: []
    },
    resources: {
      entries: [{
        civilopediaKey: 'GOOD_TEST_RESOURCE',
        isNew: true,
        _importScenarioPath: path.join(root, 'Eldorado5.biq'),
        iconPaths: [
          'Eldorado5/Art/Civilopedia/Icons/Resources/NewLarge.pcx',
          'Eldorado5/Art/Civilopedia/Icons/Resources/NewSmall.pcx'
        ],
        originalIconPaths: [
          'Eldorado5/Art/Civilopedia/Icons/Resources/NewLarge.pcx',
          'Eldorado5/Art/Civilopedia/Icons/Resources/NewSmall.pcx'
        ],
        racePaths: [],
        originalRacePaths: [],
        animationName: '',
        originalAnimationName: '',
        biqFields: []
      }],
      recordOps: []
    }
  };

  const result = saveBundle({
    mode: 'scenario',
    c3xPath: root,
    civ3Path: root,
    scenarioPath: scenario,
    tabs
  });

  assert.equal(result.ok, true, String(result.error || 'save failed'));
  const saved = fs.readFileSync(pediaIconsPath).toString('latin1');
  assert.match(saved, /#ICON_GOOD_TEST_RESOURCE\r?\nArt\\Civilopedia\\Icons\\Resources\\NewLarge\.pcx\r?\nArt\\Civilopedia\\Icons\\Resources\\NewSmall\.pcx/);
  assert.match(saved, /#ICON_RACE_AMAZONIANS\r?\nArt\\Civilopedia\\Icons\\Races\\AmazoniansLarge\.pcx\r?\nArt\\Civilopedia\\Icons\\Races\\AmazoniansSmall\.pcx/);
  assert.match(saved, /#RACE_AMAZONIANS\r?\nArt\\Advisors\\amazonians_all\.pcx\r?\nArt\\Leaderheads\\amazonians large\.pcx/);
  assert.doesNotMatch(saved, /Eldorado5[\\/]/);
  assert.deepEqual(tabs.resources.entries[0].iconPaths, [
    'Art/Civilopedia/Icons/Resources/NewLarge.pcx',
    'Art/Civilopedia/Icons/Resources/NewSmall.pcx'
  ]);
  assert.deepEqual(tabs.civilizations.entries[0].iconPaths, [
    'Art/Civilopedia/Icons/Races/AmazoniansLarge.pcx',
    'Art/Civilopedia/Icons/Races/AmazoniansSmall.pcx'
  ]);
  assert.deepEqual(tabs.civilizations.entries[0].racePaths, [
    'Art/Advisors/amazonians_all.pcx',
    'Art/Leaderheads/amazonians large.pcx'
  ]);
});
