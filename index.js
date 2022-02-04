const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const http    = require( 'http' ).createServer( app );
const cors = require("cors");
var io = require('socket.io')(http, {
    cors: {
      origin: '*',
    }
});
const port = 8000;
const expressLayouts = require('express-ejs-layouts');
const db = require('./config/mongoose');
// used for session cookie
const session = require('express-session');
const passport = require('passport');
const passportLocal = require('./config/passport-local-strategy');
const MongoStore = require('connect-mongo');
//const sassMiddleware = require('node-sass-middleware');
const flash = require('connect-flash');
const customMware = require('./config/middleware');
const Post  = require('./models/post');
const Comments  = require('./models/comment');
const User  = require('./models/user');
/*app.use(sassMiddleware({
    src: './assets/scss',
    dest: './assets/css',
    debug: true,
    outputStyle: 'extended',
    prefix: '/css'
}));*/
app.use(express.urlencoded());

app.use(cookieParser());

app.use(express.static('./assets'));

app.use(expressLayouts);
// extract style and scripts from sub pages into the layout
app.set('layout extractStyles', true);
app.set('layout extractScripts', true);




// set up the view engine
app.set('view engine', 'ejs');
app.set('views', './views');

// mongo store is used to store the session cookie in the db
app.use(session({
    name: 'codeial',
    // TODO change the secret before deployment in production mode
    secret: 'blahsomething',
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: (1000 * 60 * 100)
    },
    store: MongoStore.create( 
        {
            mongoUrl: 'mongodb://localhost/test-app'
        },
        function(err)
        {
            console.log(err|| 'connect-mongodb store is ok');
        }

    )
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(passport.setAuthenticatedUser);

app.use(flash());
app.use(customMware.setFlash);

// use express router
const msgs=[];
User.find({},function(err,user){
   user.map(ele=>{
      msgs[`${ele.name}`]=[];
   });
});
app.use('/', require('./routes'));
app.get('/api/read',function(req,res){
    Post.find({},function(errr,data){
        res.send(data);
    });
});

app.get( '/chats', function( req, res ) { 
    console.log(req.query.id);
   return res.render('list',{
       users:Object.keys(msgs),
       id1:req.query.id
   });
});
app.get( '/createchat', function( req, res ) { 
  let id = req.query.id;
  var strs = id.split('*');
  console.log(strs);
  if((msgs.hasOwnProperty(strs[0]))&&!(msgs[strs[0]].hasOwnProperty(strs[1]))){
      msgs[strs[0]][strs[1]] = [["center","You and "+strs[1]+" are ready to Chat"]];
      msgs[strs[1]][strs[0]] = [["center","You and "+strs[0]+" are ready to Chat"]];
  }

  console.log(msgs[strs[0]]);
  console.log(msgs[strs[1]]);
  return res.render('chat',{
    msgs:msgs,
    id1: strs[0],
    id2: strs[1],
    users:Object.keys(msgs)
  })
});
app.get('/api/id',function(req,res){
    Comments.find({id:req.body.id},function(errr,data){
        res.send(data);
    });
});

io.on( 'connection', function( socket ) {
    console.log( 'a user has connected!' );
    socket.on( 'disconnect', function() {
        console.log( 'user disconnected' );
    });
    socket.on( 'message-send', function( {id1,id2,val}) {
        console.log(id1,id2,val);
        msgs[id1][id2].push(["right",val]);
        msgs[id2][id1].push(["left",val]);
        var ed1 = id1;
        var ed2 = id2;
        io.emit( 'commented', {ed1,ed2,val}); 
        io.emit( 'message-typed', {ed1,ed2,val});  
    });
});
http.listen(port, function(err){
    if (err){
        console.log(`Error in running the server: ${err}`);
    }
    console.log(`Server is running on port: ${port}`);
});
