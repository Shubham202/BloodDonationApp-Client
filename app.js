// Importing Packages
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { request } = require("express");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");

let master_otp;
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database Configuration
mongoose.connect(
    // 'mongodb://localhost:27017/onebloodDB',
    "mongodb+srv://shubham:shubham@oneblood.cbxqs40.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true }
);

// Mongoose Schema
const userSchema = new mongoose.Schema({
    Name: String,
    UserName: String,
    Aadhar_number: Number,
    Email: String,
    Password: String,
    Blood_group: String,
    Contact_number: Number,
    Pin_code: Number
});

const bankSchema = new mongoose.Schema({
    Organization_name: String,
    Address: String,
    Pin_code: Number,
    Contact_number: Number,
    Time_open: String,
    Time_close: String
});

const campSchema = new mongoose.Schema({
    Organization_name: String,
    Venue: String,
    Date_Start: String,
    Date_Close: String,
    Time_Start: String,
    Time_Close: String,
    Contact_number: Number
});

const requestSchema = new mongoose.Schema({
    Person: String,
    Blood_group: String,
    Contact_number: String
})

// Mongoose Model
const User = mongoose.model('User', userSchema);
const Bank = mongoose.model('Bank', bankSchema);
const Camp = mongoose.model('Camp', campSchema);
const Request = mongoose.model('Request', requestSchema);

// GET Requests
app.get('/', (req, res) => {

    Camp.find({}, (err, foundCamps) => {
        res.render('index', { camps: foundCamps});
    })

});

app.get('/login', (req, res) => {
    res.render("login", { message: null });
})

app.get('/register', (req, res) => {
    res.render("register", { message: null });
})

app.get("/register_detail", (req, res) => {
    res.render("register_detail", { message: null });
});

app.get('/GetBloodPage', (req, res) => {
    res.render('GetBloodPage', { banks: null });
})

app.get('/donordonation', (req, res) => {
    res.render("donordonation");
})

app.get("/camporg", (req, res) => {
    res.render("camporg", { message: null });
})

app.get("/donor", (req, res) => {
    res.render("donor", {donors: null});
})

app.get("/bank_register", (req, res) => {
    res.render("bank_register", { message: null });
})

app.get("/requests", (req, res) => {
    res.render("requests", { message: null });
})

app.get("/request_lists", (req, res) => {

    Request.find({}, (err, foundRequest) => {
        res.render("request_lists", { list: foundRequest });
    });

})

// POST Requests
app.post("/register", (req, res) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "3b6686d01f3961",
            pass: "d10b5a3feba233"
        }
    });
    function generateRandomNumber() {
        var minm = 100000;
        var maxm = 999999;
        return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
    }
    let otp = generateRandomNumber();
    master_otp = otp;
    let message = {
        from: "courtyardmarriotnashik@gmail.com",
        to: req.body.emailID,
        subject: "Subject",
        html: "OTP for OneBlood<br><h1>" + otp + "</h1>"
    };
    transporter.sendMail(message, function (err, info) {
        if (err) {
            console.log(err);
        } else {
            res.render('register_otp');
        }
    });
});

app.post('/register_otp', (req, res) => {
    if (req.body.otp == master_otp) {
        res.redirect("register_detail");
    } else {
        res.render("register", { message: "Wrong OTP" });
    }
});

app.post("/register_detail", (req, res) => {
    
    const user = new User({
        Name: req.body.name,
        UserName: req.body.username,
        Aadhar_number: req.body.aadhar_number,
        Email: req.body.emailID,
        Password: req.body.password,
        Contact_number: req.body.contactNumber,
        Blood_group: req.body.blood_grp,
        Pin_code: req.body.pinCode
    });

    let regexp = /^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$/;
    let x = req.body.aadhar_number;
    if (regexp.test(x)) {

        let regexp_phone = /^[6-9]{1}[0-9]{9}$/;
        let y = req.body.contactNumber;
        if (regexp_phone.test(y)) {

            let regexp_name = /^[a-zA-Z\s]+$/;
            let z = req.body.name;
            if (regexp_name.test(z)) {
                
                const URL = "https://api.postalpincode.in/pincode/" + req.body.pinCode;

                fetch(URL)
                    .then(response => response.json())
                    .then(json => {
                        if (json[0].Status == "Success") {
                            if (regexp_name.test(z)) {
            
                                User.findOne({ Email: req.body.emailID } || {Aadhar_number: req.body.aadhar_number}, (err, foundUser) => {
                                    if (!foundUser) {
                                        user.save();
                                        res.render("login", { message: null });
                                    } else {
                                        let message = "user already exist";
                                        res.render("register_detail", { message: message });
                                    }
                                });
            
                            } else {
                                let message = "Invalid Pin Code";
                                res.render("register_detail", { message: message });
                            }
                        } else {
                            res.send(
                                "<script>alert('wrong pin code'); window.location.href = 'http://localhost:8080/register_detail';</script>"
                            );
                        }
                    })
                    .catch(err => console.error(err));


            } else {
                let message = "Invalid Name Field";
                res.render("register_detail", { message: message });
            }

        } else {
            let message = "Invalid Phone Number";
            res.render("register_detail", { message: message });
        }

    } else {
        let message = "Invalid Aadhar Number";
        res.render("register_detail", { message: message });
    }

    

});

