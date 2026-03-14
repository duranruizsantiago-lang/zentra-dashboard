import { useState, useEffect } from "react";
import { I, Skeleton, EmptyState } from "../components/Shared";
import { exportToCSV, getOrders, getProducts, getCustomerList, getReturns, getReports } from "../services/dataService";
import { useTenant } from "../context/TenantContext";

export default function Reportes() {
    const { activeTenant } = useTenant();
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchReports() {
            if (!activeTenant) return;
            setIsLoading(true);
            try {
                const data = await getReports(activeTenant.id);
                if (isMounted) {
                    setReports(data);
                }
            } catch (err) {
                console.error("[Reportes] Error fetching reports:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        fetchReports();
        return () => { isMounted = false; };
    }, [activeTenant]);
    const handleExport = async (type) => {
        switch (type) {
            case "orders": {
                const ords = await Promise.resolve(getOrders(activeTenant.id, "30d"));
                exportToCSV(ords.map(o => ({
                    id: o.id, date: o.date, customer: o.customer, product: o.product,
                    qty: o.qty, total: o.total, status: o.status, channel: o.channel, margin: o.margin
                })), "zentra_orders");
                break;
            }
            case "products": {
                const prods = await getProducts(activeTenant.id);
                exportToCSV(prods.map(p => ({
                    id: p.id, title: p.title, type: p.type, price: p.price, cost: p.cost,
                    stock: p.stock, sales_30d: p.sales30d, views: p.views, conversions: p.conversions, returns: p.returns
                })), "zentra_products");
                break;
            }
            case "customers": {
                const custs = await Promise.resolve(getCustomerList(activeTenant.id));
                exportToCSV(custs.map(c => ({
                    id: c.id, name: c.name, orders: c.orders, total_spent: c.totalSpend,
                    ltv: c.ltv, last_purchase: c.lastPurchase, segment: c.segment, channel: c.channel, city: c.city
                })), "zentra_customers");
                break;
            }
            case "returns": {
                const rets = await Promise.resolve(getReturns(activeTenant.id, "30d"));
                exportToCSV(rets.map(r => ({
                    rma_id: r.id, order_id: r.orderId, date: r.date, customer: r.customer,
                    product: r.product, amount: r.amount, reason: r.reason, status: r.status
                })), "zentra_returns");
                break;
            }
            default: break;
        }
    };

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Reportes</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Exporta los datos de tu negocio y descarga reportes anteriores</p>

            {/* Export section */}
            <div className="glass-card fade-in-up" style={{ padding: 22, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ color: "#0ea5e9" }}>{I.download}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Exportar Datos (CSV)</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                    {[
                        { key: "orders", label: "Pedidos", desc: "Todos los pedidos con estado, canal y margen", icon: "📦" },
                        { key: "products", label: "Productos", desc: "Catálogo con stock, ventas y conversiones", icon: "🏷️" },
                        { key: "customers", label: "Clientes", desc: "Listado de clientes con LTV, segmento y canal", icon: "👥" },
                        { key: "returns", label: "Devoluciones", desc: "Devoluciones con motivos, importes y estado", icon: "🔄" },
                    ].map(exp => (
                        <button key={exp.key} onClick={() => handleExport(exp.key)}
                            className="glass-card glass-card-interactive"
                            style={{ padding: "16px", textAlign: "left", cursor: "pointer", border: "1px solid var(--border)" }}>
                            <div style={{ fontSize: 20, marginBottom: 6 }}>{exp.icon}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{exp.label}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{exp.desc}</div>
                            <div style={{ fontSize: 10, color: "#0ea5e9", fontWeight: 600, marginTop: 8 }}>Descargar CSV →</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Report history */}
            <div className="glass-card fade-in-up" style={{ padding: 22, animationDelay: "100ms" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ color: "#8b5cf6" }}>{I.reports}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Historial de Reportes</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {isLoading && (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderRadius: 10, background: "rgba(14,165,233,0.02)", border: "1px solid var(--border)", marginBottom: 8 }}>
                                <div>
                                    <Skeleton width="120px" height="16px" style={{ marginBottom: 6 }} />
                                    <Skeleton width="90px" height="12px" />
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Skeleton width="60px" height="18px" borderRadius="12px" />
                                    <Skeleton width="50px" height="18px" borderRadius="12px" />
                                </div>
                            </div>
                        ))
                    )}
                    {!isLoading && reports.map((r, i) => (
                        <div key={r.id} className="fade-in-up" style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 16px", borderRadius: 10, background: "rgba(14,165,233,0.02)",
                            border: "1px solid var(--border)", animationDelay: `${150 + i * 40}ms`,
                        }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.date} · {r.size}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span className="badge" style={{ background: r.type === "mensual" ? "rgba(139,92,246,0.1)" : "rgba(14,165,233,0.1)", color: r.type === "mensual" ? "#8b5cf6" : "#0ea5e9", fontSize: 9 }}>
                                    {r.type}
                                </span>
                                <span className="badge" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 9 }}>
                                    ● {r.status}
                                </span>
                            </div>
                        </div>
                    ))}
                    {!isLoading && reports.length === 0 && (
                        <EmptyState icon="📄" title="Sin reportes" message="Aún no se ha generado ningún reporte para este local." height={140} />
                    )}
                </div>
            </div>
        </div>
    );
}
