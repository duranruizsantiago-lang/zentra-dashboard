import { useState, useEffect } from "react";
import { I, Skeleton, EmptyState } from "../components/Shared";
import { getTrackerTasks, addTrackerTask, updateTrackerTaskStatus, deleteTrackerTask } from "../services/dataService";
import { useTenant } from "../context/TenantContext";
import { logPilotEvent } from "../services/analyticsService";

const today = new Date().toISOString().split("T")[0];
const futureDate = (days) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
};

const defaultTasks = [
    { id: 1, title: "Revisar principales causas de devolución y contactar proveedor", area: "Operaciones", status: "in-progress", priority: "high", created: today, due: futureDate(7) },
    { id: 2, title: "Lanzar campaña de reactivación para clientes inactivos", area: "Clientes", status: "pending", priority: "high", created: today, due: futureDate(14) },
    { id: 3, title: "Reponer Anillo Infinity Dorado (3 unidades restantes)", area: "Operaciones", status: "completed", priority: "high", created: today, due: futureDate(2) },
    { id: 4, title: "Pausar campaña TikTok con ROAS de 1.2x", area: "Marketing", status: "in-progress", priority: "medium", created: today, due: futureDate(7) },
    { id: 5, title: "Implementar secuencia de email para carritos abandonados", area: "Ingresos", status: "pending", priority: "medium", created: today, due: futureDate(21) },
    { id: 6, title: "Crear packs con productos estancados y bestsellers", area: "Operaciones", status: "pending", priority: "low", created: today, due: futureDate(30) },
];

const statusColors = { pending: "#f59e0b", "in-progress": "#0ea5e9", completed: "#10b981" };
const statusLabels = { pending: "Pendiente", "in-progress": "En Progreso", completed: "Completada" };
const priorityColors = { high: "#ef4444", medium: "#f59e0b", low: "#0ea5e9" };

