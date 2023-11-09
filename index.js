const express=require('express');
const port =process.env.PORT || 5000;
const app= express();
const cors=require('cors');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
app.use(cors({
  origin: [
    // 'http://localhost:5174',
    // 'http://localhost:5173',
    'https://food-blogs-auth.web.app',
    'https://food-blogs-auth.firebaseapp.com'
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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


const logger=(req,res,next)=>{
  console.log(req.method, req.url)
  next();

}

const verifyToken=(req,res,next)=>{
  const token=req?.cookies?.accessToken;
  console.log("hello token",token);

  if(!token){
    return res.status(401).send({message: "Token nai"});
  }
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN,(err, decoded)=>{
    if(err){
      return res.status(401).send({message: "unauthorized access"});
    }

    req.user=decoded;

    next();
  })
  
}

async function run() {
  try {

    const foodBlogsCollection=client.db("FoodBlogsDB").collection("FoodBlogsCollection");
    const wishListCollection=client.db("FoodBlogsDB").collection("WishListCollection");
    const commentsCollection=client.db("FoodBlogsDB").collection("CommentsCollection");

    app.post("/Blogs",logger, verifyToken, async(req,res)=>{
        const blogDatas= req.body;
        
        const email= req.body.userEmail;
        console.log(email);

        if(req.user.email!==email){
          return res.status(403).send({message: "forbidden access"});
        }

        const result=await foodBlogsCollection.insertOne(blogDatas)
        console.log(blogDatas)
        res.send(result)
    })

    app.get("/Blogs",async(req,res)=>{
        const cursor=foodBlogsCollection.find().sort({dateTime: -1}).limit(6);
        const result= await cursor.toArray();
        res.send(result)
    })

    //For AllBlogs Page

    app.get("/allBlogs", async(req,res)=>{
      const cursor=foodBlogsCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    //wishList

    app.post("/wishLists", async(req,res)=>{
      const wishListBlog=req.body;
      console.log(wishListBlog);


      const existAlready= await wishListCollection.findOne(wishListBlog);

      if(existAlready){
        return res.send({message:'Blog already exist into your WhistList'});
      }

      const result= await wishListCollection.insertOne(wishListBlog)
      res.send(result)
    })

    app.get("/wishLists",logger, verifyToken, async(req,res)=>{
      console.log(req.query);
      // console.log(req.cookies);
      if(req.user.email !== req.query.email){
        return res.status(403).send({message: "forbidden access"});
      }
      console.log("owner token info", req.user)
      let query={};
      
      if(req.query?.email){
        query= {userEmail: req.query.email}
      }
      const cursor=  wishListCollection.find(query);
      const result = await cursor.toArray();
      res.send(result)
    })

    //BlogDetails

    app.get("/details/:id", async(req,res)=>{
      const id= req.params.id;
      console.log(id);
      
      const query= {_id: new ObjectId(id)};
      const result= await foodBlogsCollection.findOne(query);
      res.send(result);
    })

    //updateblogs

    app.get("/update/:id", async(req,res)=>{
      const id=req.params.id;
      console.log(id);

      const query={_id: new ObjectId(id)};
      const result= await foodBlogsCollection.findOne(query);
      res.send(result);
    })

    app.put("/updateBlogs/:id",logger, verifyToken, async(req,res)=>{
     
      const updatingData=req.body;
      const id=req.params.id;
      console.log(id);
      console.log(updatingData);

      if(req.user.email !== req.body.userEmail){
        return res.status(403).send({message: "forbidden access"});
      }
      
      const query={_id: new ObjectId(id)};
      const update={
        $set:{
          title: updatingData.title,
          category: updatingData.category,
          image: updatingData.image,
          shortDescription: updatingData.shortDescription,
          longDescription: updatingData.longDescription
        }
      }
      const result= await foodBlogsCollection.updateOne(query, update);
      res.send(result);
    })


    //CcommentsInfo

    app.post("/commentsInfo",async(req,res)=>{
      const commentsInfo=req.body;
      console.log(commentsInfo)
      const result=await commentsCollection.insertOne(commentsInfo);
      res.send(result)
    })

    app.get("/commentsInfo/:id",async(req,res)=>{
      const id= req.params.id;
      console.log(id);

      const query={blog_id: id};

      const cursor= commentsCollection.find(query);
      const result= await cursor.toArray();
      res.send(result);
    })

    //Top 10 FeaturedBlogs

    app.get("/featuredBlogsPosts",async(req,res)=>{
      const cursor= await foodBlogsCollection.find().toArray();
      cursor.sort((x,y)=>{
        const first= x.longDescription.length;
        const second= y.longDescription.length;
        return second-first;
      })

      const result= cursor.slice(0,10);
      res.send(result)
    })

    //delete

    app.post("/delete/:id",async(req,res)=>{
      const id=req.params.id;
      console.log(id);

      const query={_id: new ObjectId(id)};
      const result= await wishListCollection.deleteOne(query);
      res.send(result);
    })


    ///JWT

    app.post("/jwt",logger, async(req,res)=>{
      const userMail= req.body;
      console.log(userMail);

      const token= jwt.sign(userMail, process.env.ACCESS_SECRET_TOKEN, {expiresIn: "1h"});
      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      }).send({success: true})

    //   res.cookie('token', token, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === 'production', 
    //     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        
    // })
    })

    app.post("/signOut",async(req,res)=>{
      const userMail= req.body;
      console.log(userMail);
      res.clearCookie('accessToken', {maxAge: 0, httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'})
      .send({success: true})
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
