import { useState, useEffect } from "react";
import { I, Skeleton, EmptyState } from "../components/Shared";
import { getRecommendedActions } from "../services/dataService";
import { useTenant } from "../context/TenantContext";
import { logPilotEvent } from "../services/analyticsService";
const priorityLabels = { high: "Prioridad Alta", medium: "Prioridad Media", low: "Buena Práctica" };

export default function Recommendations({ onNavigate }) {
    const { activeTenant } = useTenant();
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchRecommendations() {
            if (!activeTenant) return;
            setIsLoading(true);
            try {
                const data = await getRecommendedActions(activeTenant.id);
                if (isMounted) {
                    setRecommendations(data);
                }
            } catch (err) {
                console.error("[Recommendations] Error fetching recommendations:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        fetchRecommendations();
        return () => { isMounted = false; };
    }, [activeTenant]);

    const addToTracker = (rec) => {
        logPilotEvent('recommendation_added_to_tracker', { title: rec.title, area: rec.area, priority: rec.priority, tenant_id: activeTenant.id });
        // Dispatch event that ActionTracker listens for
        window.dispatchEvent(new CustomEvent("zentra-add-task", { detail: { title: rec.title, area: rec.area, priority: rec.priority } }));
        // Navigate to tracker
        if (onNavigate) onNavigate("tracker");
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Recomendaciones</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Acciones de mejora priorizadas basadas en los datos de tu negocio</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <span className="badge" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                        {recommendations.filter(r => r.priority === "high").length} Altas
                    </span>
                    <span className="badge" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                        {recommendations.filter(r => r.priority === "medium").length} Medias
                    </span>
                    <span className="badge" style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}>
                        {recommendations.filter(r => r.priority === "low").length} Buenas Prácticas
                    </span>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {isLoading && (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="glass-card" style={{ padding: "20px 22px", marginBottom: 12 }}>
                            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                        <Skeleton width="90px" height="18px" borderRadius="12px" />
                                        <Skeleton width="80px" height="18px" borderRadius="12px" />
                                    </div>
                                    <Skeleton width="60%" height="20px" style={{ marginBottom: 10 }} />
                                    <Skeleton width="100%" height="32px" style={{ marginBottom: 12 }} />
                                    <div style={{ display: "flex", gap: 16 }}>
                                        <Skeleton width="100px" height="14px" />
                                        <Skeleton width="100px" height="14px" />
                                    </div>
                                </div>
                                <Skeleton width="140px" height="28px" borderRadius="8px" />
                            </div>
                        </div>
                    ))
                )}
                {!isLoading && recommendations.map((rec, i) => {
                    const color = priorityColors[rec.priority];
                    return (
                        <div key={i} className="glass-card fade-in-up" style={{ padding: "20px 22px", borderLeft: `3px solid ${color}`, animationDelay: `${i * 60}ms` }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                        <span className="badge" style={{ background: `${color}15`, color, fontSize: 9 }}>{priorityLabels[rec.priority]}</span>
                                        <span className="badge" style={{ background: "rgba(14,165,233,0.06)", color: "var(--text-muted)", fontSize: 9 }}>{rec.area}</span>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{rec.title}</div>
                                    <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 10 }}>{rec.desc}</p>
                                    <div style={{ display: "flex", gap: 16 }}>
                                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Impacto: <strong style={{ color: "var(--text-primary)" }}>{rec.impact}</strong></span>
                                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Esfuerzo: <strong style={{ color: "var(--text-primary)" }}>{rec.effort}</strong></span>
                                    </div>
                                </div>
                                <button onClick={() => addToTracker(rec)} className="btn-gold" style={{ fontSize: 12, padding: "8px 16px", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, boxShadow: "0 4px 12px rgba(245, 158, 11, 0.2)" }}>
                                    Enviar al Action Tracker {I.arrowUp}
                                </button>
                            </div>
                        </div>
                    );
                })}

                {!isLoading && recommendations.length === 0 && (
                    <EmptyState icon="✨" title="Tu negocio opera en estado óptimo" message="Por el momento no hay nuevas recomendaciones." height={180} />
                )}
            </div>
        </div>
    );
}
