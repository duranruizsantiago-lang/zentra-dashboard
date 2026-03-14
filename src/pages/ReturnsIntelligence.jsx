import { useState, useEffect, useContext } from "react";
import { I, AnimNum, Skeleton } from "../components/Shared";
import DataTable from "../components/DataTable";
import { getReturns, getReturnsKPIs } from "../services/dataService";
import { TenantContext } from "../context/TenantContext";

const reasonColors = { "Defectuoso": "#ef4444", "Cambio de talla": "#f59e0b", "Arrepentimiento": "#8b5cf6", "Producto equivocado": "#3b82f6" };

const cols = [
    { key: "id", label: "ID RMA", sortable: true, render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: "orderId", label: "Pedido #", render: v => <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{v}</span> },
    { key: "date", label: "Fecha", sortable: true, render: v => new Date(v).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) },
    { key: "customer", label: "Cliente", sortable: true },
    { key: "product", label: "Producto", sortable: true, render: v => <div style={{ maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</div> },
    { key: "reason", label: "Motivo", sortable: true, render: v => <span style={{ fontSize: 11, padding: "2px 8px", background: `${reasonColors[v] || "#0ea5e9"}12`, color: reasonColors[v] || "#0ea5e9", borderRadius: 4, fontWeight: 500 }}>{v}</span> },
    { key: "amount", label: "Reembolso", sortable: true, align: "right", render: v => <span style={{ fontWeight: 700 }}>{v}€</span> },
    {
        key: "status", label: "Estado", sortable: true, render: v => {
            const colors = { procesando: "#f59e0b", reembolsado: "#10b981", rechazado: "#ef4444" };
            return <span className="badge" style={{ background: `${colors[v]}15`, color: colors[v] }}>● {v}</span>;
        }
    },
];

export default function ReturnsIntelligence() {
    const { activeTenant } = useContext(TenantContext);
    const [returnsList, setReturnsList] = useState([]);
    const [returnsKPIs, setReturnsKPIs] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!activeTenant) return;
        async function load() {
            const list = await Promise.resolve(getReturns(activeTenant.id));
            const kpis = await Promise.resolve(getReturnsKPIs(activeTenant.id));
            setReturnsList(list || []);
            setReturnsKPIs(kpis);
            setIsLoading(false);
        }
        load();
    }, [activeTenant]);

    if (isLoading || !returnsKPIs) {
        return (
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Inteligencia de Devoluciones</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 20 }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} height={80} borderRadius={16} />)}
                </div>
            </div>
        );
    }

    // Cause analysis
    const reasonCounts = returnsList.reduce((acc, r) => {
        acc[r.reason] = (acc[r.reason] || 0) + 1;
        return acc;
    }, {});
    const reasonEntries = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
    const totalReturns = returnsList.length || 1;

    // Economic impact
    const totalRefundValue = returnsList.reduce((a, r) => a + r.amount, 0);
    const avgRefund = (totalRefundValue / totalReturns).toFixed(1);

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Inteligencia de Devoluciones</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Análisis de causas, impacto económico y patrones de devolución</p>

            {/* KPIs */}
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                {[
                    { l: "Total Devoluciones", v: returnsKPIs.totalReturns, c: "#ef4444" },
                    { l: "Tasa de Devolución", v: returnsKPIs.returnRate, s: "%", c: "#f59e0b" },
                    { l: "Valor Total de Reembolsos", v: totalRefundValue, s: "€", c: "#0ea5e9" },
                    { l: "Reembolso Medio", v: avgRefund, s: "€", c: "#8b5cf6" },
                ].map((m, i) => (
                    <div key={i} className="glass-card fade-in-up" style={{ padding: "16px 20px", animationDelay: `${i * 50}ms` }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{m.l}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", color: m.c }}><AnimNum value={parseFloat(m.v)} suffix={m.s || ""} /></div>
                    </div>
                ))}
            </div>

            {/* Cause Analysis */}
            <div className="glass-card fade-in-up" style={{ padding: 22, marginBottom: 20, animationDelay: "200ms" }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Return Cause Analysis</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {reasonEntries.map(([reason, count], i) => {
                        const pct = ((count / totalReturns) * 100).toFixed(0);
                        const color = reasonColors[reason] || "#0ea5e9";
                        return (
                            <div key={i}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ fontSize: 13, fontWeight: 500 }}>{reason}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{count} ({pct}%)</span>
                                </div>
                                <div style={{ height: 8, background: "rgba(14,165,233,0.04)", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: color, transition: "width 0.6s ease" }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Insight card */}
            <div className="glass-card fade-in-up" style={{ padding: 22, marginBottom: 20, border: "1px solid rgba(139,92,246,0.15)", animationDelay: "250ms" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ color: "#8b5cf6" }}>{I.sparkle}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Key Insight</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {reasonEntries[0] ? `"${reasonEntries[0][0]}" representa el ${((reasonEntries[0][1] / totalReturns) * 100).toFixed(0)}% de todas las devoluciones. ` : ""}
                    {returnsKPIs.defectiveRate > 5
                        ? `La tasa de defectos (${returnsKPIs.defectiveRate}%) está por encima del umbral aceptable. Considera una auditoría de calidad.`
                        : `La tasa de defectos (${returnsKPIs.defectiveRate}%) está dentro de los parámetros normales.`}
                </p>
            </div>

            {/* Returns table */}
            <div className="fade-in-up" style={{ animationDelay: "300ms" }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Todas las Devoluciones</div>
                <DataTable columns={cols} data={returnsList} />
            </div>
        </div>
    );
}
