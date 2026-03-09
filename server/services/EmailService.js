const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    }

    async sendNewVacancyNotification(recruiters, vacancy, liderName) {
        try {
            const emails = recruiters.map(r => r.email).join(', ');
            if (!emails) return;

            const mailOptions = {
                from: `"DISCOL Talent Platform" <${process.env.SMTP_USER}>`,
                to: emails,
                subject: `🚀 Nueva Vacante Creada: ${vacancy.puesto_nombre} (${vacancy.codigo_requisicion})`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                        <h2 style="color: #1e4b7a;">Nueva Requisición de Talento</h2>
                        <p>Hola equipo de Reclutamiento,</p>
                        <p>El líder <strong>${liderName}</strong> ha creado una nueva vacante en el sistema que requiere su atención.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #3a94cc;">
                            <p><strong>Puesto:</strong> ${vacancy.puesto_nombre}</p>
                            <p><strong>Código:</strong> ${vacancy.codigo_requisicion}</p>
                            <p><strong>Prioridad:</strong> ${vacancy.prioridad}</p>
                            <p><strong>Fecha de Apertura:</strong> ${new Date(vacancy.fecha_apertura).toLocaleDateString()}</p>
                        </div>

                        <p style="margin-top: 20px;">
                            <a href="${this.frontendUrl}/vacantes/${vacancy.id}" 
                               style="background-color: #3a94cc; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                               VER DETALLE DE VACANTE
                            </a>
                        </p>
                        
                        <p style="color: #888; font-size: 12px; margin-top: 30px;">
                            Este es un correo automático generado por el Sistema de Gestión de Talento.
                        </p>
                    </div>
                `,
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email enviado (Nueva Vacante):', info.messageId);
            return info;
        } catch (error) {
            console.error('❌ Error enviando email de nueva vacante:', error);
        }
    }

    async sendCandidateHiredNotification(liderEmail, candidate, vacancy) {
        try {
            if (!liderEmail) return;

            const mailOptions = {
                from: `"DISCOL Talent Platform" <${process.env.SMTP_USER}>`,
                to: liderEmail,
                subject: `🎊 Candidato Contratado: ${candidate.nombre_candidato} - ${vacancy.puesto_nombre}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                        <h2 style="color: #22c55e;">¡Excelente noticia! Candidato Seleccionado</h2>
                        <p>Hola,</p>
                        <p>Nos complace informarte que el proceso de selección ha finalizado con éxito para la siguiente vacante:</p>
                        
                        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
                            <p><strong>Candidato:</strong> ${candidate.nombre_candidato}</p>
                            <p><strong>Vacante:</strong> ${vacancy.puesto_nombre} (${vacancy.codigo_requisicion})</p>
                            <p><strong>Puesto:</strong> ${vacancy.puesto_nombre}</p>
                            <p><strong>Resultado Final:</strong> ${candidate.resultado_final || 'Contratado'}</p>
                        </div>

                        <p style="margin-top: 20px;">
                            <a href="${this.frontendUrl}/candidatos/${candidate.id}" 
                               style="background-color: #22c55e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                               VER FICHA DEL CANDIDATO
                            </a>
                        </p>
                        
                        <p style="color: #888; font-size: 12px; margin-top: 30px;">
                            ¡Felicidades por la nueva incorporación al equipo!
                        </p>
                    </div>
                `,
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email enviado (Contratación):', info.messageId);
            return info;
        } catch (error) {
            console.error('❌ Error enviando email de contratación:', error);
        }
    }
}

module.exports = new EmailService();
