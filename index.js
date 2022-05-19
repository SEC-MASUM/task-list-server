const express = require("express");
const app = express();
var cors = require("cors");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const host = "localhost";
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0x7ne.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const verifyJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .send({ success: false, message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res
        .status(403)
        .send({ success: false, message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    await client.connect();
    const taskCollection = client.db("taskList").collection("task");
    const userCollection = client.db("taskList").collection("user");
    console.log("DB Connected");

    //*--------------User---------------*//

    // PUT user
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
      );
      res.send({ result, accessToken: token });
    });

    //*--------------Task---------------*//

    // GET post by email
    app.get("/task/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const filter = { user: email };
        const result = await taskCollection.find(filter).toArray();
        res.send(result);
      } else {
        return res
          .status(403)
          .send({ success: false, message: "Forbidden access" });
      }
    });

    // POST task by user: email
    app.post("/task", verifyJWT, async (req, res) => {
      const task = req.body;
      const result = await taskCollection.insertOne(task);
      res.send(result);
    });

    // DELETE Task by id
    app.delete("/task/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await taskCollection.deleteOne(filter);
      res.send(result);
    });

    app.put("/task/complete/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: { status: "complete" },
      };
      const result = await taskCollection.updateOne(filter, updateDoc);

      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Task List App Server is Running");
});

app.listen(port, () => {
  console.log(`Server is running at http://${host}:${port}`);
});
