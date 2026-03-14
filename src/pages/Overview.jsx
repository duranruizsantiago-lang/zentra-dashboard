import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { I, AnimNum, Sparkline, ChartTooltip, Skeleton, EmptyState } from "../components/Shared";
import { GlassCard, LiquidIcon, StaggerContainer, StaggerItem } from "../components/Motion";
import { useTenant } from "../context/TenantContext";
import ActivationChecklist from "../components/ActivationChecklist";

import { getOverviewKPIs, getSalesDaily, getProducts, getFunnel, getAlerts, getRecommendedActions } from "../services/dataService";

function StatCard({ icon, label, tooltip, value, change, dir, color, prefix = "", suffix = "", spark, delay = 0, isSelected, onClick }) {
    return (
        <StaggerItem>
            <div
                className="glass-card-glow"
                onClick={onClick}
                style={{
                    padding: "22px 24px", position: "relative", overflow: "hidden", cursor: "pointer",
                    border: isSelected ? `1px solid ${color}` : "1px solid var(--border)",
                    background: isSelected ? `${color}15` : "var(--bg-glass)",
                    transform: isSelected ? "translateY(-6px) scale(1.02)" : "none",
                    boxShadow: isSelected ? `0 20px 40px ${color}30, inset 0 2px 10px ${color}20` : "var(--shadow-glass)",
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
            >
                {/* Shimmer sweep */}
                <div className="shimmer-layer" style={{
                    position: "absolute", top: "-50%", left: "-50%", width: "40%", height: "200%",
                    background: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 55%, transparent 100%)",
                    transform: "rotate(25deg)", animation: "highlightSweep 8s ease-in-out infinite",
                    animationDelay: `${delay * 0.8}s`, pointerEvents: "none", zIndex: 2
                }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, position: "relative", zIndex: 1 }}>
                    <LiquidIcon color={color} hover>{icon}</LiquidIcon>
                    {spark && <Sparkline data={spark} color={color} />}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600, letterSpacing: "0.02em", marginBottom: 5, position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                    {label}
                    {tooltip && (
                        <Tooltip content={tooltip}>
                            <span style={{ display: "inline-flex", color: "var(--text-dim)", opacity: 0.7 }}>{I.info}</span>
                        </Tooltip>
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, position: "relative", zIndex: 1 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: delay * 0.06 + 0.2, duration: 0.5 }}
                        style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)", lineHeight: 1, color: "var(--text-primary)" }}
                    >
                        <AnimNum value={value} prefix={prefix} suffix={suffix} />
                    </motion.div>
                    {change != null && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: delay * 0.06 + 0.4 }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: dir === "up" ? "var(--green)" : "var(--red)", background: dir === "up" ? "var(--green-dim)" : "var(--red-dim)", padding: "4px 8px", borderRadius: 20 }}
                        >
                            {dir === "up" ? I.arrowUp : I.arrowDown} {Math.abs(change)}%
                        </motion.span>
                    )}
                </div>
            </div>
        </StaggerItem>
    );
}

