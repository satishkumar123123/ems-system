const express = require('express');
const mongoose = require('mongoose');
const { PLANTS, ID, fail, text, normalize, publicItem, changeList } = require('../utils/schedule');
const router = express.Router();
const attachment = new mongoose.Schema({ id: String, name: String, mime: String, size: Number, data: String }, { _id: false });
const history = new mongoose.Schema({ at: Date, by: String, note: String, status: String, actual: String, meetingId: String, changes: [String] }, { _id: false });
const schema = new mongoose.Schema({
  _id: String, plant: { type: String, enum: PLANTS, required: true, index: true },
  kind: String, title: String, owner: String, date: String, status: String,
  description: String, equipment: String, baseline: String, target: String, actual: String,
  unit: String, direction: String, findings: String, attendees: String, decisions: String,
  nextDate: String, correctiveAction: String, sourceId: String,
  attachments: [attachment], history: [history], revision: { type: Number, default: 0 },
}, { timestamps: true });
schema.index({ plant: 1, date: 1 });
const Item = mongoose.models.ScheduleItem || mongoose.model('ScheduleItem', schema);
router.param('plant', (req, res, next, plant) => PLANTS.includes(plant) ? next() : res.status(404).json({ error: 'Unknown plant.' }));
router.param('id', (req, res, next, id) => ID.test(id) ? next() : res.status(400).json({ error: 'Invalid record ID.' }));
const handle = fn => async (req, res) => { try { await fn(req, res); } catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'Schedule could not be saved or loaded. Please retry.' }); } };
router.get('/:plant', handle(async (req, res) => {
  const items = await Item.find({ plant: req.params.plant }).select('-attachments.data').sort({ date: 1, createdAt: 1 }).lean();
  res.json({ plant: req.params.plant, items });
}));
async function linkedRecords(plant, data, body, previous) {
  if (data.sourceId) {
    const source = await Item.findOne({ _id: data.sourceId, plant }).lean();
    if (!source || !['objective', 'audit', 'meeting'].includes(source.kind)) fail('Choose a linked record from this plant.');
  }
  const meetingId = text(body.reviewMeetingId, 'Review meeting', 36);
  if (meetingId) {
    if (!ID.test(meetingId) || data.kind !== 'action') fail('Only improvement actions can be reviewed in a meeting.');
    const meeting = await Item.findOne({ _id: meetingId, plant, kind: 'meeting' }).lean();
    if (!meeting) fail('Choose a review meeting from this plant.');
    text(body.updatedBy, 'Reviewer', 120, true);
    text(body.updateNote, 'Review outcome', 2000, true);
  }
  if (data.kind === 'action' && data.status === 'Verified' && previous?.status !== 'Verified' && !meetingId) fail('Select a review meeting to verify the improvement.');
  return meetingId;
}
function event(body, data, meetingId, previous) {
  return { at: new Date(), by: text(body.updatedBy, 'Updated by', 120, true), note: text(body.updateNote, 'Update / review notes', 2000), status: data.status, actual: data.actual, meetingId, changes: changeList(previous, data) };
}
router.post('/:plant/items', handle(async (req, res) => {
  const plant = req.params.plant;
  if (!ID.test(req.body?.id || '')) fail('Invalid record ID.');
  const existing = await Item.findById(req.body.id).select('-attachments.data').lean();
  if (existing) {
    if (existing.plant !== plant) fail('Record ID is already in use.', 409);
    return res.json({ item: publicItem(existing) });
  }
  const data = normalize(req.body);
  const meetingId = await linkedRecords(plant, data, req.body);
  const item = await Item.create({ _id: req.body.id, plant, ...data, revision: 0, history: [event(req.body, data, meetingId)] });
  res.status(201).json({ item: publicItem(item.toObject()) });
}));
router.patch('/:plant/items/:id', handle(async (req, res) => {
  const plant = req.params.plant;
  const previous = await Item.findOne({ _id: req.params.id, plant }).lean();
  if (!previous) fail('Record not found in this plant.', 404);
  if (!Number.isInteger(req.body?.revision) || req.body.revision !== previous.revision) fail('This record changed. Close the form, refresh, and reopen it before saving.', 409);
  const data = normalize(req.body, previous);
  const meetingId = await linkedRecords(plant, data, req.body, previous);
  const item = await Item.findOneAndUpdate({ _id: req.params.id, plant, revision: previous.revision },
    { $set: data, $inc: { revision: 1 }, $push: { history: event(req.body, data, meetingId, previous) } }, { new: true, runValidators: true }).lean();
  if (!item) fail('Another update was saved first. Refresh and reopen this record.', 409);
  res.json({ item: publicItem(item) });
}));
router.get('/:plant/items/:id/files/:fileId', handle(async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, plant: req.params.plant }).lean();
  const file = item?.attachments.find(f => f.id === req.params.fileId);
  if (!file) fail('Attachment not found.', 404);
  res.set('Content-Type', file.mime);
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Cache-Control', 'no-store');
  res.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
  res.send(Buffer.from(file.data, 'base64'));
}));
module.exports = router;
