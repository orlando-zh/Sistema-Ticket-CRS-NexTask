<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketSolution;
use App\Models\User;
use App\Models\Status;
use App\Models\Attachment;
use App\Models\SolutionType;
use App\Models\TicketHistory;
use App\Enums\ActionTypeEnum;
use App\Enums\TicketStatusEnum;
use App\Notifications\TicketUnresolvedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Pagination\LengthAwarePaginator;

class TecnicoService
{
    private array $statusCache = [];

    /**
     * Obtiene el estado por nombre utilizando un caché local de ejecución simple.
     */
    private function getStatusByName(string $pattern)
    {
        if (!isset($this->statusCache[$pattern])) {
            $this->statusCache[$pattern] = Status::where('name', 'like', $pattern)->first();
        }
        return $this->statusCache[$pattern];
    }

    /**
     * Obtiene todos los estados guardados en caché local de ejecución simple.
     */
    private function getCachedStatuses(): array
    {
        if (empty($this->statusCache)) {
            $statuses = Status::all();
            foreach ($statuses as $status) {
                $this->statusCache[strtolower($status->name)] = $status;
            }
        }
        return $this->statusCache;
    }

    public function getDashboardData(Request $request): array
    {
        $agent = Auth::user();
        $statuses = $this->getCachedStatuses();

        $terminalStatuses = [];
        $activeStatuses = [];
        $statusEnProceso = null;
        $statusPendienteRevision = null;

        foreach ($statuses as $name => $status) {
            $nameLower = strtolower($name);

            if (
                strpos($nameLower, 'cerrado') !== false ||
                strpos($nameLower, 'finalizado') !== false ||
                strpos($nameLower, 'resuelto') !== false ||
                strpos($nameLower, 'no resuelto') !== false
            ) {
                $terminalStatuses[] = $status->id;
            } else {
                $activeStatuses[] = $status->id;
            }

            if (strpos($nameLower, 'proceso') !== false || strpos($nameLower, 'progreso') !== false) {
                $statusEnProceso = $status;
            }
            if (strpos($nameLower, 'pendiente') !== false && strpos($nameLower, 'revision') !== false) {
                $statusPendienteRevision = $status;
            }
        }

        if (!$statusPendienteRevision) {
            $statusPendienteRevision = Status::where('name', 'Pendiente Revisión')->first();
        }

        $queryBase = Ticket::where('tickets.assigned_user', $agent->id);

        if ($statusPendienteRevision) {
            $queryBase->where('tickets.status_id', '!=', $statusPendienteRevision->id);
        }

        $search = $request->query('search');
        $statusFilter = $request->query('status');
        $priorityFilter = $request->query('priority');

        // Búsqueda de Tickets
        if ($search) {
            $queryBase->where(function ($q) use ($search) {
                $q->where('tickets.subject', 'like', "%{$search}%")
                    ->orWhere('tickets.code', 'like', "%{$search}%")
                    ->orWhere('tickets.id', 'like', "%{$search}%")
                    ->orWhereHas('requestingUser', function ($qu) use ($search) {
                        $qu->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $activeQuery = clone $queryBase;
        $activeQuery->with(['priority', 'department', 'status', 'requestingUser', 'ticketSolutions', 'histories', 'helpTopic'])
            ->whereIn('tickets.status_id', $activeStatuses);

        if ($statusFilter && $statusFilter !== 'Todos los estados') {
            $activeQuery->whereHas('status', function ($q) use ($statusFilter) {
                $q->where('name', $statusFilter);
            });
        }

        if ($priorityFilter && $priorityFilter !== 'Todas las prioridades') {
            $activeQuery->whereHas('priority', function ($q) use ($priorityFilter) {
                $q->where('name', $priorityFilter);
            });
        }

        $ticketsPaginados = $activeQuery
            ->leftJoin('priorities', 'tickets.priority_id', '=', 'priorities.id')
            ->select('tickets.*')
            ->orderBy('priorities.level', 'desc')
            ->orderBy('tickets.creation_date', 'desc')
            ->paginate(10);

        $ticketsPaginados->getCollection()->transform(function ($ticket) {
            return [
                'id' => $ticket->id,
                'code' => $ticket->code,
                'asunto' => $ticket->subject,
                'departamento' => $ticket->department->name ?? 'N/A',
                'estado' => $ticket->status->name ?? 'N/A',
                'prioridad' => $ticket->priority->name ?? 'N/A',
                'creado_por' => $ticket->requestingUser->name ?? 'N/A',
                'fecha_creacion' => $ticket->creation_date,
                'tiene_diagnostico' => $ticket->ticketSolutions->count() > 0 || ($ticket->status->name !== 'Asignado' && $ticket->status->name !== 'En Proceso' && $ticket->histories->where('action_type', ActionTypeEnum::NOTE_ADDED)->whereNotNull('internal_note')->count() > 0),
                'help_topic_id' => $ticket->help_topic_id,
                'help_topic_name' => $ticket->helpTopic->name_topic ?? 'N/A'
            ];
        });

        $historialFinalizados = (clone $queryBase)->with(['department', 'status'])
            ->whereIn('tickets.status_id', $terminalStatuses)
            ->orderBy('tickets.updated_at', 'desc')
            ->limit(20)
            ->get();

        $statsQuery = clone $queryBase;

        $countsByStatus = (clone $statsQuery)
            ->select('status_id', DB::raw('count(*) as total'))
            ->groupBy('status_id')
            ->get()
            ->keyBy('status_id');

        $totalResueltos = 0;
        $totalEnProceso = 0;
        $totalAsignadosCount = 0;
        $statusAsignado = $statuses['asignado'] ?? null;

        foreach ($statuses as $name => $status) {
            $count = $countsByStatus->get($status->id)->total ?? 0;
            $nameLower = strtolower($name);

            if (
                (strpos($nameLower, 'resuelto') !== false || strpos($nameLower, 'cerrado') !== false)
                && strpos($nameLower, 'no resuelto') === false
            ) {
                $totalResueltos += $count;
            }

            if (strpos($nameLower, 'proceso') !== false || strpos($nameLower, 'progreso') !== false) {
                $totalEnProceso += $count;
            }
            if ($statusAsignado && $status->id == $statusAsignado->id) {
                $totalAsignadosCount = $count;
                $totalEnProceso += $count;
            }
        }

        $totalEnCola = (clone $statsQuery)->whereIn('status_id', $activeStatuses)->count();
        $totalTicketsTotal = (clone $statsQuery)->count();
        $tasaResolucion = $totalTicketsTotal > 0 ? ($totalResueltos / $totalTicketsTotal) * 100 : 0;

        $priorityDistribution = (clone $statsQuery)
            ->whereIn('status_id', $activeStatuses)
            ->join('priorities', 'tickets.priority_id', '=', 'priorities.id')
            ->select('priorities.name', DB::raw('count(*) as total'))
            ->groupBy('priorities.name')
            ->pluck('total', 'priorities.name');

        return [
            'tickets_asignados' => $ticketsPaginados,
            'historial_finalizados' => $historialFinalizados,
            'solution_types' => SolutionType::where('department_id', $agent->department_id)->where('is_active', true)->get(),
            'statuses' => Status::whereIn('name', [
                TicketStatusEnum::ASSIGNED->value,
                TicketStatusEnum::IN_PROGRESS->value
            ])->pluck('name'),
            'available_priorities' => \App\Models\Priority::orderBy('level', 'desc')->pluck('name'),
            'estadisticas' => [
                'tasa_resolucion_porcentaje' => round($tasaResolucion, 2),
                'total_tickets_cola' => $totalEnCola,
                'total_tickets_proceso' => $totalEnProceso,
                'total_tickets_asignados' => $totalAsignadosCount,
                'total_tickets_resueltos' => $totalResueltos,
                'total_tickets_criticos' => Ticket::where('assigned_user', $agent->id)
                    ->whereIn('status_id', $activeStatuses)
                    ->whereHas('priority', fn($q) => $q->where('name', 'like', '%Urgente%'))
                    ->count(),
                'prioridades' => $priorityDistribution
            ]
        ];
    }

    public function getTotalTicketsAsignados(): int
    {
        return Ticket::where('assigned_user', Auth::id())->count();
    }

    public function getTotalTicketsEnProceso(): int
    {
        $statusEnProceso = Status::where('name', 'like', '%proceso%')
            ->orWhere('name', 'like', '%Proceso%')
            ->orWhere('name', 'like', '%progreso%')
            ->orWhere('name', 'Asignado')
            ->pluck('id');

        return Ticket::where('assigned_user', Auth::id())
            ->whereIn('status_id', $statusEnProceso)
            ->count();
    }

    public function getTotalTicketsResueltos(): int
    {
        $statusResuelto = Status::where('name', 'like', '%resuelto%')
            ->orWhere('name', 'like', '%Resuelto%')
            ->orWhere('name', 'like', '%cerrado%')
            ->orWhere('name', 'like', '%Cerrado%')
            ->orWhere('name', 'like', '%finalizado%')
            ->first();

        return Ticket::where('assigned_user', Auth::id())
            ->when($statusResuelto, function ($query) use ($statusResuelto) {
                return $query->where('status_id', $statusResuelto->id);
            })
            ->count();
    }

    public function getHistorialTicketsFinalizados(): array
    {
        $terminalStatuses = Status::where(function ($query) {
            $query->where('name', 'like', '%cerrado%')
                ->orWhere('name', 'like', '%finalizado%')
                ->orWhere('name', 'like', '%resuelto%')
                ->orWhere('name', 'like', '%no resuelto%');
        })->pluck('id');

        return Ticket::with(['priority', 'department', 'status'])
            ->where('assigned_user', Auth::id())
            ->whereIn('status_id', $terminalStatuses)
            ->orderBy('closing_date', 'desc')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->toArray();
    }

    public function getTasaResolucion(): array
    {
        $agentId = Auth::id();
        $totalAsignados = Ticket::where('assigned_user', $agentId)->count();

        if ($totalAsignados === 0) {
            return [
                'tasa_resolucion' => 0,
                'total_resueltos' => 0,
                'total_asignados' => 0
            ];
        }

        $statusResuelto = Status::where('name', 'like', '%resuelto%')
            ->orWhere('name', 'like', '%cerrado%')
            ->orWhere('name', 'like', '%finalizado%')
            ->first();

        $totalResueltos = Ticket::where('assigned_user', $agentId)
            ->when($statusResuelto, function ($query) use ($statusResuelto) {
                return $query->where('status_id', $statusResuelto->id);
            })
            ->count();

        $tasa = ($totalResueltos / $totalAsignados) * 100;

        return [
            'tasa_resolucion' => round($tasa, 2),
            'total_resueltos' => $totalResueltos,
            'total_asignados' => $totalAsignados
        ];
    }

    public function getTicketsEnCola(): array
    {
        $statusCerrado = Status::where('name', 'like', '%cerrado%')
            ->orWhere('name', 'like', '%Cerrado%')
            ->orWhere('name', 'like', '%finalizado%')
            ->orWhere('name', 'like', '%resuelto%')
            ->first();

        return Ticket::with(['priority', 'department', 'status'])
            ->where('assigned_user', Auth::id())
            ->when($statusCerrado, function ($query) use ($statusCerrado) {
                return $query->where('status_id', '!=', $statusCerrado->id);
            })
            ->orderBy('creation_date', 'desc')
            ->get()
            ->toArray();
    }

    public function getTicketsEnProceso(): array
    {
        $statusEnProceso = Status::where('name', 'like', '%proceso%')
            ->orWhere('name', 'like', '%Proceso%')
            ->orWhere('name', 'like', '%progreso%')
            ->orWhere('name', 'Asignado')
            ->pluck('id');

        return Ticket::with(['priority', 'department', 'status'])
            ->where('assigned_user', Auth::id())
            ->whereIn('status_id', $statusEnProceso)
            ->orderBy('creation_date', 'desc')
            ->get()
            ->toArray();
    }

    public function getTicketsAsignadosSimple(): array
    {
        $tickets = Ticket::with(['priority', 'department', 'status', 'requestingUser'])
            ->where('assigned_user', Auth::id())
            ->get(['id', 'subject', 'department_id', 'status_id', 'priority_id', 'requesting_user', 'creation_date']);

        return $tickets->map(function ($ticket) {
            return [
                'id' => $ticket->id,
                'asunto' => $ticket->subject,
                'departamento' => $ticket->department->name ?? 'N/A',
                'estado' => $ticket->status->name ?? 'N/A',
                'prioridad' => $ticket->priority->name ?? 'N/A',
                'creado_por' => $ticket->requestingUser->name ?? 'N/A',
                'fecha_creacion' => $ticket->creation_date
            ];
        })->toArray();
    }

    public function getTicketDetails($id): ?array
    {
        $agent = Auth::user();

        $ticket = Ticket::with([
            'status',
            'priority',
            'slaPlan',
            'requestingUser',
            'assignedUser.department',
            'helpTopic.division',
            'department',
            'histories',
            'attachments',
            'ticketSolutions.attachments',
            'ticketSolutions.solutionType'
        ])
            ->where('id', $id)
            ->where('assigned_user', $agent->id)
            ->first();

        if (!$ticket) {
            return null;
        }

        $statusAsignado = Status::where('name', TicketStatusEnum::ASSIGNED->value)->first();
        $statusEnProceso = Status::where('name', TicketStatusEnum::IN_PROGRESS->value)->first();

        if ($statusAsignado && $statusEnProceso && $ticket->status_id === $statusAsignado->id) {
            $ticket->status_id = $statusEnProceso->id;
            $ticket->save();

            TicketHistory::create([
                'ticket_id' => $ticket->id,
                'user_id' => $agent->id,
                'action_type' => ActionTypeEnum::STATUS_CHANGED,
                'internal_note' => 'Estado cambiado automáticamente a "En Proceso" al ser visualizado por el técnico.',
                'assigned_user' => $agent->id,
            ]);

            $ticket->load('status');
        }

        return [
            'id' => $ticket->id,
            'estado_del_ticket' => $ticket->status->name ?? 'N/A',
            'prioridad' => $ticket->priority->name ?? 'N/A',
            'fecha_creacion' => $ticket->creation_date,
            'asignado' => $ticket->assignedUser->name ?? 'N/A',
            'plan_sla' => $ticket->slaPlan->name ?? 'N/A',
            'fecha_limite' => $ticket->expiration_date,
            'nombre' => $ticket->requestingUser->name ?? 'N/A',
            'email' => $ticket->email,
            'telefono' => $ticket->requestingUser->phone_number ?? 'N/A',
            'temas_de_ayuda' => $ticket->helpTopic->name_topic ?? 'N/A',
            'departamento_solicitante' => $ticket->department->name ?? 'N/A',
            'division_solicitante' => $ticket->helpTopic->division->name ?? 'N/A',
            'solicitante' => $ticket->requestingUser->name ?? 'N/A',
            'problema' => $ticket->subject,
            'detalles_del_problema' => $ticket->message,
            'adjuntos' => $ticket->attachments->map(fn($a) => [
                'id' => $a->id,
                'name' => $a->file_name,
                'path' => $a->file_path,
                'type' => $a->file_type
            ]),
            'soluciones' => $ticket->ticketSolutions->map(fn($s) => [
                'id' => $s->id,
                'mensaje' => $s->message,
                'fecha' => $s->date,
                'tipo' => $s->solutionType->name ?? 'N/A',
                'adjuntos' => $s->attachments->map(fn($a) => [
                    'id' => $a->id,
                    'name' => $a->file_name,
                    'path' => $a->file_path,
                    'type' => $a->file_type
                ])
            ]),
            'incidencias' => $ticket->histories->where('action_type', ActionTypeEnum::NOTE_ADDED)->map(function ($history) {
                return [
                    'internal_note' => $history->internal_note,
                    'fecha' => $history->created_at,
                    'tecnico' => $history->user->name ?? 'N/A'
                ];
            })->values(),
            'area_del_agent' => $ticket->assignedUser->department->name ?? 'N/A',
            'historial' => $ticket->histories->map(function ($history) {
                return [
                    'fecha' => $history->created_at,
                    'accion' => $history->action,
                    'detalles' => $history->details,
                    'usuario' => $history->user->name ?? 'Sistema'
                ];
            })
        ];
    }

    public function guardarDiagnostico(Request $request, $id): array
    {
        $agent = Auth::user();

        $ticket = Ticket::where('id', $id)
            ->where('assigned_user', $agent->id)
            ->first();

        if (!$ticket) {
            throw new \Exception('Ticket no encontrado o no tienes permiso para gestionarlo.', 404);
        }

        if ($ticket->ticketSolutions()->exists()) {
            throw new \Exception('Este ticket ya cuenta con un diagnóstico registrado.', 422);
        }

        DB::beginTransaction();

        try {
            $solutionType = SolutionType::firstOrCreate(
                ['name' => $request->tipo_diagnostico],
                ['description' => 'Creado desde diagnóstico técnico']
            );

            $solution = TicketSolution::create([
                'ticket_id' => $ticket->id,
                'user_id' => $agent->id,
                'message' => $request->observacion,
                'date' => now(),
                'solution_type_id' => $solutionType->id,
            ]);

            $filesProcessed = 0;
            $inputNames = ['adjuntos', 'adjuntos_'];

            foreach ($inputNames as $inputName) {
                if ($request->hasFile($inputName)) {
                    foreach ($request->file($inputName) as $file) {
                        if ($file->getSize() > 10240 * 1024) {
                            throw new \Exception('El archivo ' . $file->getClientOriginalName() . ' excede el tamaño máximo de 10MB.');
                        }

                        $path = $file->store('diagnosticos', 'public');

                        $solution->attachments()->create([
                            'file_name' => $file->getClientOriginalName(),
                            'file_path' => $path,
                            'file_type' => $file->getMimeType(),
                            'file_size' => $file->getSize(),
                        ]);

                        $filesProcessed++;
                    }
                }
            }

            if ($filesProcessed === 0) {
                throw new \Exception('Debe adjuntar al menos un archivo como evidencia del diagnóstico.');
            }

            Log::info('Diagnóstico guardado:', [
                'ticket_id' => $ticket->id,
                'solution_id' => $solution->id,
                'files_count' => $filesProcessed
            ]);

            $estadoResuelto = Status::where('name', 'like', '%Resuelto%')
                ->orWhere('name', 'like', '%resuelto%')
                ->first();

            if (!$estadoResuelto) {
                $estadoResuelto = Status::firstOrCreate(['name' => 'Resuelto']);
            }

            $ticket->status_id = $estadoResuelto->id;
            $ticket->closing_date = now();
            $ticket->save();

            DB::commit();

            return [
                'message' => 'Diagnóstico guardado exitosamente.',
                'status_id' => $ticket->status_id
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function noPuedeResolver(string $internalNote, $id): array
    {
        $agent = Auth::user();

        $ticket = Ticket::with('requestingUser')
            ->where('id', $id)
            ->where('assigned_user', $agent->id)
            ->first();

        if (!$ticket) {
            throw new \Exception('Ticket no encontrado o no tienes permiso para gestionarlo.', 404);
        }

        DB::beginTransaction();
        try {
            $statusName = TicketStatusEnum::UNRESOLVED->value;
            $estadoNoResuelto = Status::firstOrCreate(['name' => $statusName]);

            $ticket->status_id = $estadoNoResuelto->id;
            $ticket->closing_date = now();
            $ticket->save();

            TicketHistory::create([
                'ticket_id' => $ticket->id,
                'user_id' => $agent->id,
                'action_type' => ActionTypeEnum::NOTE_ADDED,
                'internal_note' => $internalNote,
                'previous_department' => $ticket->department_id,
                'assigned_user' => $ticket->assigned_user,
            ]);

            // Enviar notificación
            if ($ticket->requestingUser) {
                $ticket->requestingUser->notify(new TicketUnresolvedNotification(
                    $ticket,
                    $internalNote,
                    $agent
                ));
            }

            DB::commit();

            return [
                'message' => 'El reporte de incidencia ha sido enviado exitosamente.',
                'status_id' => $ticket->status_id
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error crítico en noPuedeResolver:', [
                'ticket_id' => $id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }


    public function getMisEstadisticas(): array
    {
        $agent = Auth::user();

        $statusCerrado = Status::where('name', 'like', '%cerrado%')
            ->orWhere('name', 'like', '%finalizado%')
            ->orWhere('name', 'like', '%resuelto%')
            ->first();

        $statusEnProcesoIds = Status::where('name', 'like', '%proceso%')
            ->orWhere('name', 'like', '%progreso%')
            ->orWhere('name', 'Asignado')
            ->pluck('id');

        $totalAsignados = Ticket::where('assigned_user', $agent->id)->count();

        $totalResueltos = $statusCerrado
            ? Ticket::where('assigned_user', $agent->id)->where('status_id', $statusCerrado->id)->count()
            : 0;

        $totalEnProceso = Ticket::where('assigned_user', $agent->id)
            ->whereIn('status_id', $statusEnProcesoIds)
            ->count();

        $totalEnCola = $statusCerrado
            ? Ticket::where('assigned_user', $agent->id)->where('status_id', '!=', $statusCerrado->id)->count()
            : $totalAsignados;

        $tasaResolucion = $totalAsignados > 0 ? ($totalResueltos / $totalAsignados) * 100 : 0;

        return [
            'estadisticas' => [
                'tasa_resolucion_porcentaje' => round($tasaResolucion, 2),
                'total_tickets_cola' => $totalEnCola,
                'total_tickets_proceso' => $totalEnProceso,
                'total_tickets_asignados' => $totalAsignados,
                'total_tickets_resueltos' => $totalResueltos,
                'total_tickets_criticos' => Ticket::where('assigned_user', $agent->id)
                    ->whereIn('status_id', $statusEnProcesoIds)
                    ->whereHas('priority', fn($q) => $q->where('name', 'like', '%Urgente%'))
                    ->count(),
            ]
        ];
    }
}
