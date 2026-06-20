import React from 'react';
import { Link } from '@inertiajs/react';
import { AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { url } from '@/lib/url';

export default function AgentTicketsTable({
    displayedTickets,
    isLoading,
    ticketsPaginados,
    currentPage,
    setCurrentPage,
    setSelectedTicketId,
    setShowDiagnosticPanel
}) {
    return (
        <div id="tickets-table-container" className="scroll-mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <h3 className="font-bold text-gray-800">Tickets Asignados</h3>
                </div>
                {isLoading && (
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400 animate-pulse">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        Actualizando datos...
                    </div>
                )}
            </div>
            <div className="relative overflow-x-auto">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px] transition-all">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
                    </div>
                )}

                <table className={`w-full text-left text-sm whitespace-nowrap md:whitespace-normal transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                    <thead className="bg-gray-50/50 text-xs font-bold tracking-wider text-red-600 uppercase">
                        <tr>
                            <th className="px-4 py-4">Código</th>
                            <th className="px-4 py-4">Asunto</th>
                            <th className="px-4 py-4">Departamento</th>
                            <th className="px-4 py-4">Estado</th>
                            <th className="px-4 py-4">Prioridad</th>
                            <th className="px-4 py-4">Creado Por</th>
                            <th className="px-4 py-4 text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                        {displayedTickets.length > 0 ? (
                            displayedTickets.map((row, i) => (
                                <tr key={i} className="transition-colors hover:bg-blue-50/30">
                                    <td className="px-4 py-4 text-xs font-semibold">{row.code || row.id}</td>
                                    <td className="min-w-[200px] px-4 py-4 text-xs leading-tight font-medium">{row.asunto || row.subject}</td>
                                    <td className="px-4 py-4 text-xs font-bold uppercase">{row.departamento || row.department?.name}</td>

                                    <td className="px-4 py-4 text-xs">
                                        {(() => {
                                            const status = row.estado || row.status?.name || 'N/A';
                                            const statusLower = status.toLowerCase();

                                            if (statusLower === 'abierto' || statusLower === 'nuevo') {
                                                return (
                                                    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
                                                        <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
                                                        {status}
                                                    </span>
                                                );
                                            } else if (
                                                statusLower === 'en proceso' ||
                                                statusLower === 'proceso' ||
                                                statusLower === 'progreso' ||
                                                statusLower === 'en progreso'
                                            ) {
                                                return (
                                                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
                                                        <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
                                                        {status}
                                                    </span>
                                                );
                                            } else if (
                                                statusLower === 'cerrado' ||
                                                statusLower === 'resuelto' ||
                                                statusLower === 'finalizado'
                                            ) {
                                                return (
                                                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-800">
                                                        <span className="mr-1.5 h-2 w-2 rounded-full bg-gray-500"></span>
                                                        {status}
                                                    </span>
                                                );
                                            } else if (statusLower === 'pendiente' || statusLower === 'esperando') {
                                                return (
                                                    <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-800">
                                                        <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-orange-500"></span>
                                                        {status}
                                                    </span>
                                                );
                                            } else if (statusLower === 'no resuelto') {
                                                return (
                                                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                                                        <span className="mr-1.5 h-2 w-2 rounded-full bg-amber-500"></span>
                                                        {status}
                                                    </span>
                                                );
                                            } else if (statusLower === 'cancelado') {
                                                return (
                                                    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800">
                                                        <span className="mr-1.5 h-2 w-2 rounded-full bg-red-500"></span>
                                                        {status}
                                                    </span>
                                                );
                                            } else {
                                                return (
                                                    <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800">
                                                        <span className="mr-1.5 h-2 w-2 rounded-full bg-purple-500"></span>
                                                        {status}
                                                    </span>
                                                );
                                            }
                                        })()}
                                    </td>

                                    <td className="px-4 py-4 text-xs">
                                        {(() => {
                                            const priority = row.prioridad || row.priority?.name || 'N/A';
                                            const priorityLower = priority.toLowerCase();

                                            if (priorityLower === 'alta' || priorityLower === 'crítica' || priorityLower === 'critica') {
                                                return (
                                                    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800">
                                                        <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
                                                        {priority}
                                                    </span>
                                                );
                                            } else if (priorityLower === 'media' || priorityLower === 'normal') {
                                                return (
                                                    <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-800">
                                                        <span className="mr-1.5 h-2 w-2 rounded-full bg-yellow-500"></span>
                                                        {priority}
                                                    </span>
                                                );
                                            } else if (priorityLower === 'baja') {
                                                return (
                                                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
                                                        <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
                                                        {priority}
                                                    </span>
                                                );
                                            } else {
                                                return (
                                                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-800">
                                                        <span className="mr-1.5 h-2 w-2 rounded-full bg-gray-500"></span>
                                                        {priority}
                                                    </span>
                                                );
                                            }
                                        })()}
                                    </td>

                                    <td className="px-4 py-4 text-xs leading-tight text-gray-500">
                                        <div dangerouslySetInnerHTML={{ __html: (row.creado_por || '').replace('\n', '<br/>') }} />
                                    </td>

                                    <td className="flex min-w-[160px] flex-col items-center gap-3 px-4 py-4">
                                        <Link
                                            href={url(`/agent/ticket/${row.id}`)}
                                            className="w-full rounded bg-blue-500 px-4 py-3 text-center text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-600"
                                        >
                                            Ver Detalles
                                        </Link>
                                        {(() => {
                                            const status = row.estado || row.status?.name || '';
                                            const statusLower = status.toLowerCase();
                                            const isTerminal =
                                                statusLower === 'cerrado' ||
                                                statusLower === 'resuelto' ||
                                                statusLower === 'finalizado' ||
                                                statusLower === 'no resuelto';

                                            const tieneDiagnostico = row.tiene_diagnostico;

                                            if (isTerminal) {
                                                const label = statusLower === 'no resuelto' ? 'Incidencia Reportada' : 'Diagnóstico Realizado';
                                                return (
                                                    <div className={`w-full px-4 py-3 text-center text-xs font-medium ${statusLower === 'no resuelto' ? 'text-amber-600' : 'text-green-600'}`}>
                                                        {label}
                                                    </div>
                                                );
                                            } else if (tieneDiagnostico) {
                                                return (
                                                    <div className="w-full px-4 py-3 text-center text-xs font-medium text-green-600">
                                                        Diagnóstico Realizado
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTicketId(row.id);
                                                            setShowDiagnosticPanel(true);
                                                            setTimeout(() => {
                                                                document
                                                                    .getElementById('diagnostico-section')
                                                                    ?.scrollIntoView({ behavior: 'smooth' });
                                                            }, 100);
                                                        }}
                                                        className="w-full rounded bg-red-500 px-4 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-600"
                                                    >
                                                        Realizar Diagnóstico
                                                    </button>
                                                );
                                            }
                                        })()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="h-8 w-8 text-gray-300" />
                                        <p className="font-medium">No se encontraron tickets con los filtros actuales</p>
                                        <p className="text-xs">Intenta ajustar tu búsqueda o filtros de estado</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || isLoading}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, ticketsPaginados.last_page))}
                        disabled={currentPage === ticketsPaginados.last_page || isLoading}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-700">
                            Mostrando <span className="font-medium">{ticketsPaginados.from || 0}</span> a <span className="font-medium">{ticketsPaginados.to || 0}</span> de{' '}
                            <span className="font-medium">{ticketsPaginados.total || 0}</span> resultados
                        </p>
                        <div className="h-4 w-px bg-gray-200"></div>
                        <p className="text-xs font-medium text-gray-500">
                            Página <span className="text-gray-900">{currentPage}</span> de <span className="text-gray-900">{ticketsPaginados.last_page || 1}</span>
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1 || isLoading}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                            >
                                <span className="sr-only">Anterior</span>
                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            </button>

                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold z-10 bg-red-600 text-white ring-1 ring-inset ring-red-600">
                                {currentPage}
                            </span>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, ticketsPaginados.last_page))}
                                disabled={currentPage === ticketsPaginados.last_page || isLoading}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                            >
                                <span className="sr-only">Siguiente</span>
                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}
