const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

async function verifyOnly() {
    console.log('--- VERIFYING SMTP CONNECTION (NO EMAIL WILL BE SENT) ---');
    console.log('User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: parseInt(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        // Only verify, DO NOT SEND anything
        await transporter.verify();
        console.log('✅ EXCELENTE: ¡Conexión SMTP verificada y autenticada con éxito!');
        process.exit(0);
    } catch (error) {
        console.error('❌ ERROR de Autenticación:', error.message);
        process.exit(1);
    }
}

verifyOnly();
