const Doctor = require("../models/doctor");

module.exports.getAvailableDoctors = async (req, res) => {
    try {
        let { specialty } = req.query
        const doctors = await Doctor.find({ specialization: specialty });
        res.send({ status: "success", doctors })
    } catch (error) {
        res.send({ error: true })
    }
}

module.exports.getDoctorInfo = async (req, res) => {
    try {
        let { docid } = req.params
        const doctor = await Doctor.findById(docid);
        res.send({ status: "success", doctor })
    } catch (error) {
        res.send({ error: true })
    }
}

module.exports.getLoginStatus = async (req, res) => {
    try {
        if (res.locals.user)
            return res.send({ authenticated: true, user: true, _id: res.locals.user._id.toString() })
        if (res.locals.doctor)
            return res.send({ authenticated: true, doctor: true, _id: res.locals.doctor._id.toString() })
        res.send({ authenticated: false })
    } catch (error) {
        res.send({ error: true })
    }
}