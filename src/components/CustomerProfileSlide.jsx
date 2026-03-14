import { motion, AnimatePresence } from "framer-motion";
import { I, AnimNum } from "./Shared";

export default function CustomerProfileSlide({ isOpen, onClose, customer }) {
    if (!customer && !isOpen) return null;

    // AI Mock Insights based on customer segment
    const insights = {
        VIP: { churnRisk: "Bajo (2%)", nextPurchase: "7-10 días", recommendation: "Campaña Early Access Nueva Colección" },
        Recurrente: { churnRisk: "Medio (15%)", nextPurchase: "15-20 días", recommendation: "Upsell Set Regalo Plata" },
        Nuevo: { churnRisk: "Alto (45%)", nextPurchase: "Pendiente", recommendation: "Secuencia Email de Bienvenida + 10% descuento" },
        Inactivo: { churnRisk: "Crítico (80%)", nextPurchase: "Improbable", recommendation: "Oferta Reactivación Flash (SMS)" }
    };

    const cInsights = customer ? insights[customer.segment] : null;

    // Segment colors map
    const segColors = { VIP: "#8b5cf6", Recurrente: "#0ea5e9", Nuevo: "#10b981", Inactivo: "#94a3b8" };
    const color = customer ? segColors[customer.segment] : "#ffffff";

    return (
        <AnimatePresence>
            {isOpen && customer && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", zIndex: 99
                        }}
                        onClick={onClose}
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: "100%", opacity: 0.5 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0.5 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{
                            position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: 440,
                            background: "var(--bg-secondary)", borderLeft: "1px solid var(--border-light)",
                            boxShadow: "-20px 0 50px rgba(0,0,0,0.5)", zIndex: 100, overflowY: "auto",
                            display: "flex", flexDirection: "column"
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: "24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", overflow: "hidden" }}>
                            {/* Accent Glow */}
                            <div style={{ position: "absolute", top: -50, right: -50, width: 150, height: 150, background: color, filter: "blur(80px)", opacity: 0.15, pointerEvents: "none" }} />

                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-tertiary)", border: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
                                        {customer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{customer.name}</h2>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                                            {customer.id} <span style={{ color: "var(--border-hover)" }}>|</span>
                                            <span style={{ color, fontWeight: 600, background: `${color}15`, padding: "2px 8px", borderRadius: 4 }}>{customer.segment}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}>
                                {I.x}
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>

                            {/* KPI Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div className="glass-card" style={{ padding: 16 }}>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Lifetime Value (LTV)</div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: "#8b5cf6" }}><AnimNum value={customer.ltv} suffix="€" /></div>
                                </div>
                                <div className="glass-card" style={{ padding: 16 }}>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Total Pedidos</div>
                                    <div style={{ fontSize: 24, fontWeight: 700 }}><AnimNum value={customer.orders} /></div>
                                </div>
                                <div className="glass-card" style={{ padding: 16 }}>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Gasto Total</div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: "#0ea5e9" }}><AnimNum value={customer.totalSpend} suffix="€" /></div>
                                </div>
                                <div className="glass-card" style={{ padding: 16 }}>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Última Compra</div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginTop: 4 }}>{customer.lastPurchase}</div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="glass-card" style={{ padding: 20 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ color: "var(--text-muted)" }}>{I.user}</span> Datos de Contacto
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>{I.whatsapp}</div>
                                        <div>
                                            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Teléfono</div>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>{customer.phone || "+34 Pendiente"}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>{I.send}</div>
                                        <div>
                                            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Dirección de Envío Principal</div>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>{customer.address || "Dirección no especificada"}<br /><span style={{ color: "var(--text-muted)", fontSize: 11 }}>{customer.city}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Zentra AI Predictions */}
                            <div className="glass-card" style={{ padding: 20, position: "relative", overflow: "hidden", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
                                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: "linear-gradient(90deg, #8b5cf6, #3b82f6)" }} />
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                                    {I.sparkle}
                                    <span style={{ fontSize: 14, fontWeight: 600, background: "linear-gradient(90deg, #8b5cf6, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Zentra AI Insights</span>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Riesgo de Churn</span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: cInsights?.churnRisk?.includes("Bajo") ? "#10b981" : (cInsights?.churnRisk?.includes("Alto") || cInsights?.churnRisk?.includes("Crítico") ? "#ef4444" : "#f59e0b") }}>{cInsights?.churnRisk || "Desconocido"}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Próxima compra estimada</span>
                                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{cInsights?.nextPurchase}</span>
                                    </div>
                                    <div style={{ padding: "12px", background: "rgba(139, 92, 246, 0.05)", borderRadius: 8, border: "1px dashed rgba(139, 92, 246, 0.2)" }}>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Campaña Recomendada</div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{cInsights?.recommendation}</div>

                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <button className="btn-ghost" style={{ justifyContent: "center", gap: 8, padding: 12 }}>
                                    {I.whatsapp} WhatsApp
                                </button>
                                <button className="btn-ghost" style={{ justifyContent: "center", gap: 8, padding: 12 }}>
                                    {I.send} Email
                                </button>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
