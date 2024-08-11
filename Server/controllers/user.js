const User = require("../models/user");
const Doctor = require("../models/doctor");
const Consultation = require("../models/consultation");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const { getInstaMojoToken, generateConsultationId } = require("../utils/home");
const mongoose = require("mongoose");
const { GridFSBucket } = require('mongodb');

module.exports.registerUser = async (req, res) => {
    try {
        let { name, email, password1, phone } = req.body;
        phone = parseInt(phone)
        email = email.toLowerCase()
        let Ruser = await User.findOne({ email: email });
        if (Ruser)
            return res.send({ error: true, registered: "true" })
        let hashedPass = bcrypt.hashSync(password1, 12);
        let user = new User({ name, hash: hashedPass, email, phone });
        await user.save();
        const token = jwt.sign(user._id.toString(), process.env.jwt_secret_key);
        res.cookie("Sanjivini", token, { httpOnly: true, signed: true, maxAge: 1000 * 60 * 60 * 24 * 7 })
        return res.send({ status: "success", _id: user._id.toString() })
    }
    catch (error) {
        res.send({ error: true })
    }
}

module.exports.loginUser = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.toLowerCase()
        let user = await User.findOne({ email: email });
        if (!user || !(bcrypt.compareSync(password, user.hash)))
            return res.send({ error: true, authenticated: false, incorectCredentials: "true" })
        const token = jwt.sign(user._id.toString(), process.env.jwt_secret_key);
        res.cookie("Sanjivini", token, { httpOnly: true, signed: true, maxAge: 1000 * 60 * 60 * 24 * 7 })
        return res.send({ status: "success", _id: user._id.toString() })
    }
    catch (error) {
        res.send({ error: true, authenticated: false })
    }
}

module.exports.logoutUser = async (req, res) => {
    try {
        res.cookie("Sanjivini", 0, { httpOnly: true, signed: true, maxAge: 1 })
        res.send({ status: "success", loggedOut: true })
    } catch (error) {
        res.send({ error: true })
    }
}

