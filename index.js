const express = require("express");
const app = express();
var cors = require("cors");
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

async function run() {
  try {
    await client.connect();
    const taskCollection = client.db("taskList").collection("task");
    console.log("DB Connected");

    //*--------------Task---------------*//

    // GET post by email
    app.get("/task", async (req, res) => {
      // const filter = req.params.email;
      const result = await taskCollection.find({}).toArray();
      res.send(result);
    });

    // POST task by email
    app.post("/task", async (req, res) => {
      const task = req.body;
      const result = await taskCollection.insertOne(task);
      res.send(result);
    });

    // DELETE Task by id
    app.delete("/task/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      console.log(filter);
      const result = await taskCollection.deleteOne(filter);
      res.send(result);
    });

    app.put("/task/complete/:id", async (req, res) => {
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
