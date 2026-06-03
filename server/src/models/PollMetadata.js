import mongoose from "mongoose";

const PollMetadataSchema = new mongoose.Schema(
  {
    pollId: {
      type: Number,
      required: true,
      min: 0,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options) => Array.isArray(options) && options.filter(Boolean).length >= 2,
        message: "At least two options are required"
      }
    },
    deadline: {
      type: Number,
      required: true,
      min: 1
    },
    contentHash: {
      type: String,
      required: true,
      lowercase: true,
      match: /^0x[a-f0-9]{64}$/
    },
    txHash: {
      type: String,
      required: true,
      lowercase: true,
      match: /^0x[a-f0-9]{64}$/
    }
  },
  { timestamps: true }
);

PollMetadataSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  }
});

export const PollMetadata = mongoose.model("PollMetadata", PollMetadataSchema);
