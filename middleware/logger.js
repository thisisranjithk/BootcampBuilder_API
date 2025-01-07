const logger = (req, res, next) => {
  // req.hello = "Hello World";
  //   console.log("Hellow from Middleare");
  console.log(
    `${req.method} ${req.protocol}://${req.get("host")}${req.originalUrl} `
  );
  next();
};

module.exports = logger;
