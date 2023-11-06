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

// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASS)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pfweqj8.mongodb.net/?retryWrites=true&w=majority`;

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

    const foodBlogsCollection=client.db("FoodBlogsDB").collection("FoodBlogsCollection");

    app.post("/Blogs", async(req,res)=>{
        const blogDatas= req.body;
        // console.log(blogDatas)
    
        const result=await foodBlogsCollection.insertOne(blogDatas)
        res.send(result)
    })

    app.get("/Blogs",async(req,res)=>{
        const cursor=foodBlogsCollection.find().sort({dateTime: -1}).limit(3);
        const result= await cursor.toArray();
        res.send(result)
    })

    //For AllBlogs Page

    app.get("/allBlogs", async(req,res)=>{
      const cursor=foodBlogsCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
