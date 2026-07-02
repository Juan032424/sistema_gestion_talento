/**
 * MyApplications.tsx
 * Componente actualizado para mostrar aplicaciones con timeline ERP integrado
 * Visualiza: Requisición -> Aspirante -> Seleccionado -> Contratado
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
  Alert,
  TabPanel,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  Check,
  Clock,
  X,
  AlertCircle,
  Download,
  FileText,
  User,
  Briefcase,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { IMiAplicacionERP } from '../types/erp.types';
import axios from 'axios';

interface MyApplicationsProps {
  candidateId?: number;
  apiBaseUrl?: string;
}

const MyApplications: React.FC<MyApplicationsProps> = ({
  candidateId,
  apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
}) => {
  const [aplicaciones, setAplicaciones] = useState<IMiAplicacionERP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<IMiAplicacionERP | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [docsDialog, setDocsDialog] = useState(false);
  const [documentos, setDocumentos] = useState<any>(null);

  // Cargar aplicaciones
  useEffect(() => {
    fetchAplicaciones();
  }, []);

  const fetchAplicaciones = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiBaseUrl}/my-applications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.data.exito) {
        setAplicaciones(response.data.aplicaciones || []);
        setUserInfo(response.data.candidato);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error cargando aplicaciones');
      console.error('[MyApplications] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarDocumentos = async (app: IMiAplicacionERP) => {
    if (!app.idu_contrato) {
      setError('No hay contrato para descargar documentos');
      return;
    }

    try {
      const response = await axios.get(
        `${apiBaseUrl}/my-applications/${app.idu_contrato}/documents`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      setDocumentos(response.data.documentos);
      setDocsDialog(true);
    } catch (err: any) {
      setError('Error cargando documentos');
      console.error(err);
    }
  };

  // Timeline Step Renderer
  const TimelineStep: React.FC<{
    step: number;
    totalSteps: number;
    label: string;
    icon: React.ReactNode;
    estado?: 'completado' | 'activo' | 'pendiente';
    detalles?: string;
  }> = ({ step, totalSteps, label, icon, estado = 'pendiente', detalles }) => {
    const isCompleted = estado === 'completado';
    const isActive = estado === 'activo';

    return (
      <div className="flex flex-col items-center">
        <div
          className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-300'}
            text-white
          `}
        >
          {isCompleted ? <Check size={24} /> : icon}
        </div>
        <div className="mt-2 text-center">
          <p className="font-semibold text-sm">{label}</p>
          {detalles && <p className="text-xs text-gray-500">{detalles}</p>}
        </div>
      </div>
    );
  };

  // Application Card Component
  const ApplicationCard: React.FC<{ app: IMiAplicacionERP }> = ({ app }) => {
    const steps = [
      {
        label: 'Requisición',
        icon: <Briefcase size={20} />,
        estado:
          app.paso_actual >= 1 ? 'completado' : app.paso_actual === 0 ? 'pendiente' : 'pendiente',
      },
      {
        label: 'Aspirante',
        icon: <User size={20} />,
        estado:
          app.paso_actual >= 2 ? 'completado' : app.paso_actual === 2 ? 'activo' : 'pendiente',
      },
      {
        label: 'Seleccionado',
        icon: <CheckCircle size={20} />,
        estado:
          app.paso_actual >= 3 ? 'completado' : app.paso_actual === 3 ? 'activo' : 'pendiente',
      },
      {
        label: 'Contratado',
        icon: <FileText size={20} />,
        estado: app.paso_actual === 4 ? 'completado' : 'pendiente',
      },
    ];

    const getEstadoChipColor = (estado: string) => {
      switch (estado) {
        case 'Seleccionado':
          return 'success';
        case 'No apto':
          return 'error';
        case 'En proceso':
          return 'warning';
        default:
          return 'default';
      }
    };

    return (
      <Card className="mb-4 hover:shadow-lg transition-shadow">
        <CardContent>
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold">{app.puesto_solicitado}</h3>
              <p className="text-sm text-gray-600">
                {app.idu_requisicion} • {app.area}
              </p>
            </div>
            <Chip
              label={app.estado_texto}
              color={app.paso_actual === 4 ? 'success' : 'primary'}
              size="small"
            />
          </div>

          {/* Progress Bar */}
          <Box className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">Progreso</span>
              <span className="text-sm font-bold text-blue-600">{app.progreso_porcentaje}%</span>
            </div>
            <LinearProgress variant="determinate" value={app.progreso_porcentaje} />
          </Box>

          {/* Timeline */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-end gap-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <TimelineStep
                    step={idx + 1}
                    totalSteps={steps.length}
                    label={step.label}
                    icon={step.icon}
                    estado={step.estado as any}
                  />
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 ${
                        steps[idx].estado === 'completado' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            {app.idu_aspirante && (
              <div>
                <p className="text-gray-600">ID Aspirante</p>
                <p className="font-semibold">{app.idu_aspirante}</p>
              </div>
            )}
            {app.puntaje_evaluacion > 0 && (
              <div>
                <p className="text-gray-600">Puntaje</p>
                <p className="font-semibold">{app.puntaje_evaluacion}/100</p>
              </div>
            )}
            {app.fecha_aspiracion && (
              <div>
                <p className="text-gray-600">Aplicó el</p>
                <p className="font-semibold">
                  {new Date(app.fecha_aspiracion).toLocaleDateString('es-CO')}
                </p>
              </div>
            )}
            {app.decision && (
              <div>
                <p className="text-gray-600">Decisión</p>
                <Chip
                  label={app.decision}
                  size="small"
                  color={getEstadoChipColor(app.decision) as any}
                />
              </div>
            )}
          </div>

          {/* Documentos Pendientes */}
          {app.docs_pendientes && app.docs_pendientes.length > 0 && (
            <Alert severity="warning" className="mb-4 text-xs">
              <strong>Documentos pendientes:</strong> {app.docs_pendientes.join(', ')}
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedApp(app)}
              startIcon={<ExternalLink size={16} />}
            >
              Ver Detalle
            </Button>
            {app.puede_descargar && (
              <Button
                variant="contained"
                size="small"
                color="success"
                onClick={() => handleDescargarDocumentos(app)}
                startIcon={<Download size={16} />}
              >
                Descargar Documentos
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Main Render
  if (loading) {
    return (
      <Container maxWidth="md" className="py-8">
        <div className="flex justify-center items-center h-64">
          <Clock className="animate-spin mr-2" size={32} />
          <span>Cargando aplicaciones...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="py-8">
      {/* User Info */}
      {userInfo && (
        <Card className="mb-6 bg-blue-50">
          <CardContent>
            <div className="flex items-center gap-4">
              <User size={32} className="text-blue-600" />
              <div>
                <h2 className="font-bold text-lg">{userInfo.nombre}</h2>
                <p className="text-gray-600 text-sm">
                  Cédula: {userInfo.cedula} • {userInfo.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-blue-600">{aplicaciones.length}</div>
            <p className="text-gray-600 text-sm">Total Solicitudes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {aplicaciones.filter((a) => a.decision === 'Seleccionado').length}
            </div>
            <p className="text-gray-600 text-sm">Seleccionados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {aplicaciones.filter((a) => a.paso_actual === 4).length}
            </div>
            <p className="text-gray-600 text-sm">Contratados</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {aplicaciones.length === 0 ? (
        <Alert severity="info">
          No tienes aplicaciones registradas. ¡Busca oportunidades que se adapten a tu perfil!
        </Alert>
      ) : (
        <>
          <h2 className="text-xl font-bold mb-4">Tu Historial de Aplicaciones</h2>
          {aplicaciones.map((app) => (
            <ApplicationCard key={app.idu_requisicion || app.id} app={app} />
          ))}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedApp?.puesto_solicitado}</DialogTitle>
        <DialogContent>
          {selectedApp && (
            <Box className="space-y-4 mt-4">
              <div>
                <Typography variant="subtitle2" className="font-bold">
                  Información General
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Requisición"
                      secondary={selectedApp.idu_requisicion}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Área"
                      secondary={selectedApp.area}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Estado"
                      secondary={selectedApp.estado_texto}
                    />
                  </ListItem>
                </List>
              </div>

              {selectedApp.idu_aspirante && (
                <div>
                  <Typography variant="subtitle2" className="font-bold">
                    Evaluación
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="ID Aspirante"
                        secondary={selectedApp.idu_aspirante}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Puntaje"
                        secondary={`${selectedApp.puntaje_evaluacion} / 100`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Decisión"
                        secondary={selectedApp.decision}
                      />
                    </ListItem>
                  </List>
                </div>
              )}

              {selectedApp.idu_contrato && (
                <Alert severity="success">
                  ¡Felicidades! Has sido contratado. ID Contrato: {selectedApp.idu_contrato}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedApp(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog
        open={docsDialog}
        onClose={() => setDocsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Documentos de Vinculación</DialogTitle>
        <DialogContent>
          {documentos && (
            <List>
              {Object.entries(documentos).map(([key, value]: [string, any]) => (
                <ListItem key={key}>
                  <ListItemText
                    primary={key.replace(/_/g, ' ').toUpperCase()}
                    secondary={
                      <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                        Descargar
                      </a>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocsDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyApplications;
