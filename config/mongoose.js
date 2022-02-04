const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://pms:FMtdZSqrWToKD2k6@cluster0.diqlz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority')
.then(()=>{
    console.log("databaseconnected");
})
.catch(()=>{
    console.log("databaseconnected")
})

const db = mongoose.connection;

db.on('error', console.error.bind(console, "Error connecting to MongoDB"));


db.once('open', function(){
    console.log('Connected to Database :: MongoDB');
});


module.exports = db;