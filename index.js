//#region Import Dependicies
const express = require('express');
const path = require('path');
const { check, validationResult } = require('express-validator');
const session = require('express-session');
//#endregion

//#region MongoDB Setup and Models
const mongoose = require("mongoose")
mongoose.connect("mongodb://localhost:27017/jucie-shop", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// Seting up model for collection
const Order = mongoose.model("orders", {
    studentname: String,
    studentid: String,
    mjuice: Number,
    bjuice: Number,
    ajuice: Number
})
const Admin = mongoose.model("admins", {
    aname: String,
    pass: String
})
//#endregion

var myApp = express();

//#region myApp Setup
myApp.use(express.static(__dirname + "/public"));
myApp.set("views", path.join(__dirname, "views"));
myApp.set("view engine", "ejs");
myApp.use(express.urlencoded({ extended: true }));
//#endregion

//#region Session Setup
myApp.use(session({
    secret: "k0okSFmi3134Nnjdnlsf",
    resave: false,
    saveUninitialized: true
}))
//#endregion

//#region Custom Validation Functions
const studentIDRegex = /\d{3}\-?\d{4}/g;
function studentIDValidation(value) {
    if (!studentIDRegex.test(value)) {
        throw new Error;
    }
    return true;
}
function productAmountValidation(value, { req }) {
    if (value + req.body.berry + req.body.apple < 1)
        throw Error("The minumum order total is 1 item!")
    return true
}
//#endregion

// Methods
myApp.get('', function (req, res) {
    res.render('home');
});
myApp.post("/", [
    check("name", "Name is required!").notEmpty(),
    check('studentID', "Please enter a valid studentID number!").custom(studentIDValidation),
    check("mango", "Please enter valid amount for Mango").isNumeric(),
    check("berry", "Please enter valid amounts fpr Berry").isNumeric(),
    check("apple", "Please enter valid amounts for Apple").isNumeric(),
    check("mango").custom(productAmountValidation)

], function (req, res) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.render("home", { errors: errors.array() })
    }
    else {
        var name = req.body.name;
        var studentID = req.body.studentID
        var mango = parseInt(req.body.mango);
        var berry = parseInt(req.body.berry);
        var apple = parseInt(req.body.apple);

        var subTotal = 0, tax = 0, total = 0;
        subTotal = mango * 6.99 + berry * 5.99 + apple * 3.99;
        tax = subTotal * 0.13;
        total = subTotal + tax;

        var orederData = {
            studentname: name,
            studentid: studentID,
            mjuice: mango,
            bjuice: berry,
            ajuice: apple,
        };
        var reciptData = {
            name: name,
            studentID: studentID,
            mango: mango,
            berry: berry,
            apple: apple,
            subTotal: subTotal,
            tax: tax,
            total: total
        };
        var order = new Order(orederData)
        order.save().then(function() {
            console.log("Saved");
        })
        res.render("recipt", reciptData);
    }  
});

myApp.get('/login', function (req, res) {
    res.render('login');
});
myApp.post('/login', function (req, res) {
    var _username = req.body.username;
    var _password = req.body.password;

    Admin.findOne({ anmae: _username, pass: _password }).exec(function (err, admin) {
        if (admin) {
            req.session.username = admin.username;
            req.session.userLoggedIn = true;

            res.redirect('/admin');
        }
        else {
            res.render('login', { errors: "Sorry Login Failed. Try Again!" });
        }
    })
})
myApp.get('/logout', (req, res) => {
    req.session.username = '';
    req.session.userLoggedIn = false;
    res.render('logout', { message: "Thank you for using the application! You are successfully logged out." });
})

myApp.get('/admin', function (req, res) {
    if (req.session.userLoggedIn) {
        Order.find({}).exec(function (err, orders) {
            res.render('admin', { orders: orders });
        })
    }
    else {
        res.redirect('/login');
    }
});
myApp.get('/delete/:id', function (req, res) {
    if (req.session.userLoggedIn) {
        var id = req.params.id;
        Order.findByIdAndDelete({ _id: id }).exec(function (error, order) {
            if (order) {
                res.render('delete', { message: "Order deleted successfully!" });
            }
            else {
                res.render('delete', { message: "Sorry, something went wrong try again!" });
            }
        })
    }
    else { res.redirect('/login'); }

})

//Run site
myApp.listen(8080);
console.log("Everything executed. Open --> http://localhost:8080/")
