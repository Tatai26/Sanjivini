const Doctor = require("../models/doctor");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const Consultation = require("../models/consultation");
const mongoose = require("mongoose");
const { GridFSBucket } = require('mongodb');

const doctorSpecializationOptions = new Set([
    'Bone & Joint Specialist',
    'Chest Physician',
    'Child Specialist',
    'Dentist',
    'Diabetes Specialist',
    'Dietician',
    'Ear Nose Throat Specialist',
    'Endocrinology',
    'Eye Specialist',
    'Gastroenterologist',
    'General Physician',
    'General Surgeon',
    'Gynaecologist',
    'Heart Specialist',
    'MD Physician',
    'Nephrologist',
    'Neurologist',
    'Physiotherapist',
    'Psychiatrist',
    'Sexologist',
    'Skin & Hair Specialist',
    'Urologist',
]);

module.exports.registerDoctor = async (req, res) => {
    try {
        let { name, email, password1, specialization, qualification, experience, practiceAddress, languagesSpoken, consultationFeeChat, consultationFeeVideoCall } = req.body;
        email = email.toLowerCase()
        experience = parseInt(experience)
        consultationFeeChat = parseInt(consultationFeeChat)
        consultationFeeVideoCall = parseInt(consultationFeeVideoCall)
        let Rdoctor = await Doctor.findOne({ email: email });
        if (Rdoctor)
            return res.send({ error: true, registered: "true" })
        let hashedPass = bcrypt.hashSync(password1, 12);
        let doctor = new Doctor({ name, hash: hashedPass, email, experience, consultationFeeChat, consultationFeeVideoCall, qualification, practiceAddress, specialization });
        doctor.specialization = specialization
            .filter(spec => doctorSpecializationOptions.has(spec.value))
            .map(spec => spec.value);
        doctor.languagesSpoken = languagesSpoken.split(',')
            .map(lang => {
                const trimmedLang = lang.trim();
                if (trimmedLang.length === 0) return null;
                return trimmedLang.charAt(0).toUpperCase() + trimmedLang.slice(1).toLowerCase();
            })
            .filter(lang => lang !== null);
        if (doctor.specialization.length == 0 || doctor.languagesSpoken.length == 0)
            throw new Error("Must have atleast 1 Specialization and language")
        await doctor.save();
        const token = jwt.sign(doctor._id.toString(), process.env.jwt_secret_key);
        res.cookie("Sanjivini", token, { httpOnly: true, signed: true, maxAge: 1000 * 60 * 60 * 24 * 7 })
        return res.send({ status: "success", _id: doctor._id.toString() })
    }
    catch (error) {
        res.send({ error: true })
    }
}

module.exports.loginDoctor = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.toLowerCase()
        let doctor = await Doctor.findOne({ email: email });
        if (!doctor || !(bcrypt.compareSync(password, doctor.hash)))
            return res.send({ error: true, authenticated: false, incorectCredentials: "true" })
        const token = jwt.sign(doctor._id.toString(), process.env.jwt_secret_key);
        res.cookie("Sanjivini", token, { httpOnly: true, signed: true, maxAge: 1000 * 60 * 60 * 24 * 7 })
        return res.send({ status: "success", _id: doctor._id.toString() })
    }
    catch (error) {
        res.send({ error: true, authenticated: false })
    }
}

module.exports.logoutDoctor = async (req, res) => {
    try {
        res.cookie("Sanjivini", 0, { httpOnly: true, signed: true, maxAge: 1 })
        res.send({ status: "success", loggedOut: true })
    } catch (error) {
        res.send({error:true})
    }
}

module.exports.getConsultation = async (req, res) => {
    try {
        let { consultationId } = req.params
        let consultation = await Consultation.findOneAndUpdate({ consultationId: consultationId }, { numberOfUnreadMessagesDoctor: 0 })
            .populate('docid', 'name')
        if (!consultation)
            return res.send({ error: true, message: "Consultation not found" })
        if (consultation.docid._id.toString() !== res.locals.doctor._id.toString())
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
        if (consultation.docid._id.toString() !== res.locals.doctor._id.toString())
            return res.send({ error: true, message: "You are not authorised" })
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db);
        const file = await bucket.find({ filename: fileName }).toArray();
        if (!file || file.length === 0)
            return res.status(404).send('File not found');
        res.set('Content-Type', file[0].contentType);
        const downloadStream = bucket.openDownloadStreamByName(fileName);
        downloadStream.pipe(res);
    } catch (error) {
        res.send({ error: true })
    }
}

module.exports.getConsultations = async (req, res) => {
    try {
        let consultations = await Consultation.find({ docid: res.locals.doctor._id })
            .sort({ lastConsultationDate: -1 })
            .populate('docid', 'name')
        res.send({ status: "success", consultations })
    } catch (error) {
        res.send({ error: true })
    }
}