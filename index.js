const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

// middle-ware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vtwk5ft.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const classesCollection = client.db("fashionDb").collection("classes");
    const instructorsCollection = client
      .db("fashionDb")
      .collection("instructors");

    // All classes data---------------
    app.get("/classes", async (req, res) => {
      const result = await classesCollection
        .find()
        .sort({ total_students: -1 })
        .toArray();
      res.send(result);
    });

    // all instructors data -----------
    app.get("/instructors", async (req, res) => {
      const result = await instructorsCollection
        .find()
        .sort({ totalStudent: -1 })
        .toArray();
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("fashion is ongoing.........");
});

app.listen(port, () => {
  console.log(`Fashion is ongoing on the ${port}`);
});
