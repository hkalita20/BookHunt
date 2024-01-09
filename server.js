// if(process.env.NODE_ENV!== 'production'){
//     const dotenv=require('dotenv');
//     dotenv.config();
// }
const express=require("express");
const mongoose=require("mongoose");
const app=express();
const expressLayouts=require('express-ejs-layouts');
const indexRouter=require('./routes/index');
const authorRouter=require('./routes/authors')
const bookRouter=require('./routes/books')
const bodyParser=require("body-parser");

app.set('view engine','ejs')
app.set('views',__dirname+'/views')
app.set('layout','layouts/layout')
app.use(expressLayouts);
app.use(express.static('public'))
app.use(bodyParser.urlencoded({limit:'10mb',extended:false}))



mongoose.connect(process.env.DATABAS_URL)

const db=mongoose.connection;
db.on('error',error => console.error(error))
db.once('open',() => console.log("Connected to Mongoose"))



app.use('/',indexRouter);
app.use('/authors',authorRouter);
app.use('/books',bookRouter);
app.listen(process.env.PORT || 5000)
