import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Clock, Activity } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import AgentKpis from '@/components/componts-agent/AgentKpis';
import AgentFilters from '@/components/componts-agent/AgentFilters';
import AgentTicketsTable from '@/components/componts-agent/AgentTicketsTable';
import DiagnosisPanel from '@/components/componts-agent/DiagnosisPanel';
import UnresolvedModal from '@/components/componts-agent/UnresolvedModal';

export default function AgentDashboard() {
    const [ticketsPaginados, setTicketsPaginados] = useState({ data: [], links: [], current_page: 1, last_page: 1 });
    const [historialFinalizados, setHistorialFinalizados] = useState([]);
    const [estadisticas, setEstadisticas] = useState(null);
    const [solutionTypes, setSolutionTypes] = useState([]);
    const [availableStatuses, setAvailableStatuses] = useState([]);
    const [availablePriorities, setAvailablePriorities] = useState([]);

    const [activeView, setActiveView] = useState('main');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos los estados');
    const [priorityFilter, setPriorityFilter] = useState('Todas las prioridades');
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [showDiagnosticPanel, setShowDiagnosticPanel] = useState(false);
    const [tipoDiagnostico, setTipoDiagnostico] = useState('');
    const [customDiagnosticType, setCustomDiagnosticType] = useState('');
    const [showCustomDiagnostic, setShowCustomDiagnostic] = useState(false);
    const [observacionDiagnostico, setObservacionDiagnostico] = useState('');
    const [adjuntosDiagnostico, setAdjuntosDiagnostico] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showUnresolvedModal, setShowUnresolvedModal] = useState(false);
    const [unresolvedData, setUnresolvedData] = useState({
        internal_note: ''
    });
    const [validationErrors, setValidationErrors] = useState({});

    const fetchData = useCallback(async (page = 1, search = '', status = 'Todos los estados', priority = 'Todas las prioridades') => {
        setIsLoading(true);
        try {
            const response = await axios.get('/agent/dashboard-data', {
                params: {
                    page,
                    search,
                    status,
                    priority
                }
            });

            setTicketsPaginados(response.data.tickets_asignados || { data: [], links: [], current_page: 1, last_page: 1 });
            setHistorialFinalizados(response.data.historial_finalizados || []);
            setEstadisticas(response.data.estadisticas || null);
            setSolutionTypes(response.data.solution_types || []);
            setAvailableStatuses(response.data.statuses || []);
            setAvailablePriorities(response.data.available_priorities || []);
        } catch (error) {
            console.error('Error al obtener datos del dashboard:', error);
            toast.error('Error al cargar los tickets');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchData(currentPage, searchTerm, statusFilter, priorityFilter);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [currentPage, searchTerm, statusFilter, priorityFilter, fetchData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, priorityFilter]);

    useEffect(() => {
        if (currentPage > 1 || (ticketsPaginados.total > 0)) {
            const tableElement = document.getElementById('tickets-table-container');
            if (tableElement) {
                tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [currentPage, ticketsPaginados.total]);

    const historialData = historialFinalizados.map(ticket => ({
        id: ticket.id,
        asunto: ticket.subject || ticket.asunto,
        departamento: ticket.department?.name || 'N/A',
        fecha_asignacion: ticket.creation_date ? new Date(ticket.creation_date).toLocaleDateString('es-ES') : 'N/A',
        fecha_finalizacion: (ticket.closing_date || ticket.updated_at) ? new Date(ticket.closing_date || ticket.updated_at).toLocaleDateString('es-ES') : 'N/A',
    }));

    const stats = estadisticas || {
        tasa_resolucion_porcentaje: 0,
        total_tickets_cola: 0,
        total_tickets_asignados: 0,
        total_tickets_proceso: 0,
        total_tickets_resueltos: 0,
    };

    const ticketsAsignados = ticketsPaginados.data;
    const uniqueStatuses = availableStatuses;
    const displayedTickets = ticketsAsignados;

    const submitDiagnostic = async () => {
        setValidationErrors({});
        try {
            if (!selectedTicketId) {
                toast.error('Debe seleccionar un ticket.');
                return;
            }

            if (!observacionDiagnostico.trim()) {
                toast.error('La observación del diagnóstico es obligatoria.');
                return;
            }

            if (adjuntosDiagnostico.length === 0) {
                toast.error('Debe adjuntar al menos un archivo como evidencia.');
                return;
            }

            setIsSubmitting(true);

            const diagnosticType = showCustomDiagnostic && customDiagnosticType.trim()
                ? customDiagnosticType.trim()
                : (tipoDiagnostico || 'General');

            const formData = new FormData();
            formData.append('tipo_diagnostico', diagnosticType);
            formData.append('observacion', observacionDiagnostico);

            adjuntosDiagnostico.forEach(file => {
                formData.append('adjuntos[]', file);
            });

            await axios.post(`/agent/ticket/${selectedTicketId}/diagnostico`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Diagnóstico registrado exitosamente.');
            setTipoDiagnostico('');
            setCustomDiagnosticType('');
            setShowCustomDiagnostic(false);
            setObservacionDiagnostico('');
            setAdjuntosDiagnostico([]);
            setSelectedTicketId(null);
            setShowDiagnosticPanel(false);

            fetchData(currentPage, searchTerm, statusFilter, priorityFilter);
        } catch (error) {
            if (error.response && error.response.status === 422) {
                const errors = error.response.data.errors;
                setValidationErrors(errors || {});

                if (errors) {
                    const firstError = Object.values(errors)[0][0];
                    toast.error(firstError);
                } else if (error.response.data.message) {
                    toast.error(error.response.data.message);
                } else {
                    toast.error('Campos de diagnóstico inválidos.');
                }
            } else {
                console.error('Error al guardar diagnóstico:', error);
                toast.error(error.response?.data?.message || 'Ocurrió un error al guardar el diagnóstico.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitUnresolved = async () => {
        setValidationErrors({});
        try {
            if (!selectedTicketId) return;

            setIsSubmitting(true);
            const formData = new FormData();
            formData.append('internal_note', unresolvedData.internal_note);

            await axios.post(`/agent/ticket/${selectedTicketId}/no-resolver`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Reporte de incidencia enviado con éxito');
            setUnresolvedData({ internal_note: '' });
            setShowUnresolvedModal(false);
            setSelectedTicketId(null);
            setShowDiagnosticPanel(false);

            fetchData(currentPage, searchTerm, statusFilter, priorityFilter);
        } catch (error) {
            if (error.response && error.response.status === 422) {
                const errors = error.response.data.errors;
                setValidationErrors(errors);

                const firstError = Object.values(errors)[0][0];
                toast.error(firstError);
            } else {
                console.error('Error al enviar reporte de incidencia:', error);
                toast.error('Error crítico al enviar el reporte. Por favor intente más tarde.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto flex h-full w-full flex-col space-y-6 p-4 font-sans text-gray-800 sm:p-6 md:p-6 lg:p-8 animate-in fade-in duration-300">
            <Toaster position="top-right" richColors />

            {/* KPI Cards */}
            <AgentKpis stats={stats} />

            {/* Search Bar & Filters */}
            <AgentFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                availablePriorities={availablePriorities}
                uniqueStatuses={uniqueStatuses}
                activeView={activeView}
                setActiveView={setActiveView}
            />

            {/* Historial de Tickets */}
            {activeView === 'historial' && (
                <div className="animate-in fade-in slide-in-from-top-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm duration-300">
                    <div className="flex items-center gap-2 border-b border-gray-100 p-4">
                        <Clock className="h-5 w-5 text-red-500" />
                        <h3 className="font-bold text-gray-800">Historial de Tickets</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {historialData.length > 0 ? (
                            historialData.map((ticket, idx) => (
                                <div key={idx} className="flex items-start justify-between p-4 transition-colors hover:bg-gray-50">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">{ticket.asunto}</h4>
                                        <div className="mt-1 text-xs text-gray-500 uppercase">
                                            #{ticket.id} | {ticket.departamento}
                                        </div>
                                        <div className="mt-1 text-xs text-gray-400">
                                            <span className="block">Asignado: {ticket.fecha_asignacion}</span>
                                            <span className="block">Finalizado: {ticket.fecha_finalizacion}</span>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold whitespace-nowrap text-green-700">
                                        Resuelto
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-xs text-gray-400 font-medium">
                                No se encontraron tickets finalizados en el historial.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mis Estadísticas */}
            {activeView === 'estadisticas' && (
                <div className="animate-in fade-in slide-in-from-top-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm duration-300">
                    <div className="mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-red-500" />
                        <h3 className="font-bold text-gray-800">Mis Estadísticas</h3>
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div className="flex flex-col justify-center rounded-lg border border-gray-100 bg-gray-50 p-4">
                            <div className="mb-1 text-xs font-semibold text-gray-500">Tasa de Resolución</div>
                            <div className="text-xl font-bold">{stats.tasa_resolucion_porcentaje}%</div>
                        </div>
                        <div className="flex flex-col justify-center rounded-lg border border-gray-100 bg-gray-50 p-4">
                            <div className="mb-1 text-xs font-semibold text-gray-500">Tickets en Cola</div>
                            <div className="text-xl font-bold">{stats.total_tickets_cola}</div>
                        </div>
                        <div className="flex flex-col justify-center rounded-lg border border-gray-100 bg-gray-50 p-4">
                            <div className="mb-1 text-xs font-semibold text-gray-500">Total Resueltos</div>
                            <div className="text-xl font-bold">{stats.total_tickets_resueltos}</div>
                        </div>
                        <div className="flex flex-col justify-center rounded-lg border border-red-100 bg-red-50 p-4">
                            <div className="mb-1 text-xs font-semibold text-red-700 uppercase">Urgentes</div>
                            <div className="text-xl font-bold text-red-800">{stats.total_tickets_criticos || 0}</div>
                        </div>
                    </div>

                    <div className="mt-2 mb-3 text-sm font-semibold text-gray-700">Distribución por Prioridad (Tickets Activos)</div>
                    <div className="space-y-3 px-2">
                        {(() => {
                            const priorityData = stats.prioridades || {};
                            const totalTickets = stats.total_tickets_cola || 0;
                            const priorities = [
                                { name: 'Urgente', color: 'bg-red-700', count: priorityData['Urgente'] || 0 },
                                { name: 'Alta', color: 'bg-red-500', count: priorityData['Alta'] || 0 },
                                { name: 'Media', color: 'bg-yellow-400', count: priorityData['Media'] || 0 },
                                { name: 'Baja', color: 'bg-blue-500', count: priorityData['Baja'] || 0 },
                            ];

                            return priorities.map((priority) => {
                                const percentage = totalTickets > 0 ? (priority.count / totalTickets) * 100 : 0;
                                return (
                                    <div key={priority.name} className="flex items-center text-sm">
                                        <div className="w-16 text-xs text-gray-500">{priority.name}</div>
                                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                                            <div className={`${priority.color} h-full rounded-full`} style={{ width: `${percentage}%` }}></div>
                                        </div>
                                        <div className="ml-2 w-4 text-right text-xs text-gray-500">{priority.count}</div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}

            {/* Tickets Asignados */}
            <AgentTicketsTable
                displayedTickets={displayedTickets}
                isLoading={isLoading}
                ticketsPaginados={ticketsPaginados}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                setSelectedTicketId={setSelectedTicketId}
                setShowDiagnosticPanel={setShowDiagnosticPanel}
            />

            {/* Realizar Diagnóstico */}
            {showDiagnosticPanel && (
                <DiagnosisPanel
                    selectedTicketId={selectedTicketId}
                    setShowDiagnosticPanel={setShowDiagnosticPanel}
                    ticketsAsignados={ticketsAsignados}
                    solutionTypes={solutionTypes}
                    submitDiagnostic={submitDiagnostic}
                    isSubmitting={isSubmitting}
                    setShowUnresolvedModal={setShowUnresolvedModal}
                    tipoDiagnostico={tipoDiagnostico}
                    setTipoDiagnostico={setTipoDiagnostico}
                    customDiagnosticType={customDiagnosticType}
                    setCustomDiagnosticType={setCustomDiagnosticType}
                    showCustomDiagnostic={showCustomDiagnostic}
                    setShowCustomDiagnostic={setShowCustomDiagnostic}
                    observacionDiagnostico={observacionDiagnostico}
                    setObservacionDiagnostico={setObservacionDiagnostico}
                    adjuntosDiagnostico={adjuntosDiagnostico}
                    setAdjuntosDiagnostico={setAdjuntosDiagnostico}
                />
            )}

            {/* No Puede Resolver */}
            <UnresolvedModal
                showUnresolvedModal={showUnresolvedModal}
                setShowUnresolvedModal={setShowUnresolvedModal}
                unresolvedData={unresolvedData}
                setUnresolvedData={setUnresolvedData}
                validationErrors={validationErrors}
                isSubmitting={isSubmitting}
                submitUnresolved={submitUnresolved}
            />
        </div>
    );
}
