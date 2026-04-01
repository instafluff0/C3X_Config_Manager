const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('base field renderers do not mutate rows during initial render', () => {
  const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
  const text = fs.readFileSync(rendererPath, 'utf8');

  assert.doesNotMatch(
    text,
    /rerender\(\);\s*recalc\(\);\s*return wrap;/,
    'limit_units_per_tile renderer should not call recalc during initial render'
  );

  assert.doesNotMatch(
    text,
    /onChange\(serializeBuildingPrereqItems\(items\)\);\s*rerender\(\);\s*return wrap;/,
    'building_prereqs_for_units renderer should not normalize row.value during initial render'
  );

  assert.doesNotMatch(
    text,
    /onChange\(serializeBuildingResourceItems\(items\)\);\s*rerender\(\);\s*return wrap;/,
    'buildings_generating_resources renderer should not normalize row.value during initial render'
  );
});

test('building prereq parser preserves quoted multi-word unit names', () => {
  const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
  const text = fs.readFileSync(rendererPath, 'utf8');
  const snippetMatch = text.match(/function parseBuildingPrereqItems\(value\) \{[\s\S]*?\n\}/);

  assert.ok(snippetMatch, 'parseBuildingPrereqItems should exist');
  const snippet = snippetMatch[0];

  assert.match(
    snippet,
    /const units = parseBracketedOptionTokens\(item\.slice\(i \+ 1\)\);/,
    'building_prereqs_for_units should parse unit lists with quote-aware tokenization'
  );

  assert.doesNotMatch(
    snippet,
    /replace\(\/\\s\+\/g, ','\)/,
    'building_prereqs_for_units should not rewrite spaces into commas before tokenization'
  );
});

test('tech era dropdown uses BIQ era names when available', () => {
  const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
  const text = fs.readFileSync(rendererPath, 'utf8');

  assert.match(
    text,
    /makeBiqSectionIndexOptions\('ERAS', false\)/,
    'Tech reference resolver should read era labels from the ERAS section'
  );

  assert.match(
    text,
    /if \(eraOptions\.length > 0\) return eraOptions;/,
    'Tech reference resolver should prefer BIQ era labels before falling back'
  );
});

test('civilization playable toggle is read-only for barbarians', () => {
  const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
  const text = fs.readFileSync(rendererPath, 'utf8');

  assert.match(
    text,
    /function isBarbarianCivilizationEntry\(entry\)/,
    'Renderer should expose a barbarian-civilization guard for the Civs playable toggle'
  );

  assert.match(
    text,
    /if \(isBarbarianCivilizationEntry\(entry\)\) return false;/,
    'Playable state writes should refuse barbarian civilization entries'
  );

  assert.match(
    text,
    /const playableReadonly = !referenceEditable \|\| isBarbarianCivilizationEntry\(entry\);/,
    'Playable checkbox should render read-only for barbarian civilization entries'
  );
});

test('C3X bitfield base settings serialize with whitespace-separated bracket lists', () => {
  const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
  const text = fs.readFileSync(rendererPath, 'utf8');

  assert.match(
    text,
    /function serializeWhitespaceStructuredEntries\(entries\) \{[\s\S]*?cleaned\.join\(' '\)/,
    'Renderer should provide a whitespace-delimited structured serializer for C3X bitfield fields'
  );

  assert.match(
    text,
    /if \(BASE_MULTI_CHOICE_LIST_OPTIONS\[row\.key\]\) \{[\s\S]*?onChange\(serializeWhitespaceStructuredEntries\(ordered\)\);[\s\S]*?\}/,
    'C3X multi-choice bitfield controls should write whitespace-delimited bracket lists'
  );

  assert.doesNotMatch(
    text,
    /if \(BASE_MULTI_CHOICE_LIST_OPTIONS\[row\.key\]\) \{[\s\S]*?onChange\(serializeStructuredEntries\(ordered\)\);[\s\S]*?\}/,
    'C3X multi-choice bitfield controls must not write comma-delimited lists'
  );
});

test('C3X quoted reference-list settings serialize with whitespace-separated quoted bracket lists', () => {
  const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
  const text = fs.readFileSync(rendererPath, 'utf8');

  assert.match(
    text,
    /function serializeQuotedWhitespaceStructuredEntries\(entries\) \{[\s\S]*?cleaned\.join\(' '\)/,
    'Renderer should provide a whitespace-delimited quoted serializer for unit/improvement reference lists'
  );

  assert.match(
    text,
    /if \(BASE_REFERENCE_LIST_TAB_BY_KEY\[row\.key\]\) \{[\s\S]*?onValuesChange: \(values\) => onChange\(serializeQuotedWhitespaceStructuredEntries\(values\)\)[\s\S]*?\}/,
    'C3X reference-list controls should write whitespace-delimited quoted bracket lists'
  );

  assert.doesNotMatch(
    text,
    /if \(BASE_REFERENCE_LIST_TAB_BY_KEY\[row\.key\]\) \{[\s\S]*?onValuesChange: \(values\) => onChange\(serializeQuotedStructuredEntries\(values\)\)[\s\S]*?\}/,
    'C3X reference-list controls must not write comma-delimited quoted lists'
  );
});

test('C3X special zone of control options match injected_code source tokens', () => {
  const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
  const text = fs.readFileSync(rendererPath, 'utf8');

  assert.match(
    text,
    /special_zone_of_control_rules:\s*\['amphibious', 'lethal', 'aerial', 'not-from-inside', 'all'\]/,
    'ZoC option list should expose only the C3X-supported tokens plus all'
  );

  assert.doesNotMatch(
    text,
    /special_zone_of_control_rules:\s*\[[^\]]*no-city-no-defense[^\]]*\]/,
    'ZoC option list must not advertise unsupported no-city-no-defense'
  );
});