export default function ActionTracker() {
    const { activeTenant } = useTenant();
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);

    // Initial Fetch — fallback to defaultTasks when no tenant (demo/local mode)
    useEffect(() => {
        let isMounted = true;
        async function fetchTasks() {
            if (!activeTenant) {
                // No tenant available (demo mode) — use default tasks
                if (isMounted) {
                    setTasks(defaultTasks);
                    setIsLoading(false);
                }
                return;
            }
            setIsLoading(true);
            try {
                const data = await getTrackerTasks(activeTenant.id);
                if (isMounted) {
                    setTasks(data || []);
                }
            } catch (err) {
                console.error("[ActionTracker] Error loading tasks:", err);
                if (isMounted) {
                    setTasks([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }
        fetchTasks();
        return () => { isMounted = false; };
    }, [activeTenant]);

    // Listen for events from Recommendations page
    useEffect(() => {
        const handler = async (e) => {
            const rec = e.detail;
            if (!rec?.title || !activeTenant) return;
            // Optimistic check
            if (tasks.some(t => t.title === rec.title)) return;

            const newTaskData = {
                title: rec.title,
                area: rec.area || "General",
                status: "pending",
                priority: rec.priority || "medium",
                due_date: futureDate(14),
            };

            // Persist to DB
            const inserted = await addTrackerTask(activeTenant.id, newTaskData);
            if (inserted) {
                setTasks(prev => [inserted, ...prev]);
            }
        };
        window.addEventListener("zentra-add-task", handler);
        return () => window.removeEventListener("zentra-add-task", handler);
    }, [activeTenant, tasks]);

    const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
    const counts = { pending: tasks.filter(t => t.status === "pending").length, "in-progress": tasks.filter(t => t.status === "in-progress").length, completed: tasks.filter(t => t.status === "completed").length };

    const cycleStatus = async (id, currentStatus) => {
        const order = ["pending", "in-progress", "completed"];
        const next = order[(order.indexOf(currentStatus) + 1) % order.length];

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: next } : t));

        // DB update
        await updateTrackerTaskStatus(id, next);

        if (next === "completed") {
            const task = tasks.find(t => t.id === id);
            logPilotEvent('tracker_task_completed', { tenant_id: activeTenant.id, task_title: task?.title });
        }
    };

    const deleteTask = async (id) => {
        const task = tasks.find(t => t.id === id);
        logPilotEvent('tracker_task_deleted', { tenant_id: activeTenant.id, task_title: task?.title });
        setTasks(prev => prev.filter(t => t.id !== id));
        await deleteTrackerTask(id);
    };

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Seguimiento de Acciones</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Seguimiento de acciones de mejora desde la auditoría hasta su finalización</p>

            {/* Status summary */}
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                {Object.entries(counts).map(([status, count], i) => (
                    <button key={status} onClick={() => setFilter(filter === status ? "all" : status)} className="glass-card fade-in-up" style={{
                        padding: "16px 20px", animationDelay: `${i * 50}ms`, cursor: "pointer",
                        border: filter === status ? `1px solid ${statusColors[status]}` : "1px solid transparent",
                        background: filter === status ? `${statusColors[status]}08` : undefined,
                        textAlign: "left",
                    }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{statusLabels[status]}</div>
                        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", color: statusColors[status] }}>{count}</div>
                    </button>
                ))}
            </div>

            {/* Progress bar */}
            <div className="glass-card fade-in-up" style={{ padding: "14px 20px", marginBottom: 20, animationDelay: "150ms" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Progreso de completado</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>{counts.completed}/{tasks.length}</span>
                </div>
                <div style={{ height: 8, background: "rgba(14,165,233,0.06)", borderRadius: 4, overflow: "hidden", display: "flex" }}>
                    <div style={{ width: `${tasks.length > 0 ? (counts.completed / tasks.length) * 100 : 0}%`, background: "#10b981", transition: "width 0.5s" }} />
                    <div style={{ width: `${tasks.length > 0 ? (counts["in-progress"] / tasks.length) * 100 : 0}%`, background: "#0ea5e9", transition: "width 0.5s" }} />
                </div>
            </div>

            {/* Task list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tasks.length === 0 ? (
                    <EmptyState
                        icon="☑️"
                        title="Día en blanco"
                        message="No tienes Acciones pendientes. Empieza revisando las Recomendaciones de la IA para nutrir tu tracker."
                        height={240}
                    />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon="🗂️"
                        title="Sin tareas en esta vista"
                        message="Prueba cambiando los filtros de estado."
                        height={180}
                    />
                ) : filtered.map((task, i) => (
                    <div key={task.id} className="glass-card fade-in-up" style={{
                        padding: "16px 20px", animationDelay: `${200 + i * 50}ms`,
                        borderLeft: `3px solid ${priorityColors[task.priority]}`,
                        opacity: task.status === "completed" ? 0.6 : 1,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, textDecoration: task.status === "completed" ? "line-through" : "none" }}>{task.title}</div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <span className="badge" style={{ background: `${statusColors[task.status]}15`, color: statusColors[task.status], fontSize: 9 }}>● {statusLabels[task.status]}</span>
                                    <span className="badge" style={{ background: "rgba(14,165,233,0.06)", color: "var(--text-muted)", fontSize: 9 }}>{task.area}</span>
                                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Vence: {task.due}</span>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => cycleStatus(task.id, task.status)} className="btn-ghost" style={{ fontSize: 10, padding: "5px 12px" }}>
                                    {task.status === "pending" ? "Iniciar →" : task.status === "in-progress" ? "Completar ✓" : "↺ Reabrir"}
                                </button>
                                <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, padding: "4px 8px", opacity: 0.5 }} title="Eliminar">×</button>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="glass-card" style={{ padding: "16px 20px", marginBottom: 8 }}>
                            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                <div style={{ flex: 1 }}>
                                    <Skeleton width="60%" height="18px" style={{ marginBottom: 8 }} />
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <Skeleton width="80px" height="18px" borderRadius="12px" />
                                        <Skeleton width="80px" height="18px" borderRadius="12px" />
                                        <Skeleton width="100px" height="18px" />
                                    </div>
                                </div>
                                <Skeleton width="120px" height="24px" />
                            </div>
                        </div>
                    ))
                )}

                {!isLoading && filtered.length === 0 && (
                    <EmptyState icon="✅" title="Sin tareas con este estado" message="Todo al día. No hay acciones pendientes." height={180} />
                )}
            </div>
        </div>
    );
}
