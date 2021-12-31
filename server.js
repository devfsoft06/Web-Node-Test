const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const { Expo } = require("expo-server-sdk");
const { initializeApp, applicationDefault, cert } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");
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
  console.log("Application started and Listening on port 3000");
});

// server your css as static
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
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
  res.send("google_login");
});

app.get("/read-firestore", (req, res) => {
  console.info("read-firestore ", req.body);
  readFireStore();
});

app.post("/send-mess", (req, res) => {
  console.info("send-mess ", req.body);
  sendMess(req.body, res.send);
});

async function readFireStore() {
  try {
    const citiesRef = db.collection("Devices-Token");
    const snapshot = await citiesRef.get();

    let arr = [];
    snapshot.forEach((doc) => {
      console.log(doc.id, "=>", doc.data());
      arr.push(doc.data());
    });

    console.log("==================================== arr");
    console.log(arr);
    console.log("====================================");

    return arr;
  } catch (error) {
    return null;
  }
}

async function sendMess(req, res) {
  try {
    const firestore = await readFireStore();
    let tokenArr = [];
    if (firestore) {
      firestore.forEach((element) => {
        if (!tokenArr.includes(element.token) || tokenArr.length === 0) {
          tokenArr.push(element.token);
        }
      });
    }
    console.info("tokenArr ", tokenArr);

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

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
        res(false);
      }
    }
    res(true);
  } catch (error) {
    res(false);
  }
}
