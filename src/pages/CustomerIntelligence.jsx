import { useState, useEffect, useContext } from "react";
import { I, AnimNum, Skeleton } from "../components/Shared";
import DataTable from "../components/DataTable";
import CustomerProfileSlide from "../components/CustomerProfileSlide";
import { getCustomerSegments, getCustomerList } from "../services/dataService";
import { TenantContext } from "../context/TenantContext";

const segColors = { VIP: "#8b5cf6", Recurrentes: "#0ea5e9", Nuevos: "#10b981", Inactivos: "#94a3b8" };

const cols = [
    { key: "name", label: "Cliente", sortable: true, render: (v, r) => <div><div style={{ fontWeight: 600 }}>{v}</div><div style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.segment}</div></div> },
    { key: "orders", label: "Pedidos", sortable: true, align: "right" },
    { key: "totalSpent", label: "Total Gastado", sortable: true, align: "right", render: v => <span style={{ color: "#0ea5e9", fontWeight: 600 }}>{v}€</span> },
    { key: "ltv", label: "LTV", sortable: true, align: "right", render: v => <span style={{ fontWeight: 700, color: "#8b5cf6" }}>{v}€</span> },
    {
        key: "lastPurchase", label: "Última Compra", sortable: true, render: v => {
            const days = Math.floor((Date.now() - new Date(v).getTime()) / 86400000);
            const color = days > 60 ? "#ef4444" : days > 30 ? "#f59e0b" : "#10b981";
            return <span style={{ color, fontWeight: 500 }}>hace {days}d</span>;
        }
    },
    { key: "channel", label: "Canal", sortable: true },
];

export default function CustomerIntelligence() {
    const { activeTenant } = useContext(TenantContext);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [segments, setSegments] = useState([]);
    const [list, setList] = useState([]);

    useEffect(() => {
        if (!activeTenant) return;
        async function load() {
            // Note: getCustomerSegments/getCustomerList currently sync, simulated as async
            const [segData, listData] = await Promise.all([
                Promise.resolve(getCustomerSegments(activeTenant.id)),
                Promise.resolve(getCustomerList(activeTenant.id))
            ]);
            setSegments(segData);
            setList(listData);
            setIsLoading(false);
        }
        load();
    }, []);

    const totalCust = segments.reduce((a, s) => a + s.count, 0) || 1;
    const avgLTV = list.length > 0 ? (list.reduce((a, c) => a + c.ltv, 0) / list.length).toFixed(0) : 0;
    const repeatRate = list.length > 0 ? ((list.filter(c => c.orders > 1).length / list.length) * 100).toFixed(0) : 0;
    const avgFrequency = list.length > 0 ? (list.reduce((a, c) => a + c.orders, 0) / list.length).toFixed(1) : 0;

    if (isLoading) {
        return (
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Inteligencia de Clientes</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 20 }}>
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} height={80} borderRadius={16} />)}
                </div>
            </div>
        );
    }

    return (
        <div>
            <CustomerProfileSlide isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} customer={selectedCustomer} />
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Inteligencia de Clientes</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Segmentación, valor de vida, retención y análisis de comportamiento</p>

            {/* Intelligence KPIs */}
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                {[
                    { l: "Total Clientes", v: totalCust, c: "#0ea5e9" },
                    { l: "LTV Medio", v: avgLTV, s: "€", c: "#8b5cf6" },
                    { l: "Compradores Recurrentes", v: repeatRate, s: "%", c: "#10b981" },
                    { l: "Frecuencia Compra", v: avgFrequency, s: "x", c: "#f59e0b" },
                ].map((m, i) => (
                    <div key={i} className="glass-card fade-in-up" style={{ padding: "16px 20px", animationDelay: `${i * 50}ms` }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{m.l}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", color: m.c }}><AnimNum value={parseFloat(m.v)} suffix={m.s || ""} /></div>
                    </div>
                ))}
            </div>

            {/* Segmentation bar */}
            <div className="glass-card fade-in-up" style={{ padding: 22, marginBottom: 20, animationDelay: "200ms" }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Customer Segments</div>
                <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 14 }}>
                    {segments.map((s, i) => (
                        <div key={i} style={{ width: `${(s.count / totalCust) * 100}%`, background: segColors[s.name], transition: "width 0.5s" }} />
                    ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                    {segments.map((s, i) => (
                        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: segColors[s.name] }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</span>
                            </div>
                            <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", color: segColors[s.name] }}>{s.count}</span>
                            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{((s.count / totalCust) * 100).toFixed(0)}% of total</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* At-risk customers alert */}
            {(() => {
                const now = Date.now();
                const atRisk = list.filter(c => {
                    const days = Math.floor((now - new Date(c.lastPurchase).getTime()) / 86400000);
                    return days > 45 && c.orders > 2;
                });
                if (atRisk.length === 0) return null;
                return (
                    <div className="glass-card fade-in-up" style={{ padding: 22, marginBottom: 20, border: "1px solid rgba(239,68,68,0.12)", animationDelay: "250ms" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <span style={{ color: "#ef4444" }}>{I.alert}</span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>Clientes en Riesgo ({atRisk.length})</span>
                        </div>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>Clientes con 3+ pedidos que no han comprado en más de 45 días</p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                            {atRisk.slice(0, 4).map((c, i) => (
                                <div key={i} style={{ background: "rgba(239,68,68,0.03)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(239,68,68,0.08)" }}>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>LTV: <span style={{ color: "#8b5cf6", fontWeight: 600 }}>{c.ltv}€</span> · {c.orders} pedidos</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* Customer table */}
            <div className="fade-in-up" style={{ animationDelay: "300ms" }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Todos los Clientes</div>
                <DataTable columns={cols} data={list} onRowClick={(row) => setSelectedCustomer(row)} />
            </div>
        </div>
    );
}
