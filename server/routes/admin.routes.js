/**
 * Rutas Admin - Gestión de Candidatos ERP
 */

const express = require('express');
const router = express.Router();
const adminCandidatosController = require('./admin-candidatos.controller');

// ✅ PREVIEW - Ver datos a importar sin guardar
router.get('/candidatos/preview', adminCandidatosController.getPreview);

// ✅ ESTADÍSTICAS
router.get('/estadisticas', adminCandidatosController.getEstadisticas);

// ✅ CANDIDATOS - CRUD
router.get('/candidatos', adminCandidatosController.getCandidatos);
router.get('/candidatos/:cedula', adminCandidatosController.getDetalleCandidato);
router.post('/candidatos/registrar', adminCandidatosController.registrarCandidato);
router.put('/candidatos/:cedula', adminCandidatosController.actualizarCandidato);
router.delete('/candidatos/:cedula', adminCandidatosController.eliminarCandidato);

// ✅ IMPORTACIÓN MASIVA
router.post('/candidatos/importar-masivo', adminCandidatosController.importarMasivo);

module.exports = router;
