const Consultation = require("../models/consultation");
const { getInstaMojoToken } = require("./home");

module.exports.updatePendingOrders = async () => {
    try {
        let fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
        // fiveHoursAgo = (new Date(Date.now() - 1 * 60 * 1000)); //for testing only
        const pendingConsultations = await Consultation.find({
            paymentStatus: 'Pending',
            lastConsultationDate: { $lte: fiveHoursAgo }
        });
        if (pendingConsultations.length > 0) {
            let instaMojoAccessToken =await getInstaMojoToken()
            const paymentStatusOptions = {
                method: 'GET',
                headers: { accept: 'application/json', Authorization: `Bearer ${instaMojoAccessToken}` }
            };
            for (let consultation of pendingConsultations) {
                let paymentStatusResponse = await fetch(`${process.env.INSTA_MOJO_URL}/v2/payment_requests/${consultation.paymentRequestId}/`, paymentStatusOptions)
                    .then(response => response.json())
                if (paymentStatusResponse.paymentStatus != "Completed")
                    consultation.paymentStatus = 'Payment Failed';
                else {
                    const getPaymentStatusOptionsForPaymentId = {
                        method: 'GET',
                        headers: { accept: 'application/json', Authorization: `Bearer ${instaMojoAccessToken}` }
                    };
                    for (let payment of paymentStatusResponse.payments) {
                        let paymentId = payment.split("/").filter(part => part !== "").pop()
                        let res = await fetch(`${process.env.INSTA_MOJO_URL}/v2/payments/${paymentId}/`, getPaymentStatusOptionsForPaymentId)
                            .then(response => response.json())
                        if (res.status) {
                            consultation.paymentId = paymentId
                            consultation.paymentStatus = "Successfull";
                            break;
                        }
                    }
                }
                await consultation.save();
            }
        }
    } catch (error) {
        console.error("Error updating pending consultation:", error);
    }
};