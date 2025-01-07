const path = require("path");
const BootCamp = require("../models/BootCamp");
const asyncHandler = require("../middleware/asyncHandler");
const ErrorResponse = require("../utils/errorResponse");

// Description: Get all Bootcamps
// Route: GET /api/v1/bootcamps
// Access: Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// Description: Get single Bootcamp
// Route: GET /api/v1/bootcamps/:id
// Access: Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await BootCamp.findById(req.params.id).populate({
    path: "courses",
    select: "title description",
  });

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp was not found with Id of ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({ success: true, data: bootcamp });
});

// Description: Create a Bootcamp
// Route: POST /api/v1/bootcamps/
// Access: Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  // Add User Id to the req.body
  req.body.user = req.user.id;

  //Check for published bootcamp
  const publishedBootcamp = await BootCamp.findOne({ user: req.user.id });

  // If the user is not an "Admin", then can add only one bootcamp
  if (publishedBootcamp && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `The user with ID ${req.user.id} had already published a bootcamp`,
        400
      )
    );
  }

  const bootcamp = await BootCamp.create(req.body);
  res.status(201).json({
    success: true,
    data: bootcamp,
  });
});

// Description: Update a Bootcamp
// Route: PUT /api/v1/bootcamps/:id
// Access: Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await BootCamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with user ID ${req.params.id}`, 404)
    );
  }

  // Make sure user is Bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ID ${req.params.id} is unauthorized to update the bootcamp`,
        403
      )
    );
  }

  bootcamp = await BootCamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: bootcamp });
});

// Description: Delete a Bootcamp
// Route: DELETE /api/v1/bootcamps/:id
// Access: Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await BootCamp.findById(req.params.id);
  if (!bootcamp) {
    return res
      .status(404)
      .json({ success: false, message: "No document found in that Id" });
  }

  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ID ${req.params.id} is unauthorized to Delete the bootcamp`,
        403
      )
    );
  }
  await bootcamp.deleteOne();
  res.status(200).json({
    success: true,
    message: "Bootcamp has been deleted successfully",
  });
});

// Description: Upload image for Bootcamp
// Route: PUT /api/v1/bootcamps/:id/image
// Access: Private
exports.bootcampImageUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await BootCamp.findById(req.params.id);
  if (!bootcamp) {
    return res
      .status(404)
      .json({ success: false, message: "No document found in that Id" });
  }

  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ID ${req.params.id} is unauthorized to Upload bootcamp Image`,
        403
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse("Please upload the file", 404));
  }

  const file = req.files.file;

  // Make sure the image type
  if (!file?.mimetype.startsWith("image")) {
    return next(
      new ErrorResponse(
        "Invalid file format, try to upload the file of Jpeg,png,webp,jpg",
        400
      )
    );
  }

  // File Upload size limit
  if (file?.size >= process.env.MEX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload a file below ${process.env.MEX_FILE_UPLOAD} Bytes`,
        400
      )
    );
  }

  // Create a custom name
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.log(err);
      return next(new ErrorResponse(`Error Uploading file, Try Again`, 500));
    }

    await BootCamp.findByIdAndUpdate(req.params.id, {
      image: file.name,
    });

    res.status(200).json({
      success: true,
      message: "Image Uploaded successfully",
      data: file.name,
    });
  });
});
