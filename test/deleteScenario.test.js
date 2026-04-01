const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { deleteScenario } = require('../src/configCore');

const FIXTURE_BIQ = path.join(__dirname, 'fixtures', 'biq_lead_nomap_fixture.biq');

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'c3x-delete-scenario-'));
}

function writeFixtureBiq(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(FIXTURE_BIQ, targetPath);
}

test('deleteScenario dry run plans deleting the local scenario folder when the BIQ lives inside it', () => {
  const civ3Root = mkTmpDir();
  const scenarioDir = path.join(civ3Root, 'Conquests', 'Scenarios', 'LocalScenario');
  const scenarioPath = path.join(scenarioDir, 'LocalScenario.biq');
  writeFixtureBiq(scenarioPath);
  fs.writeFileSync(path.join(scenarioDir, 'scenario.c3x_config.ini'), 'flag = true\n', 'utf8');
  fs.mkdirSync(path.join(scenarioDir, 'Text'), { recursive: true });
  fs.writeFileSync(path.join(scenarioDir, 'Text', 'Civilopedia.txt'), '#TEST\nLine\n', 'latin1');

  const result = deleteScenario({
    dryRun: true,
    civ3Path: civ3Root,
    scenarioPath
  });

  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.equal(result.scenarioName, 'LocalScenario');
  assert.deepEqual(result.retainedPaths, []);
  assert.equal(Array.isArray(result.plannedDeletes), true);
  assert.equal(result.plannedDeletes.length, 1);
  assert.equal(result.plannedDeletes[0].kind, 'scenarioDir');
  assert.equal(path.normalize(result.plannedDeletes[0].path), path.normalize(scenarioDir));
});

test('deleteScenario dry run for shared Scenarios root deletes BIQ and matching sibling folder only', () => {
  const civ3Root = mkTmpDir();
  const scenariosRoot = path.join(civ3Root, 'Conquests', 'Scenarios');
  const scenarioPath = path.join(scenariosRoot, 'SharedSource.biq');
  const scenarioDir = path.join(scenariosRoot, 'SharedSource');
  const unrelatedDir = path.join(scenariosRoot, 'Unrelated Scenario');
  writeFixtureBiq(scenarioPath);
  fs.mkdirSync(path.join(scenarioDir, 'Text'), { recursive: true });
  fs.writeFileSync(path.join(scenarioDir, 'Text', 'Civilopedia.txt'), '#TEST\nShared\n', 'latin1');
  fs.mkdirSync(unrelatedDir, { recursive: true });
  fs.writeFileSync(path.join(unrelatedDir, 'marker.txt'), 'keep me\n', 'utf8');

  const result = deleteScenario({
    dryRun: true,
    civ3Path: civ3Root,
    scenarioPath
  });

  assert.equal(result.ok, true);
  const planned = new Map(result.plannedDeletes.map((entry) => [entry.kind, path.normalize(entry.path)]));
  assert.equal(planned.get('biq'), path.normalize(scenarioPath));
  assert.equal(planned.get('scenarioContent'), path.normalize(scenarioDir));
  assert.equal(Array.from(planned.values()).includes(path.normalize(unrelatedDir)), false);
});

test('deleteScenario removes planned files and folders from disk', () => {
  const civ3Root = mkTmpDir();
  const scenariosRoot = path.join(civ3Root, 'Conquests', 'Scenarios');
  const scenarioPath = path.join(scenariosRoot, 'DeleteMe.biq');
  const scenarioDir = path.join(scenariosRoot, 'DeleteMe');
  writeFixtureBiq(scenarioPath);
  fs.mkdirSync(path.join(scenarioDir, 'Art', 'Units'), { recursive: true });
  fs.writeFileSync(path.join(scenarioDir, 'Art', 'Units', 'marker.txt'), 'delete\n', 'utf8');

  const result = deleteScenario({
    civ3Path: civ3Root,
    scenarioPath
  });

  assert.equal(result.ok, true);
  assert.equal(fs.existsSync(scenarioPath), false);
  assert.equal(fs.existsSync(scenarioDir), false);
  assert.equal(Array.isArray(result.deleteResults), true);
  assert.equal(result.deleteResults.every((entry) => entry.status === 'deleted'), true);
});

test('deleteScenario rolls back restored files if deletion fails mid-operation', () => {
  const civ3Root = mkTmpDir();
  const scenariosRoot = path.join(civ3Root, 'Conquests', 'Scenarios');
  const scenarioPath = path.join(scenariosRoot, 'RollbackMe.biq');
  const scenarioDir = path.join(scenariosRoot, 'RollbackMe');
  writeFixtureBiq(scenarioPath);
  fs.mkdirSync(path.join(scenarioDir, 'Text'), { recursive: true });
  const markerPath = path.join(scenarioDir, 'Text', 'marker.txt');
  fs.writeFileSync(markerPath, 'keep\n', 'utf8');

  const originalRmSync = fs.rmSync;
  let injected = false;
  fs.rmSync = (targetPath, options) => {
    const normalizedTarget = path.normalize(String(targetPath || ''));
    if (!injected && normalizedTarget === path.normalize(scenarioDir) && options && options.force === false) {
      injected = true;
      throw new Error('simulated delete failure');
    }
    return originalRmSync(targetPath, options);
  };

  try {
    const result = deleteScenario({
      civ3Path: civ3Root,
      scenarioPath
    });

    assert.equal(result.ok, false);
    assert.match(String(result.error || ''), /simulated delete failure/i);
    assert.ok(result.rollback);
    assert.equal(result.rollback.failed, 0);
    assert.equal(fs.existsSync(scenarioPath), true);
    assert.equal(fs.existsSync(markerPath), true);
    assert.equal(fs.readFileSync(markerPath, 'utf8'), 'keep\n');
  } finally {
    fs.rmSync = originalRmSync;
  }
});
