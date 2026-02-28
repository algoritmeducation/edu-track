const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  tid:         { type: String, required: true },
  group:       { type: String, required: true, trim: true },
  lang:        { type: String, required: true, enum: ['HTML','CSS','JavaScript','React JS','Node JS'] },
  time:        { type: String, required: true },
  start:       { type: String, required: true },
  exam:        { type: String, required: true },
  students:    { type: Number, required: true, min: 1 },
  level:       { type: Number, required: true, min: 1 },
  doneInLevel: { type: Number, default: 0, min: 0 },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id; delete ret.__v;
      return ret;
    },
  },
});

module.exports = mongoose.models.Group || mongoose.model('Group', schema);