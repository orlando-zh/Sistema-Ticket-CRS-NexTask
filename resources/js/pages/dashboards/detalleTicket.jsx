import { Link, Head } from '@inertiajs/react';

import axios from 'axios';
import { useEffect, useState } from 'react';
import { ArrowLeft, Paperclip, Eye, Download, FileText, Image, Video, Activity, AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { url } from '@/lib/url';

export default function TicketDetails({ id }) {
    const [ticket, setTicket] = useState(null);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const response = await axios.get(`/agent/ver-ticket/${id}`);
                setTicket(response.data.ticket);
            } catch (error) {
                console.error("Error al obtener detalles del ticket:", error);
            }
        };

        if (id) {
            fetchTicket();
        }
    }, [id]);

    const AttachmentPreview = ({ adj }) => {
        const isImage = adj.type?.startsWith('image/');
        const isVideo = adj.type?.startsWith('video/');
        const viewUrl = url(`/storage/${adj.path}`);
        const downloadUrl = url(`/agent/descargar-adjunto/${adj.id}`);

        if (isImage) {
            return (
                <div className="group relative mt-2 w-full max-w-sm overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img
                        src={viewUrl}
                        alt={adj.name}
                        className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="flex gap-2">
                            <a
                                href={viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-gray-800 shadow-lg hover:bg-gray-100"
                            >
                                <Eye className="h-4 w-4" /> Ver
                            </a>
                            <a
                                href={downloadUrl}
                                className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-red-700"
                            >
                                <Download className="h-4 w-4" /> Bajar
                            </a>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2 text-[10px] font-bold text-gray-700 backdrop-blur-sm">
                        {adj.name}
                    </div>
                </div>
            );
        }

        if (isVideo) {
            return (
                <div className="mt-2 w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-black">
                    <video controls className="max-h-[300px] w-full">
                        <source src={viewUrl} type={adj.type} />
                        Tu navegador no soporta el tag de video.
                    </video>
                    <div className="bg-white p-2 text-[10px] font-bold text-gray-700">
                        {adj.name}
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-2 flex w-full max-w-sm items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                    <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                    <span className="truncate text-xs font-bold text-gray-900">{adj.name}</span>
                    <span className="text-[10px] text-gray-500 uppercase">{adj.type?.split('/')[1] || 'DOC'}</span>
                </div>
                <a
                    href={downloadUrl}
                    className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"
                    title="Descargar"
                >
                    <Download className="h-5 w-5" />
                </a>
            </div>
        );
    };

    const data = ticket

    if (!data) return (
        <div className="flex items-center justify-center min-h-screen">
            Cargando...
        </div>
    );

    return (
        <AppLayout>
            <Head title={`Detalle Ticket #${data.id}`} />

            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-800 font-sans">
                <div className="space-y-6">
                    {/* First Section */}
                    <div className="border border-gray-300 rounded-xl p-6 shadow-sm bg-white border-t-4 border-t-white">
                        <h3 className="text-xl font-bold text-red-600 mb-6">Ticket # {data.id}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm mb-6">
                            <div className="grid grid-cols-2 gap-2 border-b border-gray-50 pb-2">
                                <span className="font-bold text-gray-900 text-xs">Estado</span>
                                <span>{data.estado_del_ticket}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-b border-gray-50 pb-2">
                                <span className="font-bold text-gray-900 text-xs">Nombre</span>
                                <span>{data.nombre}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-b border-gray-50 pb-2">
                                <span className="font-bold text-gray-900 text-xs">Prioridad: {data.prioridad}</span>
                                <span>{data.prioridad}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-b border-gray-50 pb-2">
                                <span className="font-bold text-gray-900 text-xs">Email</span>
                                <span>{data.email}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-b border-gray-50 pb-2">
                                <span className="font-bold text-gray-900 text-xs">Fecha Creacion:</span>
                                <span>{data.fecha_creacion}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-b border-gray-50 pb-2">
                                <span className="font-bold text-gray-900 text-xs">Telefono</span>
                                <span>{data.telefono}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-b border-gray-50 pb-2">
                                <span className="font-bold text-gray-900 text-xs">Asignado a:</span>
                                <span>{data.asignado}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-b border-gray-50 pb-2">
                                <span className="font-bold text-gray-900 text-xs">Temas de ayuda</span>
                                <span>{data.temas_de_ayuda}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 border-b border-gray-50 pb-2">
                                <span className="font-bold text-gray-900 text-xs">Plan SLA:</span>
                                <span>{data.plan_sla}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2"></div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="font-bold text-gray-900 text-xs">Fecha Limite:</span>
                                <span>{data.fecha_limite}</span>
                            </div>
                        </div>

                        <hr className="border-red-200 mb-6" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm">
                            <div>
                                <h4 className="font-bold text-red-600 mb-4 text-[15px]">Departamento Solicitante</h4>
                                <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
                                    <span className="font-bold text-xs text-gray-900">Departamento</span>
                                    <span>{data.departamento_solicitante}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <span className="font-bold text-xs text-gray-900">Area</span>
                                    <span>{data.division_solicitante}</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-red-600 mb-4 text-[15px]">Departamento Receptor</h4>
                                <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
                                    <span className="font-bold text-xs text-gray-900">Area</span>
                                    <span>Direccion Voluntariado y Seccionales</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
                                    <span className="font-bold text-xs text-gray-900">Solicitante</span>
                                    <span>{data.solicitante}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <span className="font-bold text-xs text-gray-900">Problema</span>
                                    <span className="leading-tight text-gray-700">{data.problema}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Second Section: Detalles del problema */}
                    <div className="border border-gray-300 rounded-xl p-6 shadow-sm bg-white">
                        <h3 className="text-[17px] font-bold text-red-600 mb-4">Detalles del problema</h3>
                        <hr className="mb-4 border-gray-300" />

                        <h4 className="font-bold text-sm text-gray-900 mb-2">Computadora no enciende</h4>
                        <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                            {data.detalles_del_problema}
                        </p>

                        <h4 className="font-bold text-sm text-gray-900 mb-2">Adjuntos</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {data.adjuntos && data.adjuntos.length > 0 ? (
                                data.adjuntos.map((adj, idx) => (
                                    <AttachmentPreview key={idx} adj={adj} />
                                ))
                            ) : (
                                <span className="text-xs text-gray-400 italic">Sin adjuntos en el ticket inicial</span>
                            )}
                        </div>
                    </div>

                    {/* Diagnósticos Realizados */}
                    {data.soluciones && data.soluciones.length > 0 && (
                        <div className="border border-gray-300 rounded-xl p-6 shadow-sm bg-white border-l-4 border-l-green-600">
                            <h3 className="text-[17px] font-bold text-green-700 mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5" /> Diagnósticos Finalizados
                            </h3>
                            <div className="space-y-6">
                                {data.soluciones.map((sol, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 -rotate-12 translate-x-8 -translate-y-8 rounded-full"></div>

                                        <div className="flex justify-between items-start mb-4">
                                            <span className="inline-flex items-center rounded-lg bg-green-600 px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider">
                                                {sol.tipo}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-bold bg-white px-2 py-1 rounded-md border border-gray-100">
                                                {new Date(sol.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>

                                        <div className="mb-6">
                                            <h5 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Observaciones del Técnico</h5>
                                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-100 shadow-sm">{sol.mensaje}</p>
                                        </div>

                                        {sol.adjuntos && sol.adjuntos.length > 0 && (
                                            <div className="mt-4">
                                                <h5 className="text-[11px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                                    <Paperclip className="w-3 h-3" /> Evidencias de Diagnóstico
                                                </h5>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {sol.adjuntos.map((adj, sIdx) => (
                                                        <AttachmentPreview key={sIdx} adj={adj} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Incidencias Reportadas */}
                    {data.incidencias && data.incidencias.length > 0 && (
                        <div className="border border-gray-300 rounded-xl p-6 shadow-sm bg-white border-l-4 border-l-red-600">
                            <h3 className="text-[17px] font-bold text-red-700 mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" /> Incidencias Técnicas / Impedimentos
                            </h3>
                            <div className="space-y-6">
                                {data.incidencias.map((inc, idx) => (
                                    <div key={idx} className="bg-red-50/30 rounded-xl p-5 border border-red-100 relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider">
                                                No Resuelto
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-bold bg-white px-2 py-1 rounded-md border border-gray-100">
                                                {new Date(inc.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>

                                        <div className="mt-4">
                                            <h5 className="text-[11px] font-bold text-red-800 uppercase mb-2">Nota Interna</h5>
                                            <div className="text-xs text-slate-700 bg-white/80 p-3 rounded-lg border border-red-100 shadow-sm leading-relaxed whitespace-pre-wrap font-medium italic">
                                                "{inc.internal_note}"
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-end text-[10px] text-slate-400 font-medium">
                                            Reportado por: {inc.tecnico}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Back button */}
                    <div className="pt-2">
                        <Link
                            href={url('/dashboard')}
                            className="inline-flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-xl text-sm font-bold bg-white text-black hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4" /> Volver
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
