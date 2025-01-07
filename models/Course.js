const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a course title"],
      trim: true,
      maxlength: [50, "course title can not be more than 50 characters"],
    },
    description: {
      type: String,
      required: [true, "course description field is required"],
    },
    weeks: {
      type: String,
      required: [true, "Please add number of weeks"],
    },
    tuition: {
      type: Number,
      required: [true, "please add a tuition fees"],
    },
    minimumSkill: {
      type: String,
      required: [true, "please a minimum skill level"],
      enum: ["beginner", "intermediate", "advanced"],
    },
    scholarhipsAvailable: {
      type: Boolean,
      default: false,
    },
    bootcamp: {
      type: mongoose.Schema.ObjectId,
      ref: "BootCamp",
      required: [true, "Bootcamp Id is required"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "User Id is required"],
    },
  },
  {
    timestamps: true,
  }
);

//static method to calculate average cost of tuitions
CourseSchema.statics.getAverageCost = async function (bootcampId) {
  const arr = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageCost: { $avg: "$tuition" },
      },
    },
  ]);

  // console.log(
  //   `Calculating average cost... ${Math.ceil(arr[0]?.averageCost) || 0}`
  // );

  try {
    await this.model("BootCamp").findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(arr[0]?.averageCost) || 0,
    });
  } catch (error) {
    console.log(error);
  }
};

// call getAverageCost after save
CourseSchema.post("save", function (next) {
  this.constructor.getAverageCost(this.bootcamp);
});

// call getAverageCost before remove
CourseSchema.post(
  "deleteOne",
  { document: true, query: false },
  function (next) {
    const bootcampId = this.bootcamp;
    this.model("Course").getAverageCost(bootcampId);
  }
);

module.exports = mongoose.model("Course", CourseSchema);