function FunnelBar({ stage, value, pct, maxVal, color, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay * 0.1, duration: 0.5 }}
            style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}
        >
            <div style={{ width: 100, fontSize: 13, color: "var(--text-primary)", fontWeight: 500, textAlign: "right" }}>{stage}</div>
            <div style={{ flex: 1, height: 32, background: "rgba(14,165,233,0.06)", borderRadius: 12, overflow: "hidden", position: "relative", border: "1px solid var(--border)" }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / maxVal) * 100}%` }}
                    transition={{ delay: delay * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                    style={{
                        height: "100%", borderRadius: 10,
                        background: `linear-gradient(90deg, ${color}20, ${color})`,
                        display: "flex", alignItems: "center", justifyContent: "flex-end",
                        paddingRight: 10, position: "relative", overflow: "hidden",
                    }}
                >
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", position: "relative", zIndex: 1 }}>{value.toLocaleString()}</span>
                </motion.div>
            </div>
            <div style={{ width: 40, fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{pct}%</div>
        </motion.div>
    );
}

const alertColors = { high: "var(--red)", medium: "#f59e0b", low: "var(--blue)" };

export default function Overview({ onNavigate }) {
    const { activeTenant } = useTenant();
    const [selectedKPI, setSelectedKPI] = useState("netSales");

    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState({ kpis: null, salesDaily: [], topProducts: [], funnel: [], alerts: [], recommendations: [] });

    useEffect(() => {
        let isMounted = true;
        async function loadOverviewData() {
            if (!activeTenant) return;
            setIsLoading(true);
            try {
                // Fetch real & mock data in parallel
                const [alertsData, recsData] = await Promise.all([
                    getAlerts(activeTenant.id),
                    getRecommendedActions(activeTenant.id)
                ]);

                // Fetch data async from Supabase directly
                const kpisData = await getOverviewKPIs(activeTenant.id);
                const salesData = await getSalesDaily(activeTenant.id, "30d");
                const prods = await getProducts(activeTenant.id);
                const fnl = await getFunnel(activeTenant.id, "30d");

                if (isMounted) {
                    setData({
                        kpis: kpisData,
                        salesDaily: salesData,
                        topProducts: [...prods].sort((a, b) => b.sales30d * b.price - a.sales30d * a.price).slice(0, 5),
                        funnel: fnl,
                        alerts: alertsData || [],
                        recommendations: recsData || []
                    });
                }
            } catch (err) {
                console.error("[Overview] Error loading data:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        loadOverviewData();
        return () => { isMounted = false; };
    }, [activeTenant]);

    // Mock dynamic chart data based on selected KPI
    const chartData = useMemo(() => {
        if (!data.salesDaily || data.salesDaily.length === 0) return [];
        const multipliers = { netSales: 1, orders: 0.1, conversion: 0.02, aov: 0.25, margin: 0.3, roas: 0.03, abandonedCarts: 0.08 };
        const m = multipliers[selectedKPI] || 1;

        return data.salesDaily.map(d => ({
            date: d.date,
            value: Number((d.revenue * m).toFixed(2))
        }));
    }, [selectedKPI, data.salesDaily]);

    const kpiNames = { netSales: "Ventas Netas", orders: "Pedidos", conversion: "Tasa de Conversión", aov: "Ticket Medio", margin: "Margen de Beneficio", roas: "ROAS Publicitario", abandonedCarts: "Carritos Abandonados" };
    const kpiColors = { netSales: "#0ea5e9", orders: "#3b82f6", conversion: "#10b981", aov: "#8b5cf6", margin: "#10b981", roas: "#0ea5e9", abandonedCarts: "#ef4444" };
    const curColor = kpiColors[selectedKPI] || "#0ea5e9";

    const k = data.kpis;

    return (
        <div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24, paddingLeft: 4, paddingRight: 4 }}>
                <h2 style={{ fontSize: "clamp(18px, 5vw, 22px)", fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 6, lineHeight: 1.3, color: "var(--text-primary)" }}>Bienvenido de nuevo,</h2>
                <p style={{ fontSize: "clamp(12px, 3.5vw, 13px)", color: "var(--text-muted)", lineHeight: 1.4 }}>Resumen de actividad de <strong style={{ color: "#0ea5e9" }}>{activeTenant?.name || "tu negocio"}</strong> · Últimos 7 días</p>
            </motion.div>

            <ActivationChecklist onNavigate={onNavigate} />

            {/* KPI Grid — Core Metrics Only */}
            {isLoading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card" style={{ padding: "22px 24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                                <Skeleton width="40px" height="40px" borderRadius="12px" />
                                <Skeleton width="60px" height="24px" />
                            </div>
                            <Skeleton width="50%" height="16px" style={{ marginBottom: 10 }} />
                            <Skeleton width="80%" height="32px" />
                        </div>
                    ))}
                </div>
            ) : !k ? (
                <div style={{ marginBottom: 24 }}>
                    <EmptyState
                        icon="🔗"
                        title="Faltan datos financieros"
                        message="Conecta tu plataforma de comercio para que Zentra calcule métricas financieras, ROAS y márgenes en tiempo real."
                        height={160}
                        actionLabel="Conectar Origen de Datos"
                        onAction={() => onNavigate("settings")}
                    />
                </div>
            ) : (
                <StaggerContainer staggerDelay={0.08} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }} className="stats-grid">
                    <StatCard isSelected={selectedKPI === "netSales"} onClick={() => setSelectedKPI("netSales")} icon={I.sales} label="Ventas netas" tooltip="Importe tras devoluciones. Fuente: Shopify" value={k.netSales.value} change={k.netSales.change} dir={k.netSales.dir} color="#0ea5e9" prefix="" suffix="€" spark={[120, 145, 130, 180, 160, 200, 190]} delay={0} />
                    <StatCard isSelected={selectedKPI === "roas"} onClick={() => setSelectedKPI("roas")} icon={I.marketing} label="Retorno Publicitario (ROAS)" tooltip="Atribución Click (7 días). Fuente: Meta Ads + GA4" value={k.roas.value} change={k.roas.change} dir={k.roas.dir} color="#8b5cf6" spark={[2.5, 2.8, 2.6, 3.0, 2.7, 3.1, 3.04]} delay={1} />
                    <StatCard isSelected={selectedKPI === "margin"} onClick={() => setSelectedKPI("margin")} icon={I.trend} label="Margen Bruto" tooltip="Beneficio tras Coste de Bienes (COGS). Fuente: Shopify" value={k.margin.value} change={k.margin.change} dir={k.margin.dir} color="#10b981" suffix="%" spark={[60, 61, 59, 62, 63, 61, 62.4]} delay={2} />
                    <StatCard isSelected={selectedKPI === "orders"} onClick={() => setSelectedKPI("orders")} icon={I.cart} label="Pedidos Totales" tooltip="Pedidos confirmados y pagados. Fuente: Shopify" value={k.orders.value} change={k.orders.change} dir={k.orders.dir} color="#3b82f6" spark={[5, 8, 6, 12, 9, 14, 11]} delay={3} />
                </StaggerContainer>
            )}

            {/* Chart + Funnel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 14, marginBottom: 20 }}>
                <GlassCard delay={7} glow>
                    <div style={{ padding: 22, display: "flex", flexDirection: "column", height: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                                    Evolución de {kpiNames[selectedKPI]} <span style={{ width: 8, height: 8, borderRadius: "50%", background: curColor, display: "inline-block" }} />
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Últimos 30 días</div>
                            </div>

                        </div>

                        <div style={{ flex: 1, minHeight: 200 }}>
                            {isLoading ? (
                                <Skeleton width="100%" height="100%" borderRadius="12px" />
                            ) : chartData.length === 0 ? (
                                <EmptyState
                                    icon="📉"
                                    title="Histórico Insuficiente"
                                    message="No hay suficiente volumen de datos para proyectar tendencias. Sincroniza al menos tu canal principal."
                                    height="100%"
                                    actionLabel="Configurar Sincronización"
                                    onAction={() => onNavigate("settings")}
                                />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="gGSelected" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={curColor} stopOpacity={0.35} />
                                                <stop offset="100%" stopColor={curColor} stopOpacity={0.02} />
                                            </linearGradient>
                                            <filter id="glowChart" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="5" result="blur" />
                                                <feComponentTransfer in="blur" result="glow">
                                                    <feFuncA type="linear" slope="1.5" />
                                                </feComponentTransfer>
                                                <feMerge>
                                                    <feMergeNode in="glow" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                        </defs>
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} interval={4} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Area type="monotone" dataKey="value" stroke={curColor} fill="url(#gGSelected)" strokeWidth={3} filter="url(#glowChart)" animationDuration={800} animationEasing="ease-out" name={kpiNames[selectedKPI]} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </GlassCard>

                <GlassCard delay={8}>
                    <div style={{ padding: 22 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Embudo de Conversión</div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>Captación → Transacción</div>
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} width="100%" height="32px" borderRadius="12px" style={{ marginBottom: 10 }} />
                            ))
                        ) : data.funnel.length === 0 ? (
                            <EmptyState
                                icon="🧭"
                                title="Calculando trayecto"
                                message="Conecta Meta Ads o GA4 para visualizar el flujo de clientes."
                                height={200}
                                actionLabel="Conectar"
                                onAction={() => onNavigate("settings")}
                            />
                        ) : (
                            data.funnel.map((f, i) => (
                                <FunnelBar key={i} {...f} maxVal={data.funnel[0].value} color={["#3b82f6", "#8b5cf6", "#0ea5e9", "#10b981"][i]} delay={i} />
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Top Products + Smart Alerts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 14, marginBottom: 20 }}>
                <GlassCard delay={9}>
                    <div style={{ padding: 22 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Rendimiento de Catálogo (Top 5)</div>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0" }}>
                                    <Skeleton width="26px" height="26px" />
                                    <Skeleton width="32px" height="32px" />
                                    <div style={{ flex: 1 }}>
                                        <Skeleton width="70%" height="16px" style={{ marginBottom: 4 }} />
                                        <Skeleton width="40%" height="12px" />
                                    </div>
                                    <Skeleton width="50px" height="20px" />
                                </div>
                            ))
                        ) : data.topProducts.length === 0 ? (
                            <EmptyState icon="📦" message="No hay productos vendidos en este periodo" height={160} />
                        ) : (
                            data.topProducts.map((p, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 + i * 0.08 }}
                                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid rgba(14,165,233,0.06)" : "none" }}
                                >
                                    <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(14,165,233,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0ea5e9" }}>{i + 1}</div>
                                    <img src={p.img} alt={p.title} style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(14,165,233,0.1)" }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</div>
                                        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{p.sales30d} vendidos</div>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>{(p.sales30d * p.price).toFixed(0)}€</div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </GlassCard>

                <GlassCard delay={10}>
                    <div style={{ padding: 22 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <span style={{ color: "var(--red)" }}>{I.alert}</span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>Notificaciones Operativas</span>
                            {!isLoading && <span className="badge badge-red" style={{ marginLeft: "auto" }}>{data.alerts.length}</span>}
                        </div>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} style={{ padding: "10px 0" }}>
                                    <Skeleton width="80%" height="20px" style={{ marginBottom: 8 }} />
                                    <Skeleton width="100%" height="16px" />
                                </div>
                            ))
                        ) : data.alerts.length === 0 ? (
                            <EmptyState icon="✅" title="Sin alertas" message="Todos los sistemas operan normal." height={160} />
                        ) : (
                            data.alerts.slice(0, 3).map((a, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 + i * 0.08 }}
                                    style={{ padding: "10px 0", borderBottom: i < Math.min(data.alerts.length, 3) - 1 ? "1px solid rgba(14,165,233,0.06)" : "none" }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                        <div className="dot-pulse" style={{ background: alertColors[a.severity] || "var(--blue)", width: 8, height: 8 }} />
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</span>
                                    </div>
                                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 18, marginBottom: 8 }}>{a.desc}</div>
                                    {a.action_link && (
                                        <button onClick={() => onNavigate?.(a.action_link)}
                                            className="btn-ghost" style={{ marginLeft: 18, fontSize: 12, padding: "4px 12px" }}>Resolver →</button>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Recommended Actions */}
            <GlassCard delay={11}>
                <div style={{ padding: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <LiquidIcon color="#0ea5e9" size={28}>{I.sparkle}</LiquidIcon>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>Decisiones Estratégicas</span>
                    </div>
                    {isLoading ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="glass-card" style={{ padding: "16px 14px", borderRadius: 16 }}>
                                    <Skeleton width="80%" height="16px" style={{ marginBottom: 6 }} />
                                    <Skeleton width="100%" height="32px" />
                                </div>
                            ))}
                        </div>
                    ) : data.recommendations.length === 0 ? (
                        <EmptyState icon="⚙️" title="No hay recomendaciones" message="Tu métricas indican estabilidad operativa." height={120} />
                    ) : (
                        <StaggerContainer staggerDelay={0.08} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                            {data.recommendations.slice(0, 4).map((a, i) => (
                                <StaggerItem key={i}>
                                    <motion.button
                                        whileHover={{ y: -3, scale: 1.02, boxShadow: "0 8px 32px rgba(14,165,233,0.08)" }}
                                        whileTap={{ scale: 0.97 }}
                                        className="glass-card-interactive"
                                        style={{ padding: "16px 14px", textAlign: "left", border: "1px solid rgba(255,255,255,0.5)", cursor: "pointer", background: "rgba(255,255,255,0.3)", width: "100%", borderRadius: 16 }}
                                    >
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{a.title}</div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.desc}</div>
                                    </motion.button>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
