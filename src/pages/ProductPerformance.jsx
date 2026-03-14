import { useState, useEffect } from "react";
import { I, AnimNum, Skeleton, EmptyState } from "../components/Shared";
import { GlassCard, LiquidIcon, StaggerContainer, StaggerItem } from "../components/Motion";
import { getProducts } from "../services/dataService";
import { useTenant } from "../context/TenantContext";

export default function ProductPerformance() {
    const { activeTenant } = useTenant();
    const [isLoading, setIsLoading] = useState(true);
    const [productsData, setProductsData] = useState([]);

    const [filter, setFilter] = useState("Todos");

    useEffect(() => {
        let isMounted = true;
        async function loadProds() {
            if (!activeTenant) return;
            setIsLoading(true);
            try {
                const data = await getProducts(activeTenant.id);
                if (isMounted) setProductsData(data || []);
            } catch (err) {
                console.error("Error loadProds PP:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        loadProds();
        return () => { isMounted = false; };
    }, [activeTenant]);

    const types = ["Todos", ...new Set(productsData.map(p => p.type))];
    const filtered = filter === "Todos" ? productsData : productsData.filter(p => p.type === filter);

    // Performance metrics
    const totalRevenue = filtered.reduce((a, p) => a + (p.price * p.sales30d), 0);
    const avgConversion = filtered.length > 0 ? (filtered.reduce((a, p) => a + (p.conversions / Math.max(p.views, 1)) * 100, 0) / filtered.length).toFixed(1) : 0;
    const avgReturnRate = filtered.length > 0 ? (filtered.reduce((a, p) => a + (p.returns / Math.max(p.sales30d, 1)) * 100, 0) / filtered.length).toFixed(1) : 0;
    const topPerformer = [...filtered].sort((a, b) => b.sales30d - a.sales30d)[0];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Rendimiento de Producto</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Contribución a ingresos, tasas de conversión, rotación e impacto de devoluciones</p>
                </div>
                <div style={{ display: "flex", gap: 4, background: "var(--bg-glass)", borderRadius: 10, padding: 3, border: "1px solid var(--border)" }}>
                    {types.map(t => (
                        <button key={t} onClick={() => setFilter(t)} style={{
                            padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                            background: filter === t ? "var(--gold-gradient)" : "transparent",
                            color: filter === t ? "#fff" : "var(--text-muted)",
                            transition: "background 0.2s, color 0.2s",
                        }}>{t === "All" ? "Todos" : t}</button>
                    ))}
                </div>
            </div>

            {/* KPIs */}
            {isLoading ? (
                <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} height={100} borderRadius={16} />)}
                </div>
            ) : (
                <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
                    {[
                        { l: "Ingresos (30d)", v: totalRevenue.toFixed(0), s: "€", c: "#10b981" },
                        { l: "Conversión Media", v: avgConversion, s: "%", c: "#0ea5e9" },
                        { l: "Tasa de Devolución", v: avgReturnRate, s: "%", c: avgReturnRate > 5 ? "#ef4444" : "#f59e0b" },
                        { l: "Producto Top", v: topPerformer?.sales30d || 0, s: " uds", c: "#8b5cf6", extra: topPerformer?.title },
                    ].map((m, i) => (
                        <div key={i} className="glass-card fade-in-up" style={{ padding: "16px 20px", animationDelay: `${i * 50}ms` }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{m.l}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", color: m.c }}><AnimNum value={parseFloat(m.v)} suffix={m.s || ""} /></div>
                            {m.extra && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{m.extra}</div>}
                        </div>
                    ))}
                </div>
            )}

            {/* Product scorecards */}
            {isLoading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} height={200} borderRadius={16} />)}
                </div>
            ) : productsData.length === 0 ? (
                <EmptyState icon="📦" title="Sin rendimiento de productos" message="Inicia la sincronización de Shopify en Ajustes para ver esta analítica." height={300} />
            ) : (
                <StaggerContainer staggerDelay={0.06} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                    {filtered.map((p, i) => {
                        const margin = ((p.price - p.cost) / p.price * 100).toFixed(0);
                        const convRate = ((p.conversions / Math.max(p.views, 1)) * 100).toFixed(1);
                        const returnRate = ((p.returns / Math.max(p.sales30d, 1)) * 100).toFixed(0);
                        const rotation = (p.sales30d / Math.max(p.stock, 1)).toFixed(1);
                        const revenue = (p.price * p.sales30d).toFixed(0);

                        return (
                            <StaggerItem key={p.id}>
                                <div className="glass-card glass-card-interactive" style={{ padding: "20px 22px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                                        <LiquidIcon color="#0ea5e9" size={38}>{I.products}</LiquidIcon>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{p.title}</div>
                                            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{p.type} · {p.id}</div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>{revenue}€</div>
                                            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>30d revenue</div>
                                        </div>
                                    </div>

                                    {/* Performance grid */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: "12px 0", borderTop: "1px solid var(--border)" }}>
                                        <div>
                                            <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>Margin</div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: margin > 60 ? "#10b981" : "#f59e0b" }}>{margin}%</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>Conv.</div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#0ea5e9" }}>{convRate}%</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>Returns</div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: returnRate > 5 ? "#ef4444" : "#10b981" }}>{returnRate}%</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>Rotation</div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#8b5cf6" }}>{rotation}x</div>
                                        </div>
                                    </div>

                                    {/* Stock status */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                                        <div style={{ flex: 1, height: 4, background: "rgba(14,165,233,0.06)", borderRadius: 2, overflow: "hidden" }}>
                                            <div style={{ width: `${Math.min(p.stock / 50, 1) * 100}%`, height: "100%", borderRadius: 2, background: p.stock < 10 ? "#ef4444" : p.stock < 20 ? "#f59e0b" : "#10b981" }} />
                                        </div>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: p.stock < 10 ? "#ef4444" : "var(--text-muted)" }}>{p.stock} units</span>
                                    </div>
                                </div>
                            </StaggerItem>
                        );
                    })}
                </StaggerContainer>
            )}
        </div>
    );
}
