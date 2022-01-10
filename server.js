const fs = require("fs");
const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const { Expo } = require("expo-server-sdk");
const { initializeApp, applicationDefault, cert } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");
const constants = require("./global");
const serviceAccount = require("./serviceAccountKey.json");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(cors());

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

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
  res.send("http://10.0.12.111:3003");
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

app.post("/push-notify", (req, res) => {
  // console.info("send-mess ", req.body);
  res.send(sendMess(req.body));
});

app.post("/update-notify-status", (req, res) => {
  console.info("update-notify-status ", req.body);
  updateNotifyStatus(req.body, res);
});

async function updateNotifyStatus(req, res) {
  const resp = await axios.post("http://localhost:4002/expo-test-336102/us-central1/api/update-notify-status", req);
  console.log("🚀 ~ file: server.js ~ line 75 ~ updateNotifyStatus ~ resp", resp);
  if (res && res.status === 200) {
    res.send(resp.data);
  }
}

async function handleSignInGoogle(req, res) {
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
            console.log("==================================== req.user.email");
            console.log(req.user.email);

            if (element.user.email === req.user.email) {
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
            uri: "home",
            email: req.user.email,
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
      uri: "home",
      email: data.user.email,
      msg: "Database is empty",
    });
  });
}

async function readFireStore(res) {
  try {
    const send = await axios.post("https://us-central1-expo-test-336102.cloudfunctions.net/api/write-firestore", {
      user: "devfsoft06",
      fieldName: "nixphone",
      deviceId: "7DDA332B-19AE-4820-900C-E325B8994C0C",
      devicePush: "90f0d83c2576727eea7816b3a153741de321cf362cabb14721c409de8a87cc15",
      expoPush: "ExponentPushToken[gh3ouKEdYC3FqRVn3P4cFa]",
    });

    console.log("==================================== readFireStore");
    console.log(send);
    console.log("====================================");

    res.send(send);
  } catch (e) {
    console.error("onClickBntTest ", e);
    res.send(false);
  }
}

async function sendMess(req, res) {
  try {
    const firestore = await readFireStore();
    let tokenArr = [];
    if (firestore) {
      firestore.forEach((element) => {
        for (let i in element) {
          tokenArr.push(element[i].expoPush);
        }
      });

      let expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
      let messages = [];
      for (let pushToken of tokenArr) {
        if (!Expo.isExpoPushToken(pushToken)) {
          console.error(`Push token ${pushToken} is not a valid Expo push token`);
          continue;
        }

        messages.push({
          to: pushToken,
          sound: "default",
          title: req.title,
          body: req.content,
          data: {
            device: "Nokia 1020",
            token: pushToken,
          },
        });
      }

      let tickets = [];
      const chunks = expo.chunkPushNotifications(messages);
      for (let chunk of chunks) {
        try {
          tickets = await expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error(error);
        }
      }

      console.log("==================================== tickets");
      console.log(tickets);
      console.log("====================================");

      let arrData = [];
      chunks[0].forEach((element, index) => {
        element.id = tickets[index].id;
        element.status = tickets[index].status;
        element.viewed = false;
        arrData.push(element);
      });

      // console.log("==================================== chunks");
      // console.log(chunks);
      // console.log("====================================");

      // updateNotifyData(req, arrData);

      return tickets;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

async function updateNotifyData(req, chunks) {
  const _keyFirestore = "message_data";
  try {
    const collection = await db.collection(_keyFirestore).doc(req.user).get();
    if (collection.exists) {
      db.collection(_keyFirestore)
        .doc(req.user)
        .update({
          [chunks[0].title]: chunks,
        });
    } else {
      db.collection(_keyFirestore)
        .doc(req.user)
        .set({
          [chunks[0].title]: chunks,
        });
    }
  } catch (e) {
    console.error(e);
  }
}
