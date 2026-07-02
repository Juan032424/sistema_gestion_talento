import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stepper,
    Step,
    StepLabel,
    Card,
    CardContent,
    CardActions,
    Grid,
    Alert,
    LinearProgress,
    Badge,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
} from '@mui/material';
import {
    Edit,
    Delete,
    Download,
    Upload,
    CheckCircle,
    Clock,
    AlertCircle,
    User,
    FileText,
    Building2,
} from 'lucide-react';
import axios from 'axios';

/**
 * Panel Admin para gestionar candidatos del ERP
 * Visualiza, registra y administra el flujo completo
 */

const AdminCandidatos = () => {
    // ESTADO
    const [candidatos, setCandidatos] = useState([]);
    const [requisiciones, setRequisiciones] = useState([]);
    const [aspirantes, setAspirantes] = useState([]);
    const [contrataciones, setContrataciones] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    
    // Diálogos
    const [openRegistro, setOpenRegistro] = useState(false);
    const [openDetalle, setOpenDetalle] = useState(false);
    const [openImportacion, setOpenImportacion] = useState(false);
    
    const [candidatoSeleccionado, setCandidatoSeleccionado] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    
    // Formulario
    const [formData, setFormData] = useState({
        identificacion: '',
        tipoID: 'Cedula',
        nombres: '',
        apellidos: '',
        email: '',
        telefono: '',
        departamento: '',
        ciudad: '',
        nivel_academico: '',
        estado_civil: '',
        genero: '',
        fecha_nacimiento: '',
        tiene_hijos: false,
        cantidad_hijos: 0,
    });

    // CARGAR DATOS
    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/candidatos/preview');
            const { candidatos, requisiciones, aspirantes, contrataciones } = response.data.datos;
            
            setCandidatos(candidatos || []);
            setRequisiciones(requisiciones || []);
            setAspirantes(aspirantes || []);
            setContrataciones(contrataciones || []);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    // FILTRAR CANDIDATOS
    const candidatosFiltrados = candidatos.filter(c => {
        const coincide = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                        c.identificacion.includes(busqueda) ||
                        c.email.toLowerCase().includes(busqueda.toLowerCase());
        
        if (filtroEstado === 'todos') return coincide;
        if (filtroEstado === 'registrados') return coincide && c.registrado_en_sistema;
        if (filtroEstado === 'sin_registrar') return coincide && !c.registrado_en_sistema;
        
        return coincide;
    });

    // REGISTRAR CANDIDATO
    const registrarCandidato = async () => {
        try {
            const response = await axios.post('/api/admin/candidatos/registrar', {
                ...formData,
                fuente: 'ERP_IMPORT'
            });
            
            if (response.data.exito) {
                alert('✅ Candidato registrado exitosamente');
                setOpenRegistro(false);
                resetForm();
                cargarDatos();
            }
        } catch (error) {
            alert('❌ Error al registrar: ' + error.response?.data?.mensaje);
        }
    };

    // IMPORTAR MASIVAMENTE
    const importarMasivo = async () => {
        try {
            setLoading(true);
            const response = await axios.post('/api/admin/candidatos/importar-masivo');
            
            if (response.data.exito) {
                alert(`✅ Se importaron ${response.data.cantidad} candidatos`);
                setOpenImportacion(false);
                cargarDatos();
            }
        } catch (error) {
            alert('❌ Error en importación: ' + error.response?.data?.mensaje);
        } finally {
            setLoading(false);
        }
    };

    // CAMBIOS EN FORMULARIO
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // RESETEAR FORMULARIO
    const resetForm = () => {
        setFormData({
            identificacion: '',
            tipoID: 'Cedula',
            nombres: '',
            apellidos: '',
            email: '',
            telefono: '',
            departamento: '',
            ciudad: '',
            nivel_academico: '',
            estado_civil: '',
            genero: '',
            fecha_nacimiento: '',
            tiene_hijos: false,
            cantidad_hijos: 0,
        });
    };

    // VER DETALLE
    const verDetalle = (candidato) => {
        setCandidatoSeleccionado(candidato);
        setOpenDetalle(true);
    };

    // COMPONENTE: CANDIDATO EN TABLA
    const RowCandidato = ({ candidato }) => {
        const aspirante = aspirantes.find(a => a.numero_cedula === candidato.identificacion);
        const contrato = contrataciones.find(c => c.numero_cedula === candidato.identificacion);
        
        const paso = !aspirante ? 1 : !contrato ? 2 : 3;
        const pasos = ['', 'En requisición', 'En evaluación', 'Contratado'];

        return (
            <TableRow hover>
                <TableCell>{candidato.identificacion}</TableCell>
                <TableCell>
                    <Box className="flex items-center gap-2">
                        <User size={16} />
                        {candidato.nombre}
                    </Box>
                </TableCell>
                <TableCell>{candidato.email}</TableCell>
                <TableCell>{candidato.telefono}</TableCell>
                <TableCell>
                    <Chip
                        label={pasos[paso]}
                        color={paso === 3 ? 'success' : paso === 2 ? 'warning' : 'default'}
                        size="small"
                        icon={paso === 3 ? <CheckCircle size={14} /> : <Clock size={14} />}
                    />
                </TableCell>
                <TableCell align="right">
                    <Button
                        size="small"
                        startIcon={<FileText size={16} />}
                        onClick={() => verDetalle(candidato)}
                    >
                        Ver
                    </Button>
                </TableCell>
            </TableRow>
        );
    };

    // COMPONENTE: TARJETA REQUISICIÓN
    const TarjetaRequisicion = ({ requisicion }) => {
        const aspirantesReq = aspirantes.filter(a => a.idu_requisicion === requisicion.idu_requisicion);
        const contratadosReq = contrataciones.filter(c => c.idu_requisicion === requisicion.idu_requisicion);

        return (
            <Card className="mb-4">
                <CardContent>
                    <Box className="flex justify-between items-start mb-3">
                        <Box>
                            <Typography variant="h6">{requisicion.puesto_solicitado}</Typography>
                            <Typography color="textSecondary" className="flex items-center gap-1">
                                <Building2 size={14} /> {requisicion.idu_requisicion}
                            </Typography>
                        </Box>
                        <Chip label={`${requisicion.numero_vacantes} vacante(s)`} color="primary" />
                    </Box>

                    <Box className="bg-gray-100 p-3 rounded mb-3">
                        <Typography variant="body2">
                            <strong>Solicitante:</strong> {requisicion.nombre_solicitante}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Nivel:</strong> {requisicion.nivel_educativo}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Experiencia:</strong> {requisicion.experiencia}
                        </Typography>
                    </Box>

                    {/* Mini estadísticas */}
                    <Box className="flex gap-3">
                        <Box className="text-center">
                            <Typography variant="h6" color="primary">{aspirantesReq.length}</Typography>
                            <Typography variant="caption">Aspirantes</Typography>
                        </Box>
                        <Box className="text-center">
                            <Typography variant="h6" color="success.main">{contratadosReq.length}</Typography>
                            <Typography variant="caption">Contratados</Typography>
                        </Box>
                        <Box className="text-center">
                            <LinearProgress
                                variant="determinate"
                                value={(contratadosReq.length / requisicion.numero_vacantes) * 100}
                                className="w-24"
                            />
                            <Typography variant="caption">Avance</Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    // DIÁLOGO: DETALLE CANDIDATO
    const DialogDetalle = () => {
        if (!candidatoSeleccionado) return null;

        const aspirante = aspirantes.find(a => a.numero_cedula === candidatoSeleccionado.identificacion);
        const contrato = contrataciones.find(c => c.numero_cedula === candidatoSeleccionado.identificacion);
        const requisicion = requisiciones.find(r => r.idu_requisicion === aspirante?.idu_requisicion);

        return (
            <Dialog open={openDetalle} onClose={() => setOpenDetalle(false)} maxWidth="md" fullWidth>
                <DialogTitle>Perfil de Candidato</DialogTitle>
                <DialogContent className="space-y-4">
                    
                    {/* Datos Personales */}
                    <Box className="bg-blue-50 p-4 rounded-lg">
                        <Typography variant="h6" className="mb-2">👤 Datos Personales</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2"><strong>Cédula:</strong> {candidatoSeleccionado.identificacion}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2"><strong>Nombre:</strong> {candidatoSeleccionado.nombre}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2"><strong>Email:</strong> {candidatoSeleccionado.email}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2"><strong>Teléfono:</strong> {candidatoSeleccionado.telefono}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2"><strong>Fecha Nac:</strong> {candidatoSeleccionado.fecha_nacimiento}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2"><strong>Género:</strong> {candidatoSeleccionado.genero}</Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Ubicación */}
                    <Box className="bg-green-50 p-4 rounded-lg">
                        <Typography variant="h6" className="mb-2">📍 Ubicación</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2"><strong>Departamento:</strong> {candidatoSeleccionado.departamento}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2"><strong>Ciudad:</strong> {candidatoSeleccionado.ciudad}</Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Académica */}
                    <Box className="bg-purple-50 p-4 rounded-lg">
                        <Typography variant="h6" className="mb-2">🎓 Formación</Typography>
                        <Typography variant="body2"><strong>Nivel Académico:</strong> {candidatoSeleccionado.nivel_academico}</Typography>
                    </Box>

                    {/* Timeline del Proceso */}
                    <Box className="bg-gray-50 p-4 rounded-lg">
                        <Typography variant="h6" className="mb-3">📋 Proceso de Contratación</Typography>
                        <Stepper orientation="vertical">
                            <Step active>
                                <StepLabel>Candidato Pre-Registrado</StepLabel>
                            </Step>
                            <Step active={!!aspirante}>
                                <StepLabel>
                                    Aplicación Registrada
                                    {aspirante && ` - ${aspirante.idu_requisicion}`}
                                </StepLabel>
                            </Step>
                            <Step active={!!contrato}>
                                <StepLabel>
                                    Contratado
                                    {contrato && ` - ${contrato.puesto_contratado}`}
                                </StepLabel>
                            </Step>
                        </Stepper>
                    </Box>

                    {/* Requisición */}
                    {requisicion && (
                        <Box className="bg-yellow-50 p-4 rounded-lg">
                            <Typography variant="h6" className="mb-2">📢 Requisición {requisicion.idu_requisicion}</Typography>
                            <Typography variant="body2"><strong>Puesto:</strong> {requisicion.puesto_solicitado}</Typography>
                            <Typography variant="body2"><strong>Fecha:</strong> {requisicion.fecha_creacion}</Typography>
                        </Box>
                    )}

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetalle(false)}>Cerrar</Button>
                    <Button variant="contained" startIcon={<Upload size={16} />}>
                        Registrar Oficial
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    // RENDER
    return (
        <Container maxWidth="lg" className="py-8">
            
            {/* HEADER */}
            <Box className="mb-6">
                <Typography variant="h4" className="mb-2">🏢 Gestión de Candidatos ERP</Typography>
                <Typography color="textSecondary">
                    Visualiza y registra candidatos del sistema ERP de Talento Humano
                </Typography>
            </Box>

            {/* ALERTS */}
            {loading && <LinearProgress className="mb-4" />}
            {!loading && candidatos.length === 0 && (
                <Alert severity="info" className="mb-4">
                    <AlertCircle size={16} className="mr-2" />
                    No hay datos cargados. Ejecuta first el script de previsualización.
                </Alert>
            )}

            {/* CONTROLES */}
            <Box className="flex gap-3 mb-6 flex-wrap">
                <TextField
                    placeholder="Buscar por cédula, nombre o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    variant="outlined"
                    size="small"
                    className="flex-1"
                />
                <FormControl size="small" className="w-40">
                    <InputLabel>Estado</InputLabel>
                    <Select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        label="Estado"
                    >
                        <MenuItem value="todos">Todos</MenuItem>
                        <MenuItem value="registrados">Registrados</MenuItem>
                        <MenuItem value="sin_registrar">Sin Registrar</MenuItem>
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Upload size={16} />}
                    onClick={() => setOpenImportacion(true)}
                >
                    Importar Masivo
                </Button>
                <Button
                    variant="contained"
                    startIcon={<User size={16} />}
                    onClick={() => setOpenRegistro(true)}
                >
                    Nuevo Candidato
                </Button>
            </Box>

            {/* TABS */}
            <Box className="flex gap-2 mb-4 border-b">
                <Button
                    onClick={() => setActiveTab(0)}
                    className={activeTab === 0 ? 'border-b-2 border-blue-500' : ''}
                >
                    {`📋 Candidatos (${candidatosFiltrados.length})`}
                </Button>
                <Button
                    onClick={() => setActiveTab(1)}
                    className={activeTab === 1 ? 'border-b-2 border-blue-500' : ''}
                >
                    {`💼 Requisiciones (${requisiciones.length})`}
                </Button>
                <Button
                    onClick={() => setActiveTab(2)}
                    className={activeTab === 2 ? 'border-b-2 border-blue-500' : ''}
                >
                    {`✅ Contrataciones (${contrataciones.length})`}
                </Button>
            </Box>

            {/* TAB: CANDIDATOS */}
            {activeTab === 0 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow className="bg-gray-100">
                                <TableCell><strong>Cédula</strong></TableCell>
                                <TableCell><strong>Nombre</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>Teléfono</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell align="right"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {candidatosFiltrados.map((candidato, idx) => (
                                <RowCandidato key={idx} candidato={candidato} />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* TAB: REQUISICIONES */}
            {activeTab === 1 && (
                <Box>
                    {requisiciones.map((req, idx) => (
                        <TarjetaRequisicion key={idx} requisicion={req} />
                    ))}
                </Box>
            )}

            {/* TAB: CONTRATACIONES */}
            {activeTab === 2 && (
                <Box className="space-y-3">
                    {contrataciones.map((contrato, idx) => (
                        <Card key={idx}>
                            <CardContent>
                                <Box className="flex justify-between">
                                    <Box>
                                        <Typography variant="h6">{contrato.nombre_completo}</Typography>
                                        <Typography color="textSecondary">{contrato.puesto_contratado}</Typography>
                                    </Box>
                                    <Box className="text-right">
                                        <Chip label={contrato.estado_contrato} color="success" size="small" />
                                        <Typography variant="caption" display="block">
                                            Contrato: {contrato.idu_contrato}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* DIÁLOGOS */}
            <DialogDetalle />

            {/* DIÁLOGO: REGISTRO NUEVO */}
            <Dialog open={openRegistro} onClose={() => setOpenRegistro(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Registrar Nuevo Candidato</DialogTitle>
                <DialogContent className="space-y-4">
                    <TextField
                        fullWidth
                        label="Cédula"
                        name="identificacion"
                        value={formData.identificacion}
                        onChange={handleChange}
                        margin="normal"
                    />
                    <FormControl fullWidth>
                        <InputLabel>Tipo de ID</InputLabel>
                        <Select
                            name="tipoID"
                            value={formData.tipoID}
                            onChange={handleChange}
                            label="Tipo de ID"
                        >
                            <MenuItem value="Cedula">Cédula</MenuItem>
                            <MenuItem value="Pasaporte">Pasaporte</MenuItem>
                            <MenuItem value="Tarjeta Identidad">Tarjeta Identidad</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        label="Nombres"
                        name="nombres"
                        value={formData.nombres}
                        onChange={handleChange}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Apellidos"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleChange}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Teléfono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Departamento"
                        name="departamento"
                        value={formData.departamento}
                        onChange={handleChange}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Ciudad"
                        name="ciudad"
                        value={formData.ciudad}
                        onChange={handleChange}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRegistro(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={registrarCandidato}>
                        Registrar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* DIÁLOGO: IMPORTACIÓN MASIVA */}
            <Dialog open={openImportacion} onClose={() => setOpenImportacion(false)}>
                <DialogTitle>Importación Masiva</DialogTitle>
                <DialogContent>
                    <Box className="py-4">
                        <Alert severity="info">  
                            Se importarán automáticamente:
                        </Alert>
                        <Box className="mt-4 space-y-2">
                            <Typography>✅ {candidatos.length} Candidatos</Typography>
                            <Typography>✅ {requisiciones.length}  Requisiciones</Typography>
                            <Typography>✅ {aspirantes.length} Aspirantes</Typography>
                            <Typography>✅ {contrataciones.length} Contrataciones</Typography>
                        </Box>
                        <Typography variant="caption" display="block" className="mt-4">
                            Total: {candidatos.length + requisiciones.length + aspirantes.length + contrataciones.length} registros
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenImportacion(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={importarMasivo} disabled={loading}>
                        {loading ? 'Importando...' : 'Importar'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

export default AdminCandidatos;
