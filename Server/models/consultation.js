const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    videoCallStartTime:{
        type: Date,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    message: {
        type: String
    },
    iv: {
        type: String
    },
    attachment:{
        originalFileName:String,
        fileName: String,
        fileType: String,
        fileId: mongoose.Schema.Types.ObjectId
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const consultationSchema = new mongoose.Schema({
    patientDetails:{
        name: String,
        age: Number,
        gender: String,
    },
    userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    docid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Doctor"
    },
    createdAt: {
        type: Date,
    },
    lastConsultationDate: {
        type: Date,
    },
    paymentStatus: {
        type: String,
        enum: ['Pending','Payment Failed','Successfull'],
        default: 'Pending'
    },
    paymentRequestId: String,
    paymentId: String,
    consultationId: String,
    feePaid: Number,
    consultationType:{
        type: String,
        enum: ['Chat','Video Call'],
    },
    chatMessages: [messageSchema],
    numberOfUnreadMessagesDoctor:{
        type:Number,
        default:0
    },
    numberOfUnreadMessagesPatient:{
        type:Number,
        default:0
    }
});

module.exports = mongoose.model("Consultation", consultationSchema);