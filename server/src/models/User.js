import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // `name` is kept because the existing Register form collects it.
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true, versionKey: false },
);

export function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email };
}

export default mongoose.models.User || mongoose.model('User', userSchema);
