const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/asyncHandler");
const Course = require("../models/Course");
const BootCamp = require("../models/BootCamp");

// Description: Get all Courses
// Route: GET /api/v1/courses/
// Route: GET /api/v1/bootcamps/:bootcampId/courses
// Access: Public
exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// Description: Get single Course
// Route: GET /api/v1/courses/:id
// Access: Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!course) {
    return next(
      new ErrorResponse(`Course was not found with Id  ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, count: course.length, data: course });
});

// Description: Add a Course
// Route: POST /api/v1/bootcamps/:bootcampId/courses
// Access: Private
exports.addCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;

  const bootcamp = await BootCamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp was not found with that Id ${req.params.bootcampId}`,
        404
      )
    );
  }

  // Add user id to the req.body
  req.body.user = req.user.id;

  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ID ${req.user.id} is unauthorized to add the Course`,
        403
      )
    );
  }

  const course = await Course.create(req.body);
  res.status(200).json({
    success: true,
    message: "Course created successfully",
    data: course,
  });
});

// Description: Update a Course
// Route: PUT /api/v1/courses/:id
// Access: Private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(
        `No Course was not found with that Id ${req.params.id}`,
        404
      )
    );
  }

  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ID ${req.user.id} is unauthorized to update the Course`,
        403
      )
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Updated successfully",
    data: course,
  });
});

// Description: Delete a Course
// Route: DELETE /api/v1/courses/:id
// Access: Private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res
      .status(404)
      .json({ success: false, message: "No document found in that Id" });
  }

  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ID ${req.user.id} is unauthorized to Delete the Course`,
        403
      )
    );
  }

  await course.deleteOne();

  res.status(200).json({
    success: true,
    message: "Course deleted successfully",
  });
});
