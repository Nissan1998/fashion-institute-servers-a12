const express = require("express");
require("dotenv").config();
const stripe = require("stripe")(process.env.PAYMENT_SECRET);
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const port = process.env.PORT || 5000;

// middle-ware
app.use(cors());
app.use(express.json());

let transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    use: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});

// send payment confirmation email
const sendPaymentConfirmation = (payment) => {
  transporter.sendMail(
    {
      from: "SENDER_EMAIL", // verified sender email
      to: "nissanm925@gmail.com", // recipient email
      subject: "You paid Successfully", // Subject line
      text: "Hello world!", // plain text body
      html: "<b>Payment confirm</b>", // html body
    },
    function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
};

// jwt middle-ware
const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized Access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized Access" });
    }
    req.decoded = decoded;
    next();
  });
};

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
    const paymentCollection = client.db("fashionDb").collection("payments");
    const instructorsCollection = client
      .db("fashionDb")
      .collection("instructors");
    // jwt token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "7d",
      });
      res.send(token);
    });

    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "Admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

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

    // verifying admin api
    app.get("/users/admin/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === "Admin" };
      res.send(result);
    });
    // verifying instructor api
    app.get("/users/instructor/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ instructor: false });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { instructor: user?.role === "Instructor" };
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
      const updatedInstructor = {
        $set: {
          role: "Instructor",
        },
      };
      const result = await userCollection.updateOne(query, updatedInstructor);
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
    app.get("/classes/:email", async (req, res) => {
      const email = req.params.email;
      const query = { instructor_email: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });

    // classes post api
    app.post("/classes", async (req, res) => {
      const course = req.body;
      const result = await classesCollection.insertOne(course);
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
    app.get("/carts", verifyJwt, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(401)
          .send({ error: true, message: "Forbidden Authorization" });
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

    // create payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // payment stored API
    app.post("/payments", async (req, res) => {
      const paymentInfo = req.body;
      const insertedResult = await paymentCollection.insertOne(paymentInfo);
      const query = {
        _id: {
          $in: paymentInfo.selectedCourse.map((id) => new ObjectId(id)),
        },
      };
      const deletedConfirm = await cartCollection.deleteMany(query);
      const updateCourseQuery = {
        _id: {
          $in: paymentInfo.coursesId.map((id) => new ObjectId(id)),
        },
      };
      const updateCourseOptions = {
        $inc: { total_students: 1, available_seats: -1 },
      };
      const updateCourseResult = await classesCollection.updateMany(
        updateCourseQuery,
        updateCourseOptions
      );

      // send an email

      console.log(updateCourseResult);
      res.send({ insertedResult, deletedConfirm, updateCourseResult });
    });

    // Paid Course Api
    app.get("/paidCourse", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const payments = await paymentCollection.find(query).toArray();

      // Extract course_ids from payments
      const courseIds = payments
        .map((payment) => payment.coursesName)
        .flat()
        .map((name) => name);

      // // Find courses matching the course_ids
      const courses = await classesCollection
        .find({ name: { $in: courseIds } })
        .toArray();
      res.send(courses);
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
