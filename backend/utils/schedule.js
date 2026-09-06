const PLANTS = ['wider', 'utility', 'hsu', 'narrow-flat', 'narrow-tube'];
const STATUSES = {
  objective: ['Pending', 'In Progress', 'Completed'],
  audit: ['Planned', 'In Progress', 'Completed'],
  meeting: ['Planned', 'Completed'],
  action: ['Pending', 'In Progress', 'Completed', 'Verified'],
};
const FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
function text(value, label, max = 4000, required = false) {
  if (value == null) value = '';
  if (typeof value !== 'string' || value.length > max) fail(`${label} must be text, up to ${max} characters.`);
  value = value.trim();
  if (required && !value) fail(`${label} is required.`);
  return value;
}
function date(value, label, required = false) {
  value = text(value, label, 10, required);
  if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) fail(`${label} must be a valid date.`);
  return value;
}
function number(value, label) {
  value = text(value == null ? '' : String(value), label, 40);
  if (value && !Number.isFinite(Number(value))) fail(`${label} must be a number.`);
  return value;
}
function files(input = [], existing = []) {
  if (!Array.isArray(input) || input.length > 3) fail('Attach up to 3 files, maximum 1 MB each.');
  const seen = new Set();
  return input.map(file => {
    if (!file || !ID.test(file.id || '') || seen.has(file.id)) fail('Invalid or duplicate attachment.');
    seen.add(file.id);
    const retained = existing.find(item => item.id === file.id);
    if (retained) return { id: retained.id, name: retained.name, mime: retained.mime, size: retained.size, data: retained.data };
    const name = text(file.name, 'File name', 160, true).replace(/[\r\n/\\]/g, '_');
    if (!FILE_TYPES.includes(file.mime)) fail('Use PNG, JPEG, WebP, PDF, TXT, DOCX or XLSX files.');
    if (typeof file.data !== 'string' || file.data.length > 1400000 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.data)) fail('Invalid attachment data.');
    const bytes = Buffer.from(file.data, 'base64');
    if (!bytes.length || bytes.length > 1024 * 1024) fail('Each file must be between 1 byte and 1 MB.');
    return { id: file.id, name, mime: file.mime, size: bytes.length, data: file.data };
  });
}
function normalize(input, existing) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Invalid schedule record.');
  const kind = existing?.kind || input.kind;
  if (!Object.hasOwn(STATUSES, kind || '') || (existing && input.kind !== existing.kind)) fail('Invalid record category.');
  if (!STATUSES[kind].includes(input.status)) fail('Invalid status for this category.');
  const result = {
    kind, status: input.status,
    title: text(input.title, 'Title', 180, true),
    owner: text(input.owner, kind === 'audit' ? 'Auditor' : 'Responsible person', 120, true),
    date: date(input.date, kind === 'objective' || kind === 'action' ? 'Due date' : 'Scheduled date', true),
    description: text(input.description, 'Details'),
    equipment: text(input.equipment, 'Equipment / department', 180),
    baseline: number(input.baseline, 'Baseline'), target: number(input.target, 'Target'), actual: number(input.actual, 'Current value'),
    unit: text(input.unit, 'Unit', 40), direction: input.direction === 'higher' ? 'higher' : 'lower',
    findings: text(input.findings, 'Findings'), attendees: text(input.attendees, 'Attendees', 1000),
    decisions: text(input.decisions, 'Decisions'), nextDate: date(input.nextDate, 'Next meeting date'),
    correctiveAction: text(input.correctiveAction, 'Corrective action', 4000, kind === 'action'),
    sourceId: text(input.sourceId, 'Linked record', 36),
    attachments: files(input.attachments, existing?.attachments),
  };
  if (kind === 'objective' && result.target === '') fail('Target is required.');
  if (result.nextDate && result.nextDate < result.date) fail('Next meeting cannot be before this meeting.');
  if (result.sourceId && (!ID.test(result.sourceId) || kind !== 'action')) fail('Invalid linked record.');
  if (kind === 'action' && result.status === 'Verified' && existing?.status !== 'Completed' && existing?.status !== 'Verified') fail('Complete the action before verifying it in a meeting.');
  return result;
}
function publicItem(item) {
  return { ...item, attachments: (item.attachments || []).map(({ data, ...metadata }) => metadata) };
}
function changeList(before, after) {
  return Object.keys(after).filter(key => key === 'attachments'
    ? JSON.stringify((before?.attachments || []).map(f => f.id)) !== JSON.stringify(after.attachments.map(f => f.id))
    : (before?.[key] ?? '') !== after[key]);
}
module.exports = { PLANTS, STATUSES, ID, fail, text, normalize, publicItem, changeList };
