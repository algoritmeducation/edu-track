const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  hash: { type: String, required: true, select: false },
  subject: { type: [String], required: true, validate: { validator: v => Array.isArray(v) && v.length >= 1 && v.length <= 2, message: 'Must have 1 or 2 specializations' } },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id; delete ret.__v; delete ret.hash;
      return ret;
    },
  },
});

// Always recompile to avoid stale schema caching (e.g. on Render hot restarts)
if (mongoose.models.Teacher) mongoose.deleteModel('Teacher');
module.exports = mongoose.model('Teacher', schema);