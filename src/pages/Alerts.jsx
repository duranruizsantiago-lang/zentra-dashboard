import { useState, useEffect } from "react";
import { I, AnimNum, Skeleton, EmptyState } from "../components/Shared";
import { getAlerts } from "../services/dataService";
import { useTenant } from "../context/TenantContext";

const severityColors = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };
const severityLabels = { high: "Crítica", medium: "Advertencia", low: "Informativa" };
const typeIcons = { stock: "📦", campaign: "📣", product: "🏷️", returns: "🔄", whatsapp: "💬", performance: "📊", anomaly: "⚠️" };

export default function Alerts({ onNavigate }) {
    const { activeTenant } = useTenant();
    const [alerts, setAlerts] = useState([]);
    const [filter, setFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchAlerts() {
            if (!activeTenant) return;
            setIsLoading(true);
            try {
                const data = await getAlerts(activeTenant.id);
                if (isMounted) {
                    setAlerts(data);
                }
            } catch (err) {
                console.error("[Alerts] Error fetching alerts:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        fetchAlerts();
        return () => { isMounted = false; };
    }, [activeTenant]);

    const filtered = filter === "all" ? alerts : alerts.filter(a => a.severity === filter);
    const counts = { high: alerts.filter(a => a.severity === "high").length, medium: alerts.filter(a => a.severity === "medium").length, low: alerts.filter(a => a.severity === "low").length };

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Alertas</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Alertas operativas que requieren atención — priorizadas por gravedad</p>

            {/* Severity summary */}
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                {[
                    { key: "high", label: "Críticas", count: counts.high, color: "#ef4444" },
                    { key: "medium", label: "Advertencias", count: counts.medium, color: "#f59e0b" },
                    { key: "low", label: "Informativas", count: counts.low, color: "#10b981" },
                ].map((s, i) => (
                    <button key={s.key} onClick={() => setFilter(filter === s.key ? "all" : s.key)}
                        className="glass-card fade-in-up" style={{
                            padding: "16px 20px", animationDelay: `${i * 50}ms`, cursor: "pointer",
                            border: filter === s.key ? `1px solid ${s.color}` : "1px solid transparent",
                            background: filter === s.key ? `${s.color}08` : undefined, textAlign: "left",
                        }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", color: s.color }}><AnimNum value={s.count} /></div>
                    </button>
                ))}
            </div>

            {/* Alert list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {isLoading && (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="glass-card" style={{ padding: "18px 22px", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                                <Skeleton width="38px" height="38px" borderRadius="10px" />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                        <Skeleton width="70px" height="18px" borderRadius="12px" />
                                        <Skeleton width="60px" height="18px" borderRadius="12px" />
                                    </div>
                                    <Skeleton width="50%" height="20px" style={{ marginBottom: 8 }} />
                                    <Skeleton width="90%" height="16px" />
                                </div>
                                <Skeleton width="80px" height="24px" />
                            </div>
                        </div>
                    ))
                )}
                {!isLoading && filtered.map((alert, i) => {
                    const color = severityColors[alert.severity];
                    return (
                        <div key={i} className="glass-card fade-in-up" style={{
                            padding: "18px 22px", borderLeft: `3px solid ${color}`,
                            animationDelay: `${150 + i * 60}ms`,
                        }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: 10,
                                    background: `${color}10`, display: "flex", alignItems: "center",
                                    justifyContent: "center", fontSize: 18, flexShrink: 0,
                                }}>{typeIcons[alert.type] || "⚠️"}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <span className="badge" style={{ background: `${color}15`, color, fontSize: 9 }}>
                                            ● {severityLabels[alert.severity]}
                                        </span>
                                        <span className="badge" style={{ background: "rgba(14,165,233,0.06)", color: "var(--text-muted)", fontSize: 9 }}>
                                            {alert.type}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{alert.title}</div>
                                    <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{alert.desc}</p>
                                </div>
                                {alert.action_link && onNavigate && (
                                    <button className="btn-ghost" onClick={() => {
                                        onNavigate(alert.action_link);
                                    }} style={{ fontSize: 11, padding: "6px 14px", whiteSpace: "nowrap" }}>
                                        Resolver →
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {!isLoading && filtered.length === 0 && (
                    <EmptyState icon="✅" title="Sin alertas" message="Todos los sistemas operan con normalidad en este nivel." height={180} />
                )}
            </div>
        </div>
    );
}