app.post('/login', (req, res) => {

    User.findOne({ UserName: req.body.username }, (err, foundUser) => {
        if (foundUser) {
            if (req.body.password === foundUser.Password) {
                if (req.body.type == 'seeker') {
                    res.render("GetBloodPage", { banks: null });
                } else if (req.body.type == 'donor') {
                    Request.find({}, (err, foundRequest) => {
                        res.render("request_lists", { list: foundRequest });
                    });
                } else if (req.body.type == "camp") {
                    res.render("camporg", { message: null });
                } else if (req.body.type == "bank") {
                    res.render("bank_register", { message: null });
                } else {
                    let message = "Empty Choice";
                    res.render("login", { message: message });
                }
            } else {
                let message = "Wrong Password";
                res.render('login', { message: message });
            }
        } else {
            let message = "user does not exist";
            res.render('register', { message: message });
        }
    });

});

app.post("/bank_register", (req, res) => {
    
    const bank = new Bank({
        Organization_name: req.body.orgName,
        Address: req.body.address,
        Pin_code: req.body.pinCode,
        Contact_number: req.body.contactNumber,
        Time_open: req.body.openTime,
        Time_close: req.body.closeTime
    });

    Bank.findOne(
        { Organization_name: req.body.orgName, Pin_code: req.body.pinCode },
        (err, foundOrganization) => {
            if (!foundOrganization) {
                bank.save();
                let message = "Bank registeration done successfully 👍";
                res.render("bank_register", { message: message });
            } else {
                let message = "Bank already exist";
                res.render("bank_register", { message: message });
            }
        }
    );

});

app.post("/GetBloodPage", (req, res) => {

    const URL = "https://api.postalpincode.in/pincode/" + req.body.pinCode;

    fetch(URL)
        .then(response => response.json())
        .then(json => {
            if (json[0].Status == "Success") {
                Bank.find({ Pin_code: req.body.pinCode }, (err, foundBank) => {
                    res.render("GetBloodPage", { banks: foundBank, user: null });
                });
            } else {
                res.send(
                    "<script>alert('wrong pin code'); window.location.href = 'http://localhost:8080/GetBloodPage';</script>"
                );
            }
        })
        .catch(err => console.error(err));

});

app.post('/donor', (req, res) => {
    User.find({ Pin_code: req.body.pinCode }, (err, foundDonor) => {
        res.render("donor", { donors: foundDonor });
    });
});

app.post('/camporg', (req, res) => {

    const camp = new Camp({
        Organization_name: req.body.orgName,
        Venue: req.body.venue,
        Time_Start: req.body.time_start,
        Time_Close: req.body.time_close,
        Date_Start: req.body.date_start,
        Date_Close: req.body.date_close,
        Contact_number: req.body.contactNumber
    });

    Camp.findOne(
        { Organization_name: req.body.orgName, Venue: req.body.venue },
        (err, foundOrganization) => {
            if (!foundOrganization) {
                camp.save();
                let message = "Camp registeration done successfully 👍";
                res.render("campOrg", { message: message });
            } else {
                let message = "Camp already exist";
                res.render("campOrg", { message: message });
            }
        }
    );

});

app.post('/request', (req, res) => {
    const request = new Request({
        Person: req.body.patient_name,
        Contact_number: req.body.contact_number,
        Blood_group: req.body.blood_grp,
    });

     let regexp_phone = /^[6-9]{1}[0-9]{9}$/;
        let y = req.body.contact_number;
        if (regexp_phone.test(y)) {
            Request.findOne(
                { Person: req.body.patient_name },
                (err, foundRequest) => {
                    if (!foundRequest) {
                        request.save();
                        res.render("requests", {
                            message: "Successfully requested for donation"
                        });
                    } else {
                        res.render("requests", {
                            message: "Request already exists"
                        });
                    }
                }
            );
        } else {
            res.render("requests", { message: "Wrong contact number" });
        }
});

// Listening on port
app.listen(8080, () => {
    console.log('Server started on port 8080');
});