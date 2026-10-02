const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
let captured;
let scenario = 'success';
class APIError extends Error { constructor(status) { super('provider error'); this.status = status; } }
class FakeOpenAI {
  static APIError = APIError;
  responses = { create: async input => {
    captured = input;
    if (scenario === 'quota') throw new APIError(429);
    return {
      controller: { abort() {} },
      async *[Symbol.asyncIterator]() {
        yield { type: 'response.output_text.delta', delta: 'Research suggests a small experiment.' };
        if (scenario === 'success') yield { type: 'response.completed', response: { id: 'resp_test' } };
        if (scenario === 'failed') yield { type: 'response.failed' };
      }
    };
  } };
}
const load = Module._load;
Module._load = function(name, ...args) { return name === 'openai' ? FakeOpenAI : load.call(this, name, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 }
}).outputText, filename);
const { POST } = require('../app/api/insights-chat/route.ts');
const request = body => new Request('http://localhost/api/insights-chat', { method: 'POST', body: JSON.stringify(body) });
(async () => {
  process.env.OPENAI_API_KEY = 'test-only';
  let response = await POST(request({ message: 'Question', responseId: 'resp_previous', fileIds: ['file-example'] }));
  assert.equal(response.status, 200);
  let body = await response.text();
  assert.match(body, /Research suggests/);
  assert.match(body, /"done":true/);
  assert.equal(captured.previous_response_id, 'resp_previous');
  assert.equal(captured.input[0].content[1].file_id, 'file-example');
  scenario = 'failed';
  body = await (await POST(request({ message: 'Question' }))).text();
  assert.match(body, /interrupted/);
  assert.doesNotMatch(body, /"done":true/);
  scenario = 'incomplete';
  assert.match(await (await POST(request({ message: 'Question' }))).text(), /interrupted/);
  scenario = 'quota';
  assert.equal((await POST(request({ message: 'Question' }))).status, 429);
  assert.equal((await POST(request({ message: '' }))).status, 400);
  assert.equal((await POST(request({ message: 'Question', fileIds: ['demo-file'] }))).status, 400);
  delete process.env.OPENAI_API_KEY;
  assert.equal((await POST(request({ message: 'Question' }))).status, 503);
  console.log('PASS: response streaming, follow-up, file input, provider failure, incomplete stream, quota, validation, and missing configuration');
})().catch(error => { console.error(error); process.exitCode = 1; });
