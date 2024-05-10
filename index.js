const express = require('express')
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5008
const cors = require('cors')
app.use(cors({
   origin: [
     'http://localhost:5173'
   ],
   credentials: true
}))
app.use(express.json())
app.use(cookieParser())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f8w8siu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  const verifyToken = async(req,res,next)=>{
       const token = req.cookies?.token 
       console.log('value of verify token',token);
       if(!token){
         return res.status(401).send({message: 'not autorized'})
       }
       jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
          console.log(err);
          return res.status(401).send({message: 'unauthorized'})
        }
        req.user = decoded
        next()
       })
       
  }

  const cookieOption = {
    httpOnly: true,
    secure:  process.env.NODE_ENV === "production" ? true : false,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
 } 

  async function run() {
    try { 
    const itemsCollection = client.db('OnlineDb').collection('privateonline')
    const CoffeeCollection = client.db('OnlineDB').collection('onlines')

    app.post('/jwt',async(req,res)=>{
       const user = req.body 
       const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET ,{expiresIn: '1000h'})
       res
       .cookie('token',token,cookieOption)
       .send({success: true})
    })

    app.post('/logout',async(req,res)=>{
        const user = req.body;
        res.clearCookie('token',{...cookieOption, maxAge:0}).send({success:true})

    })
  //  public coffeecollection
    app.get('/create',async(req,res)=>{
      const cursor = CoffeeCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.post('/create',async(req,res)=>{
      const items = req.body 
      const result = await CoffeeCollection.insertOne(items)
      console.log('create post',req.body);
      res.send(result)
 })

  //  private
    app.get('/item',verifyToken,async(req,res)=>{
        
 
        if(req.query.email !== req.user.email){
           return res.status(403).send({message: 'forbidden access please valid mail'})
        }

        let query = {}
        if(req.query?.email){
           query = {email: req.query.email}
           
        }

        const cursor = itemsCollection.find(query)
        const result = await cursor.toArray()
        res.send(result)
    })
    app.get('/item/:id',async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await itemsCollection.findOne(query)
      res.send(result)
  })
      
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      
    }
  }
  run().catch(console.dir);
  
  
  
  
  
  
  app.get('/', (req, res) => {
      res.send('Hello World! it s me how are you i am localhost')
    })
  
  
  
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`)
    })
  
    
