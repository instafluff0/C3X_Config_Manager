const { parentPort, workerData } = require('node:worker_threads');

const { saveBundle, createScenario, deleteScenario } = require('./configCore');
const { auditBundle } = require('./bundleAudit');

function postMessage(type, payload = {}) {
  if (!parentPort) return;
  parentPort.postMessage({ type, ...payload });
}

function run() {
  if (!parentPort) return;
  const task = String(workerData && workerData.task || '').trim();
  const payload = workerData && workerData.payload ? workerData.payload : {};
  const onProgress = (entry) => {
    postMessage('progress', { entry });
  };

  try {
    let result;
    if (task === 'saveBundle') {
      result = saveBundle(payload, { onProgress });
    } else if (task === 'createScenario') {
      result = createScenario(payload, {
        onProgress: payload && payload.dryRun ? null : onProgress
      });
    } else if (task === 'deleteScenario') {
      result = deleteScenario(payload, {
        onProgress: payload && payload.dryRun ? null : onProgress
      });
    } else if (task === 'validateBundle') {
      result = auditBundle(payload);
    } else {
      throw new Error(`Unknown worker task: ${task || '(empty)'}`);
    }
    postMessage('result', { result });
  } catch (err) {
    postMessage('error', {
      error: err && err.message ? String(err.message) : 'Worker operation failed.'
    });
  }
}

run();
