const express = require("express");
const app = express();
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

async function run() {
  try {
    await client.connect();
    console.log("databaseConnected");

    const toolCollection = client.db("toolbox").collection("tools");

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
