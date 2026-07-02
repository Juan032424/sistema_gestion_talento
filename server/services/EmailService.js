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

    async sendCandidateStageUpdateNotification(email, candidateName, vacancyName, newStage, trackingUrl) {
        try {
            if (!email) return;

            const mailOptions = {
                from: `"DISCOL Talent Platform" <${process.env.SMTP_USER}>`,
                to: email,
                subject: `📌 Actualización de tu proceso: ${vacancyName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                        <h2 style="color: #3b82f6;">Actualización de tu Postulación</h2>
                        <p>Hola <strong>${candidateName}</strong>,</p>
                        <p>Te informamos que ha habido un avance en tu proceso de selección para la vacante de <strong>${vacancyName}</strong>.</p>
                        
                        <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; text-align: center;">
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">Nuevo Estado</p>
                            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #1e3a8a;">${newStage}</p>
                        </div>

                        ${trackingUrl ? `
                        <p style="margin-top: 25px; text-align: center;">
                            <a href="${trackingUrl}" 
                               style="background-color: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                RASTREAR MI PROCESO (MAGIC LINK)
                            </a>
                        </p>
                        ` : ''}
                        
                        <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: justify;">
                            Por favor no respondas a este correo. Si tienes dudas, contáctate directamente con el equipo de Recursos Humanos mediante los canales oficiales de DISCOL S.A.S.
                        </p>
                    </div>
                `,
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email de cambio de etapa (${newStage}) enviado a ${email}: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error('❌ Error enviando email de actualización de etapa:', error);
        }
    }

    async sendApplicationConfirmation(email, candidateName, vacancyName, trackingUrl) {
        try {
            if (!email) return;

            const mailOptions = {
                from: `"Gestión Humana DISCOL" <${process.env.SMTP_USER}>`,
                to: email,
                subject: `✅ Postulación Recibida: ${vacancyName} - DISCOL S.A.S.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px 20px; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                        <div style="text-align: center; margin-bottom: 25px;">
                            <h2 style="color: #055098; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">GH-SCORE 360</h2>
                            <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0; font-weight: 600;">Plataforma de Talento · DISCOL S.A.S.</p>
                        </div>
                        
                        <div style="border-top: 3px solid #055098; padding-top: 25px;">
                            <p style="font-size: 16px; color: #1e293b; line-height: 1.6;">Hola <strong>${candidateName}</strong>,</p>
                            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                                ¡Queremos agradecerte por postularte a nuestra vacante! Hemos recibido con éxito tu hoja de vida y toda tu información en el portal público de empleo.
                            </p>
                            
                            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; margin: 25px 0;">
                                <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Vacante Seleccionada</p>
                                <p style="margin: 0 0 15px 0; font-size: 18px; font-weight: 800; color: #0f172a;">${vacancyName}</p>
                                
                                <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Estado Inicial</p>
                                <p style="margin: 0; font-size: 13px; font-weight: bold; color: #0369a1; background-color: #e0f2fe; padding: 4px 10px; border-radius: 6px; display: inline-block;">Postulación Recibida</p>
                            </div>
                            
                            <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                                A partir de este momento, nuestro equipo de Gestión Humana comenzará a evaluar la compatibilidad de tu perfil. Puedes realizar el seguimiento de tu proceso, consultar tus calificaciones y ver los resultados en tiempo real haciendo clic en el siguiente enlace:
                            </p>
                            
                            ${trackingUrl ? `
                            <p style="margin: 30px 0; text-align: center;">
                                <a href="${trackingUrl}" 
                                   style="background-color: #055098; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(5, 80, 152, 0.25);">
                                    VER EL ESTADO DE MI PROCESO
                                </a>
                            </p>
                            ` : ''}
                            
                            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 15px; margin: 25px 0;">
                                <p style="margin: 0; font-size: 12px; color: #166534; font-weight: bold; line-height: 1.5;">
                                    💡 Tip: Guarda este correo. El enlace de arriba es tu acceso directo personal (Magic Link) para revisar las etapas de tu postulación sin necesidad de contraseñas.
                                </p>
                            </div>
                        </div>
                        
                        <div style="border-top: 1px solid #f1f5f9; margin-top: 30px; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
                            <p style="margin: 0 0 5px 0;">Este es un mensaje transaccional enviado automáticamente por GH-SCORE 360.</p>
                            <p style="margin: 0;">&copy; ${new Date().getFullYear()} DISCOL S.A.S. Todos los derechos reservados.</p>
                        </div>
                    </div>
                `,
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email de confirmación enviado exitosamente:', info.messageId);
            return info;
        } catch (error) {
            console.error('❌ Error enviando email de confirmación de postulación:', error);
        }
    }
}

module.exports = new EmailService();
