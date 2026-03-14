import { useState, useEffect } from "react";
import { I, AnimNum, Skeleton, EmptyState } from "../components/Shared";
import { getAuditScore } from "../services/dataService";
import { useTenant } from "../context/TenantContext";

const getScoreColor = (s) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#ef4444";
const getScoreLabel = (s) => s >= 80 ? "Sólido" : s >= 60 ? "Necesita Atención" : "Crítico";

export default function AuditScore() {
    const { activeTenant } = useTenant();
    const [scoreData, setScoreData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchScore() {
            if (!activeTenant) return;
            setIsLoading(true);
            try {
                const data = await getAuditScore(activeTenant.id);
                if (isMounted) {
                    setScoreData(data);
                }
            } catch (err) {
                console.error("[AuditScore] Error fetching:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        fetchScore();
        return () => { isMounted = false; };
    }, [activeTenant]);

    const overallScore = scoreData?.overall_score || 0;
    const areas = scoreData ? [
        { name: "Ventas e Ingresos", score: scoreData.revenue_score, color: "#10b981", icon: I.sales },
        { name: "Operaciones e Inventario", score: scoreData.operations_score, color: "#0ea5e9", icon: I.inventory },
        { name: "Salud del Cliente", score: scoreData.customer_score, color: "#8b5cf6", icon: I.customers },
        { name: "Eficiencia de Marketing", score: scoreData.marketing_score, color: "#f59e0b", icon: I.marketing },
    ] : [];

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Auditoría</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Evaluación de salud del negocio en todas las áreas operativas</p>

            {/* Overall score */}
            {isLoading ? (
                <div className="glass-card" style={{ padding: "32px 30px", marginBottom: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Skeleton width="200px" height="16px" style={{ marginBottom: 16 }} />
                    <Skeleton width="140px" height="140px" borderRadius="50%" style={{ marginBottom: 16 }} />
                    <Skeleton width="80px" height="24px" borderRadius="12px" />
                </div>
            ) : !scoreData ? (
                <EmptyState icon="📊" title="Aún no hay auditoría" message="El sistema necesita procesar más ventas para auditar las métricas de tu empresa." height={250} />
            ) : (
                <div className="glass-card fade-in-up" style={{ padding: "32px 30px", marginBottom: 24, textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 12 }}>Puntuación General de Salud</div>
                    <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 16px" }}>
                        <svg viewBox="0 0 140 140" style={{ width: 140, height: 140, transform: "rotate(-90deg)" }}>
                            <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(14,165,233,0.08)" strokeWidth="10" />
                            <circle cx="70" cy="70" r="60" fill="none" stroke={getScoreColor(overallScore)} strokeWidth="10"
                                strokeDasharray={`${(overallScore / 100) * 377} 377`}
                                strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ fontSize: 38, fontWeight: 800, fontFamily: "var(--font-display)", color: getScoreColor(overallScore) }}>{overallScore}</div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>/100</div>
                        </div>
                    </div>
                    <span className="badge" style={{ background: `${getScoreColor(overallScore)}15`, color: getScoreColor(overallScore), fontSize: 11, padding: "4px 12px" }}>
                        {getScoreLabel(overallScore)}
                    </span>
                </div>
            )}

            {/* Area scores */}
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="glass-card" style={{ padding: "20px 22px" }}>
                            <Skeleton width="60%" height="16px" style={{ marginBottom: 12 }} />
                            <Skeleton width="40%" height="32px" style={{ marginBottom: 8 }} />
                            <Skeleton width="100%" height="6px" borderRadius="3px" style={{ marginBottom: 6 }} />
                            <Skeleton width="50%" height="12px" />
                        </div>
                    ))
                ) : areas.map((area, i) => (
                    <div key={i} className="glass-card fade-in-up" style={{ padding: "20px 22px", animationDelay: `${i * 80}ms` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <span style={{ color: area.color }}>{area.icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{area.name}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-display)", color: getScoreColor(area.score) }}>
                                <AnimNum value={area.score} />
                            </span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>/100</span>
                        </div>
                        <div style={{ height: 6, background: "rgba(14,165,233,0.06)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${area.score}%`, height: "100%", borderRadius: 3, background: getScoreColor(area.score), transition: "width 0.8s ease" }} />
                        </div>
                        <div style={{ fontSize: 10, color: getScoreColor(area.score), fontWeight: 600, marginTop: 6 }}>{getScoreLabel(area.score)}</div>
                    </div>
                ))}
            </div>

            {/* What this score means */}
            {!isLoading && scoreData && (
                <div className="glass-card fade-in-up" style={{ padding: 22, animationDelay: "400ms" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <span style={{ color: "#8b5cf6" }}>{I.sparkle}</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>Qué Significa Este Resultado</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                        <p style={{ marginBottom: 10 }}>La puntuación de salud de tu negocio de <strong style={{ color: getScoreColor(overallScore) }}>{overallScore}/100</strong> se calcula a partir de 4 áreas clave. Áreas a priorizar:</p>
                        {areas.sort((a, b) => a.score - b.score).map((area, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: getScoreColor(area.score) }} />
                                <span><strong>{area.name}</strong>: {area.score >= 80 ? "Buen rendimiento — mantener la estrategia actual" : area.score >= 60 ? "Se han identificados oportunidades de mejora" : "Requiere atención inmediata"}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
