// Partially based on https://github.com/carloslfu/tauri-deno-example/blob/5ee3c18d441357fbfca712cf998389ebb0025044/src-tauri/src/deno/bootstrap.js

import { return_value, document_dir } from 'ext:core/ops';

function returnValue(value) {
  return_value(globalThis.RuntimeExtension.taskId, JSON.stringify(value));
}

function documentDir() {
  return document_dir();
}

globalThis.RuntimeExtension = { returnValue, documentDir };
