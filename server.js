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
// const _uri = "http://localhost:5001/fir-coinstocknews/us-central1/app/api/v1/";
const _uri = "https://us-central1-fir-coinstocknews.cloudfunctions.net/app/api/v1/";

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

app.post("/transfer", (req, res) => {
  console.info("transfer ", req.body);
  res.send({
    status: true,
    data: "http://10.0.12.111:3003/transfer",
  });
});

app.post("/", (req, res) => {
  res.send("Thank you for subscribing");
});

app.get("/webview-config-uri", function (req, res) {
  console.log("webview-config-uri");
  // res.send("https://coinmarketcap.com/");
  // res.send("https://www.binance.com/vi/trade/BTC_USDT");
  res.send("http://localhost:3003");
  // res.send("https://www.mexc.com/exchange/RACA_USDT");
  // res.send("https://coinstock.news/my-account");
});

app.post("/google_login", (req, res) => {
  console.info("google_login ", req.body);
  handleSignInGoogle(req.body, res);
});

app.post("/apple_login", (req, res) => {
  console.info("apple_login ", req.body);
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
          console.log(response.data);
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

app.post("/update-token-data", async (req, res) => {
  console.log("==================================== update-token-data: req.body");
  console.log(req.body);
  console.log("====================================");
  try {
    axios
      .post(_uri + "update-token-data", req.body)
      .then((response) => {
        console.log("==================================== update-token-data: response");
        console.log(response.data);
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
    console.log("==================================== update-token-data: catch");
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
        console.log(response.data);
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

app.get("/languages", async (req, res) => {
  console.info("-----> /languages-version");
  try {
    fs.readFile("./languages.json", (err, data) => {
      if (err) {
        res.send({
          status: false,
          msg: "Read language failed",
        });
      } else {
        res.send({
          status: true,
          version: 1,
          data: JSON.parse(data),
        });
      }
    });
  } catch (e) {
    res.send({
      status: false,
      msg: e.toString(),
    });
  }
});


///////////////////////////////////////////////////////////
app.post("/add-data-news", (req, res) => {
  console.info("add-data ", req.body);
  handleWriteDataToFB(req.body, res);
});
app.get("/read-data-news", (req, res) => {
  console.info("read-data ", req.body);
  handleReadDataToFB(req.body, res);
});


///////////////////////////////////////////////////////////


function handleWriteDataToFB(req, res) {
  db.collection("hello-hakgok").doc("news").set({
      title: req.title,
      content: req.content,
      img: req.img
  })
  .then(() => {
      console.log("Document successfully written!");
      res.send({
        status: true,
        data: req
      });
      res.status(200).json({
        status: true,
        data: req
      });
  })
  .catch((error) => {
      console.error("Error writing document: ", error);
      res.send(false);
  });
}

function handleReadDataToFB(req, res) {
  db.collection("hello-hakgok").doc("news")
    .onSnapshot((doc) => {
      console.log("Current data: ", doc.data());
      const data = doc.data();
      if (data){
        res.send(data)
      } else {
        res.send(false);
      }
    });
}

async function handleSignInGoogle(req, res) {
  console.log("==================================== handleSignInGoogle");
  console.log(req);
  console.log("====================================");

  try {
    const userInfo = await axios.get("https://www.googleapis.com/userinfo/v2/me", {
      headers: { Authorization: `Bearer ${req.token}` },
    });

    console.log("==================================== userInfo");
    console.log(userInfo.data);
    console.log("====================================");

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

async function handleAppleLogin(params) {}
