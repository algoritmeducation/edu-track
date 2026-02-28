const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  hash:     { type: String, required: true, select: false },
  subject:  { type: String, required: true, trim: true },
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

module.exports = mongoose.models.Teacher || mongoose.model('Teacher', schema);