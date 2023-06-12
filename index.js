const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// middle-ware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    const userCollection = client.db("fashionDb").collection("users");
    const classesCollection = client.db("fashionDb").collection("classes");
    const cartCollection = client.db("fashionDb").collection("carts");
    const instructorsCollection = client
      .db("fashionDb")
      .collection("instructors");
    // jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, env.process.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send(token);
    });

    // all user api
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // user API---------
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      console.log(existingUser);
      if (existingUser) {
        return res.send({ message: "user Already Exist" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // update Role APi
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedAdmin = {
        $set: {
          role: "Admin",
        },
      };
      const result = await userCollection.updateOne(query, updatedAdmin);
      res.send(result);
    });

    // Make Instructor Api
    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedAdmin = {
        $set: {
          role: "Instructor",
        },
      };
      const result = await userCollection.updateOne(query, updatedAdmin);
      res.send(result);
    });

    // All classes data---------------
    app.get("/classes", async (req, res) => {
      const result = await classesCollection
        .find()
        .sort({ total_students: -1 })
        .toArray();
      res.send(result);
    });

    // class Delete Api--------
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
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

    // cart get Collection--------
    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.send([]);
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    // cart post Collection--------
    app.post("/carts", async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await cartCollection.insertOne(item);
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
