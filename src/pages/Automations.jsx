import { useState, useEffect, useContext } from "react";
import { I, AnimNum, Skeleton } from "../components/Shared";
import { getAutomations } from "../services/dataService";
import { TenantContext } from "../context/TenantContext";

export default function Automations() {
    const { activeTenant } = useContext(TenantContext);
    const [automations, setAutomations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toggles, setToggles] = useState([]);
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        if (!activeTenant) return;
        async function load() {
            // Note: getAutomations currently sync, but we treat it as async for future proofing
            const data = await getAutomations(activeTenant.id);
            setAutomations(data || []);
            setToggles((data || []).map(a => a.active));
            setIsLoading(false);
        }
        load();
    }, [activeTenant]);

    const actives = toggles.filter(Boolean).length;
    const totalRev = automations.reduce((a, au) => a + (au.revenue || 0), 0);

    if (isLoading) {
        return (
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Reglas</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} height={80} borderRadius={16} />)}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Reglas</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Reglas de automatización y flujos ejecutados</p>

            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
                <div className="glass-card fade-in-up" style={{ padding: "16px 20px" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Activas</div>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", color: "#0ea5e9" }}><AnimNum value={actives} /> / {automations.length}</div>
                </div>
                <div className="glass-card fade-in-up" style={{ padding: "16px 20px", animationDelay: "50ms" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Ejecuciones 30d</div>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", color: "#3b82f6" }}><AnimNum value={automations.reduce((a, au) => a + (au.executions || 0), 0)} /></div>
                </div>
                <div className="glass-card fade-in-up" style={{ padding: "16px 20px", animationDelay: "100ms" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Ingresos generados</div>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", color: "#10b981" }}><AnimNum value={totalRev} suffix="€" /></div>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {automations.map((a, i) => (
                    <div key={i} className="glass-card fade-in-up" style={{ padding: "18px 22px", animationDelay: `${150 + i * 60}ms` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ fontSize: 22 }}>{a.icon || "⚡"}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{a.name}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.trigger}</div>
                            </div>

                            {/* Status Badge */}
                            <div style={{
                                padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                                background: toggles[i] ? "rgba(16, 185, 129, 0.15)" : "rgba(148,163,184,0.15)",
                                color: toggles[i] ? "#10b981" : "var(--text-muted)"
                            }}>
                                {toggles[i] ? "Activa" : "Pausada"}
                            </div>

                            <button onClick={() => setExpanded(expanded === i ? null : i)} className="btn-ghost" style={{ fontSize: 11, padding: "4px 12px" }}>
                                {expanded === i ? "Ocultar" : "Detalle"}
                            </button>
                        </div>

                        {/* Stats */}
                        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Ejecuciones: <strong style={{ color: "var(--text-primary)" }}>{a.executions || 0}</strong></span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Conversión: <strong style={{ color: "#10b981" }}>{a.conversionRate || 0}%</strong></span>
                            {a.revenue > 0 && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Ingresos: <strong style={{ color: "#0ea5e9" }}>{a.revenue}€</strong></span>}
                        </div>

                        {/* Expanded log */}
                        {expanded === i && (
                            <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(14,165,233,0.02)", borderRadius: 10, border: "1px solid rgba(14,165,233,0.06)" }}>
                                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Últimas ejecuciones</div>
                                {(a.log || ["Sin registros recientes"]).map((l, j) => (
                                    <div key={j} style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                                        <span style={{ color: "#10b981" }}>✓</span> {l}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
