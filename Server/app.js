require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const userController = require("./controllers/user")
const doctorController = require("./controllers/doctor")
const homeController = require("./controllers/home");
const User = require("./models/user");
const Doctor = require("./models/doctor");
const { isUserLoggedIn, isDoctorLoggedIn } = require("./utils/home");
const cron = require("node-cron");
const { updatePendingOrders } = require("./utils/updatePaymentStatus");
const ws = require("ws");
const { terminateDeadConnections, handleIncomingMessage } = require("./utils/WebSocketServer");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.CLIENT_ADDRESS,
    credentials: true
}));
app.use(cookieParser(process.env.cookie_Parser_Secret));

mongoose.connect(process.env.DB_URL);
mongoose.connection.on("error", console.error.bind(console, "connection error:"));
mongoose.connection.once("open", () => {
    console.log("Database connected");
});

cron.schedule("0 */5 * * *", () => {
    updatePendingOrders();
});

// cron.schedule("*/1 * * * *", () => { // for testing
//     updatePendingOrders();
// });

app.use(async (req, res, next) => {
    try {
        if (req.signedCookies && req.signedCookies.Sanjivini) {
            let token = jwt.verify(req.signedCookies.Sanjivini, process.env.jwt_secret_key);
            if (token) {
                token = new mongoose.Types.ObjectId(token)
                let doctor = await Doctor.findById(token);
                let user = await User.findById(token);
                if (doctor) {
                    res.locals.doctor = doctor;
                    const newToken = jwt.sign(doctor._id.toString(), process.env.jwt_secret_key);
                    res.cookie("Sanjivini", newToken, {
                        httpOnly: true,
                        signed: true,
                        maxAge: 1000 * 60 * 60 * 24 * 7
                    })
                }
                else if (user) {
                    res.locals.user = user;
                    const newToken = jwt.sign(user._id.toString(), process.env.jwt_secret_key);
                    res.cookie("Sanjivini", newToken, {
                        httpOnly: true,
                        signed: true,
                        maxAge: 1000 * 60 * 60 * 24 * 7
                    })
                }
                else
                    res.cookie("_id", 0, { httpOnly: true, signed: true, maxAge: 1 })
            }
        }
    } catch (error) {
        ;
    }
    next();
})

app.get("/",(req,res)=>{
    res.send("Welcome to Sanjivini")
})

app.get("/loginStatus", homeController.getLoginStatus)

app.post("/signup", userController.registerUser)
app.post("/login", userController.loginUser)
app.post("/logout", userController.logoutUser)

app.get("/doctors-available", homeController.getAvailableDoctors)
app.get("/doctor-info/:docid", isUserLoggedIn, homeController.getDoctorInfo)

app.post("/book-consultation", isUserLoggedIn, userController.bookConsultation)
app.get("/check-payment-status", isUserLoggedIn, userController.checkPaymentStatus)
app.post("/payment/instamojo-webhook",userController.instaMojoWebHook)

app.get("/consultations", isUserLoggedIn, userController.getConsultations)
app.get("/consultation/:consultationId", isUserLoggedIn, userController.getConsultation)
app.get("/consultation/:consultationId/:fileName", isUserLoggedIn, userController.getConsultationFiles)

app.post("/doctor/signup", doctorController.registerDoctor)
app.post("/doctor/login", doctorController.loginDoctor)
app.post("/doctor/logout", doctorController.logoutDoctor)
app.get("/doctor/consultations", isDoctorLoggedIn, doctorController.getConsultations)
app.get("/doctor/consultation/:consultationId", isDoctorLoggedIn, doctorController.getConsultation)
app.get("/doctor/consultation/:consultationId/:fileName", isDoctorLoggedIn, doctorController.getConsultationFiles)

let server = app.listen(5000, function () {
    console.log("Listening on port 5000");
})

let wss = new ws.WebSocketServer({ server })
wss.on("connection", (connection, req) => {
    // let connectionEstablished = verifyUserForWsConnection(connection, req);
    // if (!connectionEstablished) connection.close();
    terminateDeadConnections(connection, req);
    connection.on("message", (message) => {
        handleIncomingMessage(message, connection, wss)
    })
}) 