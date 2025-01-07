const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/asyncHandler");
const sendMail = require("../utils/sendMail");
const User = require("../models/User");

// Description:  Register User
// Route: POST /api/v1/auth/register
// Access: Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const user = await User.create({
    username: name,
    email,
    password,
    role,
  });

  SendCookieTokenResponse(user, 200, res, "User Registered successfully");
});

// Description:  Login User
// Route: POST /api/v1/auth/login
// Access: Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email) {
    return next(new ErrorResponse("Please provide the email", 404));
  }

  if (!password) {
    return next(new ErrorResponse("Please provide the password", 404));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid Credentials", 401));
  }

  // MatchPassword Middleware method
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid Credentials", 401));
  }

  SendCookieTokenResponse(user, 200, res, "User LoggedIn successfully");
});

// Description:  Logout User
// Route: GET /api/v1/auth/logout
// Access: Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
  });
  res.status(200).json({
    success: true,
    message: "User loggedOut successfully",
  });
});

// Description:  Get User
// Route: GET /api/v1/auth/user
// Access: Private
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});

// Description:  Forgot password
// Route: POST /api/v1/auth/forgotpassword
// Access: Public
exports.forgotpassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new ErrorResponse(`User not found with email:${req.body.email}`, 404)
    );
  }

  // Get Reset token
  const resetToken = user.getResetPasswordToken();

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you have requested for reset password. Please make a put request to: \n\n ${resetUrl}`;

  try {
    await sendMail({
      email: req.body.email,
      subject: "Password Reset Token",
      message,
    });

    res.status(200).json({
      success: true,
      data: "Email was sent",
    });
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
  }

  await user.save({ validateBeforeSave: false });
});

// Description:  Reset Password
// Route: PUT /api/v1/auth/resetpassword/:resettoken
// Access: Publich
exports.resetpassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse("Invalid Token", 400));
  }

  // set New Password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  SendCookieTokenResponse(user, 200, res, "Password Reset successfull");
});

// Description:  Update User details
// Route: PUT /api/v1/auth/updatedetails
// Access: Private
exports.updatedetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    username: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// Description: Update password
// Route: PUT /api/v1/auth/updatepassword
// Access: Private
exports.updatepassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Old password is incorrect ", 401));
  }

  user.password = req.body.newPassword;
  await user.save();
  SendCookieTokenResponse(user, 200, res, "Password updated successfully");
});

// Get token from model and create cookie and send as response
const SendCookieTokenResponse = (user, statusCode, res, message) => {
  // Generate Token
  const token = user.getSignedJwtToken();

  //Cookie parser options
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    token,
  });
};
