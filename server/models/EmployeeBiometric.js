const mongoose = require("mongoose");

const employeeBiometricSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    descriptor: {
      type: [Number],
      required: true,
      validate: {
        validator: function (value) {
          return (
            Array.isArray(value) &&
            value.length === 128 &&
            value.every(
              (number) =>
                typeof number === "number" &&
                Number.isFinite(number)
            )
          );
        },
        message:
          "Face descriptor phải chứa đúng 128 số.",
      },
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },

    enrollmentVersion: {
      type: Number,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

employeeBiometricSchema.index({
  userId: 1,
  isActive: 1,
});

module.exports = mongoose.model(
  "EmployeeBiometric",
  employeeBiometricSchema
);