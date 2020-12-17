require("express-group-routes");
// require("./dbcon");
const mongoose = require("mongoose");
const { MongoDB } = require("./config/config");

const express = require("express");
const { APIServer } = require("./config/config");
const auth = require("./middleware/Authentication");
const home = require("./controllers/home");

const server = express();
server.use(express.json());
server.use((req, res, next) => {
  if (
    req.headers["site-destination"] === "" ||
    !req.headers["site-destination"]
  )
    return res.json({ status: 500, message: "cannot" });

  const db = req.headers["site-destination"];

  mongoose
    .connect(`mongodb://${MongoDB.user}:${MongoDB.pwd}@${MongoDB.host}/${db}`, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      poolSize: 2,
    })
    .then(() => {
      console.log(`Connected to ${db}.`);

      return next();
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        status: 500,
        message: err.message,
      });
    });
});

server.group("/api/v3", (router) => {
  router.use("/", home);
});

server.listen(APIServer.port, () => {
  console.log("Server is running on http://localhost:3000");
});
