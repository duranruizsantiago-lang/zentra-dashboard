import { useState, useEffect } from "react";
import { I, AnimNum, Skeleton, EmptyState } from "../components/Shared";
import DataTable from "../components/DataTable";
import { getProducts } from "../services/dataService";
import { useTenant } from "../context/TenantContext";

const cols = [
    { key: "title", label: "Producto", sortable: true, render: (v, r) => <div><div style={{ fontWeight: 600 }}>{v}</div><div style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.id}</div></div> },
    { key: "stock", label: "Stock", sortable: true, align: "right", render: v => <span style={{ color: v < 15 ? "#ef4444" : "#10b981", fontWeight: 600 }}>{v}</span> },
    { key: "daysOfStock", label: "Días stock", sortable: true, align: "right", render: v => <span style={{ color: v < 7 ? "#ef4444" : v < 14 ? "#f59e0b" : "#10b981", fontWeight: 600 }}>{v}d</span> },
    { key: "velocity", label: "Vel./día", sortable: true, align: "right" },
    { key: "reorderPoint", label: "Reorden", sortable: true, align: "right" },
    { key: "cost", label: "Coste un.", sortable: true, align: "right", render: v => `${v}€` },
    { key: "sales30d", label: "Ventas 30d", sortable: true, align: "right" },
];

export default function Inventario() {
    const { activeTenant } = useTenant();
    const [isLoading, setIsLoading] = useState(true);
    const [invData, setInvData] = useState([]);

    useEffect(() => {
        let isMounted = true;
        async function fetchInv() {
            if (!activeTenant) return;
            setIsLoading(true);
            try {
                const prods = await getProducts(activeTenant.id);
                if (isMounted) {
                    const enriched = prods.map(p => ({
                        ...p,
                        daysOfStock: p.sales30d > 0 ? Math.round(p.stock / (p.sales30d / 30)) : 999,
                        velocity: (p.sales30d / 30).toFixed(1),
                        reorderPoint: Math.round((p.sales30d / 30) * 7),
                    }));
                    setInvData(enriched);
                }
            } catch (err) {
                console.error("Error fetching inventory:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        fetchInv();
        return () => { isMounted = false; };
    }, [activeTenant]);

    const lowStock = invData.filter(p => p.stock < 15);
    const stagnantStock = invData.filter(p => p.sales30d === 0 && p.stock > 15);
    const totalVal = invData.reduce((a, p) => a + p.stock * p.cost, 0);
    const avgRot = invData.length > 0 ? (invData.reduce((a, p) => a + p.sales30d / Math.max(p.stock, 1), 0) / invData.length).toFixed(1) : 0;

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Inventario</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Gestión de stock y predicciones de inventario</p>

            {isLoading ? (
                <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} height={100} borderRadius={16} />)}
                </div>
            ) : (
                <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                    {[
                        { l: "Valor total stock", v: totalVal.toFixed(0), s: "€", c: "#3b82f6" },
                        { l: "SKUs activos", v: invData.length, c: "#0ea5e9" },
                        { l: "Stock bajo", v: lowStock.length, c: "#ef4444" },
                        { l: "Rotación media", v: avgRot, s: "x", c: "#10b981" },
                    ].map((m, i) => (
                        <div key={i} className="glass-card fade-in-up" style={{ padding: "16px 20px", animationDelay: `${i * 50}ms` }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{m.l}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", color: m.c }}><AnimNum value={parseFloat(m.v)} suffix={m.s || ""} /></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Low stock alerts */}
            {!isLoading && lowStock.length > 0 && (
                <div className="glass-card fade-in-up" style={{ padding: 22, marginBottom: 20, animationDelay: "200ms", border: "1px solid rgba(239,68,68,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <span style={{ color: "#ef4444" }}>{I.alert}</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>Alertas de stock bajo</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                        {lowStock.map((p, i) => (
                            <div key={i} style={{ background: "rgba(239,68,68,0.03)", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(239,68,68,0.08)" }}>
                                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{p.title}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Stock: <span style={{ color: "#ef4444", fontWeight: 600 }}>{p.stock}</span> · Días restantes: <span style={{ fontWeight: 600 }}>{p.daysOfStock}d</span></div>
                                <button className="btn-ghost" style={{ marginTop: 8, fontSize: 10, padding: "3px 10px" }}>Reabastecer</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stagnant stock alerts */}
            {!isLoading && stagnantStock.length > 0 && (
                <div className="glass-card fade-in-up" style={{ padding: 22, marginBottom: 20, animationDelay: "220ms", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <span style={{ color: "#8b5cf6" }}>{I.sparkle}</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>Alerta de Stock Inmovilizado</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
                        {stagnantStock.map((p, i) => (
                            <div key={i} style={{ background: "rgba(139, 92, 246, 0.03)", borderRadius: 12, padding: "16px", border: "1px solid rgba(139, 92, 246, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{p.title}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Stock Inmovilizado: <span style={{ color: "#8b5cf6", fontWeight: 600 }}>{p.stock}</span></div>
                                </div>
                                <span className="badge" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", fontSize: 10 }}>Acción requerida</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stock prediction */}
            {!isLoading && invData.length > 0 && (
                <div className="glass-card fade-in-up" style={{ padding: 22, marginBottom: 20, animationDelay: "250ms" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Predicción de agotamiento</div>
                    {[...invData].sort((a, b) => a.daysOfStock - b.daysOfStock).slice(0, 5).map((p, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                            <div style={{ width: 140, fontSize: 12, fontWeight: 500 }}>{p.title}</div>
                            <div style={{ flex: 1, height: 6, background: "rgba(14,165,233,0.04)", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: `${Math.min(p.daysOfStock / 30, 1) * 100}%`, height: "100%", borderRadius: 3, background: p.daysOfStock < 7 ? "linear-gradient(90deg, #ef4444, #f97316)" : p.daysOfStock < 14 ? "linear-gradient(90deg, #f59e0b, #eab308)" : "linear-gradient(90deg, #10b981, #34d399)" }} />
                            </div>
                            <div style={{ width: 50, fontSize: 12, fontWeight: 600, color: p.daysOfStock < 7 ? "#ef4444" : p.daysOfStock < 14 ? "#f59e0b" : "#10b981" }}>{p.daysOfStock}d</div>
                        </div>
                    ))}
                </div>
            )}

            {isLoading ? (
                <Skeleton width="100%" height={300} borderRadius={16} />
            ) : invData.length === 0 ? (
                <EmptyState icon="⚖️" title="Sin inventario" message="Conecta tu tienda para sincronizar productos." height={250} />
            ) : (
                <div className="fade-in-up" style={{ animationDelay: "300ms" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Inventario completo</div>
                    <DataTable columns={cols} data={invData} />
                </div>
            )}
        </div>
    );
}
