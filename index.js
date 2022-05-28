const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();

//middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cr699.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

//verify jwt
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  /* const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    // console.log(decoded);
    req.decoded = decoded;
    next();
  }); */
}

async function run() {
  try {
    await client.connect();
    console.log("database Connected");

    const toolCollection = client.db("toolbox").collection("tools");
    const purchaseCollection = client.db("toolbox").collection("purchase");
    const userCollection = client.db("toolbox").collection("users");

    //get all tools
    app.get("/tools", async (req, res) => {
      const query = {};
      const result = await toolCollection.find(query).toArray();
      res.send(result);
    });

    //add a tool
    app.post("/tools", async (req, res) => {
      const tool = req.body;
      const result = await toolCollection.insertOne(tool);
      res.send(result);
    });

    //delete tool
    app.delete("/tools/:name", async (req, res) => {
      const name = req.params.name;
      const filter = { name: name };
      const result = await toolCollection.deleteOne(filter);
      res.send(result);
    });

    //get purchase data
    app.get("/purchase", verifyJWT, async (req, res) => {
      const user = req.query.user;
      const decodedEmail = req.decoded.email;
      if (user == decodedEmail) {
        const query = { user: user };
        const purchase = await purchaseCollection.find(query).toArray();
        res.send(purchase);
      } else {
        return res.status(403).send({ message: "forbidden" });
      }
    });

    //post purchase data
    app.post("/purchase", async (req, res) => {
      const purchase = req.body;
      const result = await purchaseCollection.insertOne(purchase);
      res.send(result);
    });

    //put users
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = req.body;
      const updateDoc = {
        $set: user,
      };
      const options = { upsert: true };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, {
        expiresIn: "30d",
      });
      res.send({ result, token });
    });
    //verify Admin
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };

    //make admin
    app.put("/user/admin/:email", verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send({ result });
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    //get user
    app.get("/user", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from Toolbox");
});

app.listen(port, () => {
  console.log(`Toolbox app listening on port ${port}`);
});