test('C3X retreat-rule options match injected_code source tokens', () => {
  const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
  const manifestPath = path.join(__dirname, '..', 'src', 'c3xBaseManifest.js');
  const rendererText = fs.readFileSync(rendererPath, 'utf8');
  const manifestText = fs.readFileSync(manifestPath, 'utf8');

  const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expected = "['standard', 'none', 'all-units', 'if-faster', 'if-not-slower', 'if-fast-and-not-slower']";
  assert.match(
    rendererText,
    new RegExp(`land_retreat_rules:\\s*${escapeRegex(expected)}`),
    'Renderer should expose all C3X-supported land retreat rule options'
  );
  assert.match(
    rendererText,
    new RegExp(`sea_retreat_rules:\\s*${escapeRegex(expected)}`),
    'Renderer should expose all C3X-supported sea retreat rule options'
  );
  assert.match(
    manifestText,
    new RegExp(`land_retreat_rules:\\s*Object\\.freeze\\(${escapeRegex(expected)}\\)`),
    'Manifest should track the full land retreat rule enum'
  );
  assert.match(
    manifestText,
    new RegExp(`sea_retreat_rules:\\s*Object\\.freeze\\(${escapeRegex(expected)}\\)`),
    'Manifest should track the full sea retreat rule enum'
  );
});

test('C3X source-backed enum readers match renderer and manifest options', () => {
  const rendererPath = path.join(__dirname, '..', 'src', 'renderer.js');
  const manifestPath = path.join(__dirname, '..', 'src', 'c3xBaseManifest.js');
  const rendererText = fs.readFileSync(rendererPath, 'utf8');
  const manifestText = fs.readFileSync(manifestPath, 'utf8');
  const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const sourceEnumOptions = {
    draw_lines_using_gdi_plus: ['never', 'wine', 'always'],
    double_minimap_size: ['never', 'high-def', 'always'],
    unit_cycle_search_criteria: ['standard', 'similar-near-start', 'similar-near-destination'],
    work_area_limit: ['none', 'cultural', 'cultural-min-2', 'cultural-or-adjacent'],
    day_night_cycle_mode: ['off', 'timer', 'user-time', 'every-turn', 'specified'],
    distribution_hub_yield_division_mode: ['flat', 'scale-by-city-count'],
    ai_distribution_hub_build_strategy: ['auto', 'by-city-count'],
    ai_auto_build_great_wall_strategy: ['all-borders', 'other-civ-bordered-only'],
    land_retreat_rules: ['standard', 'none', 'all-units', 'if-faster', 'if-not-slower', 'if-fast-and-not-slower'],
    sea_retreat_rules: ['standard', 'none', 'all-units', 'if-faster', 'if-not-slower', 'if-fast-and-not-slower']
  };

  Object.entries(sourceEnumOptions).forEach(([key, options]) => {
    const arrayLiteral = `[${options.map((opt) => `'${opt}'`).join(', ')}]`;
    assert.match(
      rendererText,
      new RegExp(`${escapeRegex(key)}:\\s*${escapeRegex(arrayLiteral)}`),
      `Renderer options for ${key} should match injected_code.c`
    );
    assert.match(
      manifestText,
      new RegExp(`${escapeRegex(key)}:\\s*Object\\.freeze\\(${escapeRegex(arrayLiteral)}\\)`),
      `Manifest options for ${key} should match injected_code.c`
    );
  });
});
