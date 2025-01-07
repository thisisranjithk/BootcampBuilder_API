const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "Title is required"],
      maxlength: 100,
    },
    text: {
      type: String,
      min: 1,
      max: 10,
      required: [true, "Please add review text"],
    },
    rating: {
      type: Number,
      required: [true, "Please add a rating between 1 to 10"],
    },
    bootcamp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BootCamp",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Reverse populate with virtuals
ReviewSchema.virtual("bootcamps", {
  ref: "BootCamp",
  localField: "_id",
  foreignField: "bootcamp",
  justOne: false,
});

// Prevent user from submitting more then one review per bootcamp
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

//static method to calculate average Rating and save
ReviewSchema.statics.getAverageRating = async function (bootcampId) {
  const arr = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageCost: { $avg: "$rating" },
      },
    },
  ]);

  try {
    await this.model("BootCamp").findByIdAndUpdate(bootcampId, {
      averageRating: arr[0]?.averageCost || 0,
    });
  } catch (error) {
    console.log(error);
  }
};

// call getAverageCost after save
ReviewSchema.post("save", function (next) {
  this.constructor.getAverageRating(this.bootcamp);
});

// call getAverageCost before remove
ReviewSchema.post(
  "deleteOne",
  { document: true, query: false },
  function (next) {
    const bootcampId = this.bootcamp;
    this.model("Review").getAverageRating(bootcampId);
  }
);

const Review = mongoose.model("Review", ReviewSchema);

module.exports = Review;
