const crypto = require('crypto');

/**
 * Deriva una clave de 32 bytes usando SHA-256 a partir de la contraseña secreta compartida.
 * @param {string} sharedSecret 
 * @returns {Buffer}
 */
const deriveEncryptionKey = (sharedSecret) => {
    return crypto.createHash('sha256').update(sharedSecret, 'utf8').digest();
};

/**
 * Cifra un objeto o valor usando AES-256-GCM.
 * @param {unknown} value 
 * @param {string} sharedSecret 
 * @returns {string} base64 string
 */
const encryptPayload = (value, sharedSecret) => {
    const iv = crypto.randomBytes(12);
    const key = deriveEncryptionKey(sharedSecret);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(value), 'utf8'),
        cipher.final()
    ]);

    const encryptedPackage = {
        iv: iv.toString('base64'),
        tag: cipher.getAuthTag().toString('base64'),
        data: encrypted.toString('base64')
    };

    return Buffer.from(JSON.stringify(encryptedPackage), 'utf8').toString('base64');
};

/**
 * Descifra un payload base64 que contiene iv, tag y data cifrada con AES-256-GCM.
 * @param {string} payload base64 encoded JSON package
 * @param {string} sharedSecret 
 * @returns {unknown}
 */
const decryptPayload = (payload, sharedSecret) => {
    const encryptedPackage = JSON.parse(
        Buffer.from(payload, 'base64').toString('utf8')
    );

    if (!encryptedPackage.iv || !encryptedPackage.tag || !encryptedPackage.data) {
        throw new Error('El paquete cifrado está incompleto o tiene un formato incorrecto (requiere iv, tag, data)');
    }

    const key = deriveEncryptionKey(sharedSecret);
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(encryptedPackage.iv, 'base64')
    );

    decipher.setAuthTag(Buffer.from(encryptedPackage.tag, 'base64'));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedPackage.data, 'base64')),
        decipher.final()
    ]).toString('utf8');

    return JSON.parse(decrypted);
};

module.exports = {
    encryptPayload,
    decryptPayload
};
