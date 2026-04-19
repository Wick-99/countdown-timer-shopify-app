import mongoose from "mongoose";

const { Schema } = mongoose;

const timerSchema = new Schema(
  {
    shop: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    promotionDescription: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    display: {
      color: { type: String, default: "#000000" },
      size: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "medium",
      },
      position: {
        type: String,
        enum: ["top", "inline", "bottom"],
        default: "top",
      },
    },
    urgency: {
      type: {
        type: String,
        enum: ["color_pulse", "banner", "none"],
        default: "color_pulse",
      },
      triggerMinutes: { type: Number, default: 5, min: 1, max: 60 },
    },
    scope: {
      type: {
        type: String,
        enum: ["all_products", "specific_products"],
        default: "all_products",
      },
      productIds: { type: [String], default: [] },
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for the "active timer" query the widget runs
timerSchema.index({ shop: 1, isDeleted: 1, enabled: 1, startAt: 1, endAt: 1 });

timerSchema.pre("validate", function () {
  if (this.endAt && this.startAt && this.endAt <= this.startAt) {
    this.invalidate("endAt", "endAt must be after startAt");
  }
});

export const NOT_DELETED_FILTER = { isDeleted: { $ne: true } };

export default mongoose.models.Timer || mongoose.model("Timer", timerSchema);
