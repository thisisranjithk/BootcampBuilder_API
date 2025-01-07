const fs = require("fs");
const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv");
const BootCamp = require("./models/BootCamp");
const Course = require("./models/Course");
const Review = require("./models/Review");

// Load Env Variables
dotenv.config({ path: "./config/config.env" });

// connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Read Json file
const bootcamps = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/bootcamps.json`)
);
const courses = JSON.parse(fs.readFileSync(`${__dirname}/_data/courses.json`));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/_data/reviews.json`));

// Import into DB
const importData = async () => {
  try {
    await BootCamp.create(bootcamps);
    console.log("Bootcamp data imported successfully...".yellow.inverse);
    await Course.create(courses);
    console.log("Courses data imported successfully...".yellow.inverse);
    await Review.create(reviews);
    console.log("Reviews data imported successfully...".yellow.inverse);
    process.exit();
  } catch (error) {
    console.log(error.red);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await BootCamp.deleteMany();
    console.log("Bootcamp data deleted...".red.inverse);
    await Course.deleteMany();
    console.log("Course data deleted...".red.inverse);
    await Review.deleteMany();
    console.log("Review data deleted...".red.inverse);
    process.exit();
  } catch (error) {
    console.log(error.red);
  }
};

if (process.argv[2] === "-i") {
  importData();
} else if (process.argv[2] === "-d") {
  deleteData();
}
