const mongoose = require('mongoose')

const mongo_url = process.env.MONGO_URL

const database = () => {
    mongoose.connect(mongo_url,{
    useNewURLParser:true,
    useUnifiedTopology:true
}).then((data)=>{
    console.log(`Mongodb connected successfully on ${data.connection.host}`);
}).catch((err)=>{
    console.log(`Failed to connect the database ${err}`);
    process.exit(1)
})
}

module.exports = database