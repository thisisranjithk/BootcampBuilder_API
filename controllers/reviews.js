const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/asyncHandler");
const Review = require("../models/Review");
const BootCamp = require("../models/BootCamp");

// Description: Get all Reviews
// Route: GET /api/v1/reviews/
// Route: GET /api/v1/bootcamps/:bootcampId/reviews
// Access: Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const reviews = await Review.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// Description: Get Single Reviews
// Route: GET /api/v1/reviews/:id
// Access: Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No Review Found with given id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: review,
  });
});

// Description: Add Reviews
// Route: POST /api/v1/reviews/:id
// Access: Private
exports.addReview = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;

  const bootcamp = await BootCamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp is not found with given Id:${req.params.bootcampId}`,
        404
      )
    );
  }

  // check user is already added review
  const existingReview = await Review.findOne({
    bootcamp: req.params.bootcampId,
    user: req.user.id,
  });

  if (existingReview) {
    return next(
      new ErrorResponse(
        `The user:${req.user.id} is already added review to this particular bootcamp:${req.params.bootcampId}`,
        400
      )
    );
  }

  // Add user id to review
  req.body.user = req.user.id;

  // Add a review to the database
  const review = await Review.create(req.body);
  res.status(201).json({
    success: true,
    data: review,
  });
});

// Description: Update Review
// Route: PUT /api/v1/reviews/:id
// Access: Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No Review Found with this Id:${req.params.id}`, 404)
    );
  }

  // Make sure review owner and admin only update
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        "Unauthorized to edit review, only review Owner or Admin can edit",
        400
      )
    );
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: review,
  });
});

// Description: Delete Review
// Route: DELETE /api/v1/reviews/:id
// Access: Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No Review Found with this Id:${req.params.id}`, 404)
    );
  }

  // Make sure review owner and admin only update
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        "Unauthorized to delete review, only review Owner or Admin can Delete",
        400
      )
    );
  }

  review = await Review.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});