module.exports.bookConsultation = async (req, res) => {
    try {
        let { docid, name, age, gender, consultationType, consultationIdOld } = req.body
        let doctor = await Doctor.findById(docid)
        if (!doctor)
            return res.send({ error: true, doctorNotFound: true })
        let consultationFee = 0;
        if (consultationType == 'Chat')
            consultationFee = doctor.consultationFeeChat
        else if (consultationType == 'Video Call')
            consultationFee = doctor.consultationFeeVideoCall
        else
            return res.send({ error: true, wrongConsultationType: true })
        let instaMojoAccessToken = await getInstaMojoToken()
        let consultationId, newConsultation;
        if (consultationIdOld)
            newConsultation = await Consultation.findOne({ consultationId: consultationIdOld })
        if (!newConsultation)
            consultationId = generateConsultationId()
        else
            consultationId = consultationIdOld
        const createPaymentOptions = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${instaMojoAccessToken}`,
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                amount: consultationFee,
                purpose: consultationId,
                buyer_name: res.locals.user.name,
                email: res.locals.user.email,
                phone: res.locals.user.phone,
                redirect_url: process.env.CLIENT_ADDRESS + "/consultationPayment/" + consultationId,
                webhook: process.env.SERVER_ADDRESS + '/payment/instamojo-webhook',
                allow_repeated_payments: false,
                send_email: false,
            })
        };
        let createPaymentResponse = await fetch(`${process.env.INSTA_MOJO_URL}/v2/payment_requests/`, createPaymentOptions)
            .then(response => response.json())
        if (!createPaymentResponse.longurl)
            throw new Error("Payment url not generated")
        if (!newConsultation)
            newConsultation = new Consultation({
                patientDetails: {
                    name: name,
                    age: age,
                    gender: gender,
                },
                userid: res.locals.user._id,
                docid: docid,
                createdAt: Date.now(),
                lastConsultationDate: Date.now(),
                paymentStatus: 'Pending',
                paymentRequestId: createPaymentResponse.id,
                consultationId: consultationId,
                feePaid: consultationFee,
                consultationType: consultationType,
            })
        else {
            newConsultation.lastConsultationDate = Date.now()
            newConsultation.paymentStatus = 'Pending'
            newConsultation.paymentRequestId = createPaymentResponse.id
            newConsultation.feePaid = consultationFee;
        }
        await newConsultation.save()
        return res.send({ status: "success", paymentUrl: createPaymentResponse.longurl })
    } catch (error) {
        console.log(error)
        res.send({ error: true })
    }
}

module.exports.checkPaymentStatus = async (req, res) => {
    try {
        let { payment_id, consultationId } = req.query;
        if (!payment_id || !consultationId)
            return res.send({ error: true })
        let newConsultation = await Consultation.findOne({ consultationId: consultationId })
        if (newConsultation.userid.toString() !== res.locals.user._id.toString())
            return res.send({ error: true, message: "You are not authorised" })
        if (!newConsultation)
            throw new Error("Consultation ID not found")
        else if (newConsultation.paymentStatus == "Successfull")
            return res.send({ status: "success", paymentSuccessfull: true })
        else if (newConsultation.paymentStatus == "Payment Failed")
            return res.send({ status: "success", paymentFailed: true })
        let instaMojoAccessToken = await getInstaMojoToken()
        const getPaymentStatusOptions = {
            method: 'GET',
            headers: { accept: 'application/json', Authorization: `Bearer ${instaMojoAccessToken}` }
        };
        let paymentStatusResponse = await fetch(`${process.env.INSTA_MOJO_URL}/v2/payments/${payment_id}/`, getPaymentStatusOptions)
            .then(response => response.json())
        if (paymentStatusResponse.status)
            newConsultation.paymentStatus = "Successfull"
        else
            newConsultation.paymentStatus = "Payment Failed"
        newConsultation.paymentId = paymentStatusResponse.id
        await newConsultation.save()
        res.send({ status: "success", paymentSuccessfull: paymentStatusResponse.status })
    } catch (error) {
        res.send({ error: true })
    }
}

module.exports.instaMojoWebHook = async (req,res) => {
    try {
        let { purpose, payment_id } = req.body;
        let newConsultation = await Consultation.findOne({ consultationId: purpose })
        if (!newConsultation)
            throw new Error("Consultation ID not found")
        else if (newConsultation.paymentStatus == "Successfull")
            return res.send({ status: "success", paymentSuccessfull: true })
        else if (newConsultation.paymentStatus == "Payment Failed")
            return res.send({ status: "success", paymentFailed: true })
        let instaMojoAccessToken = await getInstaMojoToken()
        const getPaymentStatusOptions = {
            method: 'GET',
            headers: { accept: 'application/json', Authorization: `Bearer ${instaMojoAccessToken}` }
        };
        let paymentStatusResponse = await fetch(`${process.env.INSTA_MOJO_URL}/v2/payments/${payment_id}/`, getPaymentStatusOptions)
            .then(response => response.json())
        if (paymentStatusResponse.status)
            newConsultation.paymentStatus = "Successfull"
        else
            newConsultation.paymentStatus = "Payment Failed"
        newConsultation.paymentId = paymentStatusResponse.id
        await newConsultation.save()
        res.send({ status: "success", paymentSuccessfull: paymentStatusResponse.status })
    } catch (error) {
        res.status(500).send({error:true})
    }
}

module.exports.getConsultations = async (req, res) => {
    try {
        let consultations = await Consultation.find({ userid: res.locals.user._id })
            .sort({ lastConsultationDate: -1 })
            .populate('docid', 'name')
        res.send({ status: "success", consultations })
    } catch (error) {
        res.send({ error: true })
    }
}

module.exports.getConsultation = async (req, res) => {
    try {
        let { consultationId } = req.params
        let consultation = await Consultation.findOneAndUpdate({ consultationId: consultationId }, { numberOfUnreadMessagesPatient: 0 })
            .populate('docid', 'name consultationFeeVideoCall consultationFeeChat')
        if (!consultation)
            return res.send({ error: true, message: "Consultation not found" })
        if (consultation.userid.toString() !== res.locals.user._id.toString())
            return res.send({ error: true, message: "You are not authorised" })
        res.send({ status: "success", consultation })
    } catch (error) {
        res.send({ error: true })
    }
}

module.exports.getConsultationFiles = async (req, res) => {
    try {
        let { fileName, consultationId } = req.params
        let consultation = await Consultation.findOne({ consultationId: consultationId })
        if (!consultation)
            return res.send({ error: true, message: "Consultation not found" })
        if (consultation.userid.toString() !== res.locals.user._id.toString())
            return res.send({ error: true, message: "You are not authorised" })
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db);
        const file = await bucket.find({ filename: fileName }).toArray();
        if (!file || file.length === 0)
            return res.status(404).send('File not found');
        const downloadStream = bucket.openDownloadStreamByName(fileName);
        downloadStream.pipe(res);
    } catch (error) {
        res.send({ error: true })
    }
}
