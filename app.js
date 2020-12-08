require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded(
    {extended: true}
    ));
app.use(session ({
    secret: "This is out little secret.",
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
    "mongodb://localhost:27017/customerDB",
    {useNewUrlParser: true, useUnifiedTopology: true}
    );
mongoose.set("useCreateIndex", true);
const customerSchema = new mongoose.Schema({
    username: String,
    password: String
});
customerSchema.plugin(passportLocalMongoose);
const Customer = mongoose.model("Customer", customerSchema);
const listSchema = new mongoose.Schema({
    name : String
});
const List = mongoose.model("List",listSchema);

passport.use(Customer.createStrategy());
passport.serializeUser(Customer.serializeUser());
passport.deserializeUser(Customer.deserializeUser());

const item1 = new List({
    name: "Welcome to your to-do list"
});
const item2 = new List({
    name: "Hit the + button to add a new item"
});
const item3 = new List({
    name: "<-- Hit this to delete an item"
});
const defaultItem = [item1, item2, item3];

app.get("/",function(req,res){
    res.render("home");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/logout",function(req,res){
    req.logOut();
    res.redirect("/");
});

app.get("/todo", function(req,res){
    let day = new Date().getDay();
    switch(day){
        case 0: day = "Sunday";
        break;
        case 1: day = "Monday";
        break;
        case 2: day = "Tuesday";
        break;
        case 3: day = "Wednesday";
        break;
        case 4: day = "Thursday";
        break;
        case 5: day = "Friday";
        break;
        case 6: day = "Saturday";
        break;
        default: day = "Error";
    }
    List.find({},function(err,foundItem){
        if(foundItem.length === 0){
            List.insertMany(defaultItem, function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log("Successfully updated the items in DB.");
                }
            });
            res.redirect("/todo");
        }else{
            if(req.isAuthenticated()){
                res.render("todo", {Day: day, Items: foundItem});
            }else{
                res.redirect("/login");
            }
        }
    });
});

app.post("/register",function(req, res){
    Customer.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/login");
            });
        }
    });
});

app.post("/login", function(req, res){
    const user = new Customer({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        }else {
            passport.authenticate("local")(req, res, function(){
               res.redirect("/todo"); 
            });
        }
    });
});

app.post("/todo",function(req,res){
    const listitem = new List({
        name: req.body.list
    });
    listitem.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/todo");
        }
    });
});

app.post("/delete",function(req,res){
    const checkedItem = req.body.checkItem;
    List.deleteOne({_id: checkedItem},function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/todo");
        }
    });
});

app.listen(3000, function(){
    console.log("Server is up and running on port 3000.");
});