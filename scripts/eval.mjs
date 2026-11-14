import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';

const base = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const cases = [
  ['Sunscreen prevents skin cancer.', 'positive'],
  ['Collagen supplements improve skin elasticity.', 'positive'],
  ['Melatonin improves sleep quality.', 'positive'],
  ['Creatine increases muscle strength.', 'positive'],
  ['Exercise reduces depression.', 'positive'],
  ['Niacinamide reduces hyperpigmentation.', 'positive'],
  ['Vitamin C prevents the common cold.', 'not_positive'],
  ['Celery juice cures eczema.', 'not_positive'],
  ['Vaccines cause autism.', 'not_positive'],
  ['Apple cider vinegar detoxes your liver.', 'not_positive'],
  ['Coffee causes cancer.', 'not_positive'],
  ['Rosemary oil regrows hair as well as minoxidil.', 'not_positive'],
];
const positive = new Set(['supported', 'partially_supported']);
const verdicts = new Set([...positive, 'insufficient_evidence', 'misleading', 'contradicted']);
const rows = [];
const modes = new Set();
for (const [text, expected] of cases) {
  if (rows.length) await pause(1500);
  const started = performance.now();
  let first = null;
  let report = null;
  let error = null;
  try {
    const res = await fetch(`${base}/api/v1/claims/analyze`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, content_type: 'text' }), signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const decoder = new TextDecoder();
    let buffer = '';
    const consume = (line) => {
      if (!line.trim()) return;
      const event = JSON.parse(line);
      switch (event.type) {
        case 'stage': case 'claims': break;
        case 'claim_done': if (event.index === 0) first = event.result; break;
        case 'done': report = event.report; break;
        case 'error': throw new Error(`${event.code}: ${event.message}`);
        default: throw new Error(`Unknown stream event: ${event.type}`);
      }
    };
    for await (const chunk of res.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) consume(line);
    }
    buffer += decoder.decode();
    consume(buffer);
    if (!report) throw new Error('Stream ended without a done report');
    modes.add(report.model_metadata.assessor);
    first = report.claims[0] ?? first;
    if (!verdicts.has(first?.assessment?.verdict)) throw new Error('No valid first-claim assessment');
  } catch (err) { error = err instanceof Error ? err.message : String(err); }
  const a = error ? null : first.assessment;
  const verdict = a?.verdict ?? 'ERROR';
  rows.push({ text, expected, verdict, strength: a?.strength_label ?? '—',
    supporting: a?.supporting_source_ids.length ?? '—', contradicting: a?.contradictory_source_ids.length ?? '—',
    pass: !error && (positive.has(verdict) ? 'positive' : 'not_positive') === expected,
    latency: performance.now() - started, error });
}
const cell = (v) => String(v).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
const table = [
  '| Claim | Expected | Verdict | strength_label | #supporting | #contradicting | Pass |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map((r) => `| ${[r.text, r.expected, r.verdict, r.strength, r.supporting, r.contradicting, r.pass ? 'yes' : 'no'].map(cell).join(' | ')} |`),
].join('\n');
const errors = rows.filter((r) => r.error);
const metrics = `- Direction accuracy: ${rows.filter((r) => r.pass).length}/${rows.length} (${(100 * rows.filter((r) => r.pass).length / rows.length).toFixed(1)}%)\n- False certainty count (expected not_positive, got positive): ${rows.filter((r) => r.expected === 'not_positive' && positive.has(r.verdict)).length}\n- Abstention count (insufficient_evidence): ${rows.filter((r) => r.verdict === 'insufficient_evidence').length}\n- Mean latency: ${(rows.reduce((sum, r) => sum + r.latency, 0) / rows.length / 1000).toFixed(2)} s (requests including failures; excludes pauses)\n- Request/protocol errors: ${errors.length} (counted as failed cases)`;
const markdown = `# VetoHealth evaluation\n\nDate: ${new Date().toISOString()}\n\nMode (report.model_metadata.assessor): ${[...modes].map(cell).join(', ') || 'unavailable'}\n\n${table}\n\n${metrics}\n\n${errors.length ? `## Request errors\n\n${errors.map((r) => `- ${cell(r.text)}: ${cell(r.error)}`).join('\n')}\n\n` : ''}## Limitations of this eval\n\nThese are 12 hand-picked claims with direction labels assigned by the team, not an expert benchmark. Spec §9.2 asks for 300+ expert-labelled claims. This measures only the first extracted claim and broad direction, not clinical accuracy, citation validity, or safety. Abstention passes a not_positive case and can inflate accuracy; inspect the abstention count. Retrieval and AI availability can change results. Reported assessor metadata may describe the configured model even when individual claims fall back to rules. Source counts reflect returned stance IDs, not necessarily proof-quality studies. Free-tier quotas and network failures affect latency and coverage.\n`;
await mkdir(new URL('../docs/', import.meta.url), { recursive: true });
await writeFile(new URL('../docs/EVAL.md', import.meta.url), markdown);
console.log(`${table}\n\n${metrics}`);
if (errors.length) process.exitCode = 1;
