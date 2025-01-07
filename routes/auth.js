const express = require("express");
const router = express.Router();
const {
  getUser,
  forgotpassword,
  register,
  login,
  logout,
  resetpassword,
  updatedetails,
  updatepassword,
} = require("../controllers/auth");
const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/user", protect, getUser);
router.put("/updatedetails", protect, updatedetails);
router.put("/updatepassword", protect, updatepassword);
router.post("/forgotpassword", forgotpassword);
router.put("/resetpassword/:resettoken", resetpassword);

module.exports = router;
