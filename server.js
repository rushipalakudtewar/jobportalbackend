const express = require('express')
const app = express()
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config();
const database = require('./db/database')
const cookieParser = require('cookie-parser');
const employeeRoute=require('./routes/employeeRoute')
database()
const port =  process.env.PORT || 5000

app.use(express.json())
app.use(cookieParser())
app.use(cors())

app.use('/api/v1',employeeRoute)
app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
})