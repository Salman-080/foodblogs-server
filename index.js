const express=require('express');
const port =process.env.PORT || 5000;
const app= express();
const cors=require('cors');
app.use(cors());
app.use(express.json());
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
app.get('/',(req,res)=>{
    res.send("Food Blog Server");
})

app.listen(port, (req,res)=>{
    console.log(`app is running on port: ${port}`)
})




const uri = "mongodb+srv://<username>:<password>@cluster0.pfweqj8.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
