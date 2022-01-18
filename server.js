const fs = require("fs");
const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const { Expo } = require("expo-server-sdk");
const { initializeApp, applicationDefault, cert } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const serviceAccount = require("./serviceAccountKey.json");
// const _uri = "http://localhost:4002/expo-test-336102/us-central1/app/api/v1/";
const _uri = "https://us-central1-expo-test-336102.cloudfunctions.net/app/api/v1/";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(cors());

initializeApp({
  credential: cert(serviceAccount),
});

// const db = getFirestore();

app.listen(3003, () => {
  console.log("Application started and Listening on port 3003");
});

// server your css as static
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/home", (req, res) => {
  console.info("/home ", req.headers.authorization);
  res.sendFile(__dirname + "/home.html");
});

app.post("/", (req, res) => {
  res.send("Thank you for subscribing");
});

app.get("/webview-config-url", function (req, res) {
  console.log("webview-config-url");
  // res.send("https://coinmarketcap.com/");
  // res.send("https://www.binance.com/vi/trade/BTC_USDT");
  res.send("http://localhost:3003");
  // res.send("https://www.mexc.com/exchange/RACA_USDT");
});

app.post("/google_login", (req, res) => {
  console.info("google_login ", req.body);
  handleSignInGoogle(req.body, res);
});

app.get("/read-firestore", (req, res) => {
  console.info("read-firestore ", req.body);
  readFireStore(res);
});

app.post("/push-notify", async (req, res) => {
  console.log("==================================== push-notify: req.body");
  console.log(req.body);
  console.log("====================================");

  try {
    axios
      .post(_uri + "push-notify", req.body)
      .then((response) => {
        if (response && response.status === 200) {
          console.log("====================================push-notify: response");
          console.log(response);
          console.log("====================================");

          res.send({
            status: true,
            data: response.data,
          });
        } else {
          res.send({
            status: false,
            data: {},
          });
        }
      })
      .catch((err) => {
        res.send({
          status: false,
          data: {},
          msg: err.toString(),
        });
      });
  } catch (e) {
    console.log("==================================== push-notify: catch");
    console.log(e);
    console.log("====================================");

    res.send({
      status: false,
      data: {},
      msg: e.toString(),
    });
  }
});

app.post("/update-notify-data", async (req, res) => {
  console.log("==================================== update-notify-data: req.body");
  console.log(req.body);
  console.log("====================================");
  try {
    axios
      .post(_uri + "update-notify-data", req.body)
      .then((response) => {
        console.log("==================================== update-notify-data: response");
        console.log(response);
        console.log("====================================");

        if (response && response.status === 200) {
          res.send({
            status: true,
            data: response.data,
          });
        } else {
          res.send({
            status: false,
            data: {},
          });
        }
      })
      .catch((err) => {
        res.send({
          status: false,
          data: {},
          msg: err.toString(),
        });
      });
  } catch (e) {
    console.log("==================================== update-notify-data: catch");
    console.log(e);
    console.log("====================================");

    res.send({
      status: false,
      data: {},
      msg: e.toString(),
    });
  }
});

app.post("/update-notify-status", async (req, res) => {
  console.log("==================================== update-notify-status: req.body");
  console.log(req.body);
  console.log("====================================");
  try {
    axios
      .post(_uri + "update-notify-status", req.body)
      .then((response) => {
        console.log("==================================== update-notify-status: response");
        console.log(response);
        console.log("====================================");

        if (response && response.status === 200) {
          res.send({
            status: true,
            data: response.data,
          });
        } else {
          res.send({
            status: false,
            data: {},
          });
        }
      })
      .catch((err) => {
        res.send({
          status: false,
          data: {},
          msg: err.toString(),
        });
      });
  } catch (e) {
    console.log("==================================== update-notify-status: catch");
    console.log(e);
    console.log("====================================");

    res.send({
      status: false,
      data: {},
      msg: e.toString(),
    });
  }
});

async function handleSignInGoogle(req, res) {
  console.log("==================================== handleSignInGoogle");
  console.log(req);
  console.log("====================================");

  try {
    const userInfo = await axios.get("https://www.googleapis.com/userinfo/v2/me", {
      headers: { Authorization: `Bearer ${req.token}` },
    });

    if (userInfo && userInfo.status === 200) {
      fs.readFile("./db.txt", "utf8", (err, database) => {
        if (err) {
          res.send({
            status: false,
            msg: "Read database failed",
          });
        }

        let arr = [];
        let flagExist = false;
        if (database) {
          arr = JSON.parse(database);
          arr.forEach((element) => {
            console.log("==================================== element");
            console.log(element);
            console.log("==================================== req.email");
            console.log(req.email);

            if (element.email === req.email) {
              flagExist = true;
            }
          });
          arr.push(req);
        } else {
          arr.push(req);
        }
        console.log("==================================== flagExist");
        console.log(flagExist);
        console.log("====================================");

        if (flagExist) {
          res.send({
            status: true,
            jwt: "1234567890",
            uri: "http://10.0.12.111:3003/home",
            email: req.email,
            msg: "User has exist",
          });
        } else {
          handleWriteFile("./db.txt", arr, res);
        }
      });
    } else {
      res.send({
        status: false,
        msg: "Firebase verified_email is " + userInfo.data.verified_email,
      });
    }
  } catch (e) {
    console.error("handleSignInGoogle", e);
    res.send({
      status: false,
      msg: "handleSignInGoogle catch" + e.messages,
    });
  }
}

function handleWriteFile(path, data, res) {
  fs.writeFile(path, JSON.stringify(data), (err) => {
    if (err) {
      console.log("==================================== err");
      console.log(err);
      console.log("====================================");

      res.send({
        status: false,
        msg: "Write file failed",
      });
    }

    console.log("The file was saved!");

    res.send({
      status: true,
      jwt: "1234567890",
      uri: "http://10.0.12.111:3003/home",
      email: data.email,
      msg: "Database is empty",
    });
  });
}
