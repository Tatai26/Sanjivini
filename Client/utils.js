import crypto from "crypto"

export const encryptMessage = (text) => {
    let secretKey=process.env.NEXT_PUBLIC_MESSAGE_ENCRYPTION_KEY
    const iv = crypto.randomBytes(16); // Generate random initialization vector
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
};

export const decryptMessage = (encryptedData, iv) => {
    let secretKey=process.env.NEXT_PUBLIC_MESSAGE_ENCRYPTION_KEY
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};