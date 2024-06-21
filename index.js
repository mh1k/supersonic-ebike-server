require("dotenv").config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT;

app.use(cors());
app.use(express.json())


function createToken(user) {
    const token = jwt.sign(
        {
            email: user.email
        },
        'secret',
        { expiresIn: '7d' });

    return token;



}


function verifyToken(req, res, next) {

    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, "secret")
    console.log("you are", verify);
    // console.log("sdsfdf",token);
    if (!verify?.email) {
        return res.send("you are not authorized")
    }

    req.user = verify.email

    next();
}

const uri = process.env.DATABASE_URL;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {

        await client.connect();
        const supersonic = client.db("supersonic");
        const ebikeCollection = supersonic.collection("ebike");
        const usersCollection = supersonic.collection("users");
        console.log("You successfully connected to MongoDB!");

        // add product
        app.post("/ebike", verifyToken, async (req, res) => {
            // console.log(req.headers.authorization);
            
            const ebikeData = req.body;
            const result = await ebikeCollection.insertOne(ebikeData);
            res.send(result);
        });

        // get the ebike data
        app.get("/ebike", async (req, res) => {
            const ebikeData = ebikeCollection.find({});
            const result = await ebikeData.toArray();
            res.send(result);
        });

        //get single data
        app.get("/ebike/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const ebikeData = await ebikeCollection.findOne(query);
            // console.log(ebikeData);
            res.send(ebikeData);
        });

        //edit product
        app.patch("/ebike/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const result = await ebikeCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            );
            res.send(result);
        });

        // delete product
        app.delete("/ebike/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const result = await ebikeCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });



        ////////////////user////////////////////

        // google signin user 
        app.post('/users', async (req, res) => {

            const user = req.body;
            // const filter = { email: user.email }
            // const options = { upsert: true }
            // // const updateDoc = { $set: user }
            const token = createToken(user);
            console.log(token);
            const isUserExist = await usersCollection.findOne({ email: user?.email })
            if (isUserExist?._id) {
                return res.send({
                    status: "success",
                    message: "login successfully",
                    token
                })
            }
            const result = await usersCollection.insertOne(user);
            console.log("got new user", req.body);
            console.log("added user", result);
            // res.send(token)

        })

        app.get("/users", async (req, res) => {
            const usersData = usersCollection.find({});
            const result = await usersData.toArray();
            res.send(result);
        });

        app.get("/users/get/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const result = await usersCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });


        // get single user data
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const result = await usersCollection.findOne({ email });
            res.send(result);
        });

        //update user info
        app.patch("/users/:email", verifyToken, async (req, res) => {
            const email = req.params.email;
            const userData = req.body;
            const result = await usersCollection.updateOne({ email }, { $set: userData }, { upsert: true });
            res.send(result);
        });





    }
    finally {


    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('server is working')
});

app.listen(port, (req, res) => {
    console.log("listening on port :", port);
})