const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env
require('dotenv').config();

//middleware
app.use(cors());
app.use(express.json()); // this line let us parse the req.body

// JWT 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    // if token not available
    if (!authHeader) {
        return res.status(401).send({
            message: "Unauthorized Access"
        })
    }
    const token = authHeader.split(' ')[1];
    //check token as verified
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({
                message: "invalid token"
            })
        }
        req.decoded = decoded;
        console.log("decoded", decoded);
        next();
    })

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gg0k3o8.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('genius-car').collection('service');
        const orderCollection = client.db('genius-car').collection('order');

        //Token create

        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN, {
                expiresIn: '1d'
            });
            res.send({ accessToken })
        })


        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        });



        app.get('/orders', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.user.emailValue;
            const email = req.query.email;

            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders)
            }
            else {
                res.status(403).send({
                    message: 'email not valid'
                })
            }
        });

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(req.params);
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        app.post('/service', async (req, res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        })

        // post order data 
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        //DELETE 
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        })
    } finally { }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server is running');
})

app.listen(port, () => {
    console.log('Listening On Port', port);
})




