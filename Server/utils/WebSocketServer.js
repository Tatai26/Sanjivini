const mongoose = require("mongoose");
const Doctor = require("../models/doctor");
const User = require("../models/user");
const jwt = require('jsonwebtoken');
const Consultation = require("../models/consultation");
const { GridFSBucket, ObjectId } = require('mongodb');

const verifyUserForWsConnection = async (connection, _id) => {
    try {
        // let token = req.headers.cookie?.split(';').find(str => str.startsWith('Sanjivini=')) || ""
        // token = token.length > 10 ? token.substring(14) : "";
        // token = token.split('.')
        // token = token[0] + '.' + token[1] + '.' + token[2]
        // token = jwt.verify(token, process.env.jwt_secret_key);
        // if (!token) {
            // connection.close();
            // return false;
        // }
        let token = new mongoose.Types.ObjectId(_id)
        let doctor = await Doctor.findById(token);
        let user = await User.findById(token);
        if (doctor)
            connection.doctor = doctor;
        else if (user)
            connection.user = user;
        else
            throw new Error("User not verified")
        return true
    } catch (error) {
        connection.close();
        return false;
    }
}

module.exports.terminateDeadConnections = (connection, req) => {
    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            clearInterval(connection.timer);
            connection.terminate();
        }, 1000);
    }, 10000);
    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    });
}

module.exports.handleIncomingMessage = async (message, connection, wss) => {
    try {
        const messageData = JSON.parse(message.toString());
        if(messageData.forAuthentication)
            return verifyUserForWsConnection(connection, messageData._id)
        if(!connection.doctor && !connection.user) return;
        if (messageData.forVideoCalling)
            return handleVideoCalling(messageData, connection, wss)
        let consultation = await Consultation.findOne({ consultationId: messageData.consultationId })
            .populate('docid', 'name')
        if (!consultation || (consultation.userid.toString() !== connection.user?._id.toString() && consultation.docid._id.toString() !== connection.doctor?._id.toString()))
            return;
        handleTextAndFileMessage(consultation, messageData, wss, connection)
    } catch (error) {
        ;
    }
}

async function handleTextAndFileMessage(consultation, messageData, wss, connection) {
    try {
        if (messageData.text)
            consultation.chatMessages.push({
                senderId: connection.user ? connection.user._id : connection.doctor._id,
                message: messageData.text,
                iv:messageData.iv,
                timestamp: new Date()
            });
        else if (messageData.file) {
            let message_id = new ObjectId()
            let fileName = `${message_id}` + messageData.fileName;
            let fileId = await storeFile(messageData.file, fileName)
            consultation.chatMessages.push({
                _id: message_id,
                senderId: connection.user ? connection.user._id : connection.doctor._id,
                attachment: {
                    originalFileName: messageData.fileName,
                    fileName: fileName,
                    fileType: messageData.fileType,
                    fileId: fileId
                },
                timestamp: new Date()
            });
        }
        if(connection.user)
                consultation.numberOfUnreadMessagesDoctor+=1
        else
            consultation.numberOfUnreadMessagesPatient+=1
        await consultation.save();
        [...wss.clients]
            .filter(c => {
                if (c.user && c.user._id.toString() == consultation.userid.toString())
                    return true
                if (c.doctor && c.doctor._id.toString() == consultation.docid._id.toString())
                    return true
                return false
            })
            .forEach(c => c.send(JSON.stringify({
                newMessage: true,
                consultationId: consultation.consultationId,
                recieverName: connection.user ? consultation.docid.name.toString() : consultation.patientDetails.name.toString(),
                reciever: connection.user ? consultation.docid._id.toString() : consultation.userid.toString(),
                message: consultation.chatMessages[consultation.chatMessages.length - 1]
            })));
    } catch (error) {
        ;
    }
}

async function storeFile(file, filename) {
    try {
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db);
        const buffer = Buffer.from(file, 'binary');
        const uploadStream = bucket.openUploadStream(filename);
        uploadStream.write(buffer);
        uploadStream.end();
        return uploadStream.id;
    } catch (error) {
        throw error;
    }
}

async function handleVideoCalling(messageData, connection, wss) {
    try {
        if (messageData.callUser) {
            if (!connection.doctor) return;
            let consultation = await Consultation.findOne({ consultationId: messageData.consultationId })
            consultation.chatMessages.push({
                videoCallStartTime: new Date()
            });
            await consultation.save();
            [...wss.clients]
                .filter(c => {
                    if (c.user && c.user._id.toString() == messageData.to.toString())
                        return true
                    return false
                })
                .forEach(c => c.send(JSON.stringify({ receivingCall: true, signal: messageData.signalData, from: messageData.from, name: messageData.name })));
        }
        else if (messageData.answerCall) {
            [...wss.clients]
                .filter(c => {
                    if (c.doctor && c.doctor._id.toString() == messageData.to.toString())
                        return true
                    return false
                })
                .forEach(c => c.send(JSON.stringify({ callAccepted: true, signal: messageData.signal })));
            // .forEach(c => c.send(JSON.stringify({ callAccepted: true, signal: messageData.signal, from: c.doctor._id, name: c.doctor.name })));
        }
        else if (messageData.callEnded) {
            [...wss.clients]
                .filter(c => {
                    if (c.user && c.user._id.toString() == messageData.to.toString())
                        return true
                    if (c.doctor && c.doctor._id.toString() == messageData.to.toString())
                        return true
                    return false
                })
                .forEach(c => c.send(JSON.stringify({ callEnded: true })));
        }
    } catch (error) {
        console.log(error)
    }
}
