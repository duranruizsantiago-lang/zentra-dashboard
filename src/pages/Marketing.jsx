import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { I, AnimNum, Skeleton, EmptyState, Tooltip } from "../components/Shared";
import { LiquidIcon, StaggerContainer, StaggerItem } from "../components/Motion";
import DataTable from "../components/DataTable";
import { getCampaigns } from "../services/dataService";
import { useTenant } from "../context/TenantContext";

const colDefs = [
    { key: "name", label: "Campaña", render: (v, r) => <><span style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</span><br /><span style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.platform}</span></> },
    { key: "status", label: "Estado", render: (v, r) => <span className={`badge badge-${r.status === "activa" ? "green" : r.status === "pausada" ? "gold" : "red"}`}>{r.status.toUpperCase()}</span> },
    { key: "spend", label: "Gasto", render: (v, r) => <span style={{ fontWeight: 500 }}>{r.spend}€</span> },
    { key: "revenue", label: "Ingresos", render: (v, r) => <span style={{ fontWeight: 600, color: "#10b981" }}>{r.revenue}€</span> },
    { key: "roas", label: "ROAS", render: (v, r) => <span style={{ fontWeight: 700, color: r.roas >= 3 ? "#10b981" : r.roas >= 2 ? "#f59e0b" : "#ef4444" }}>{r.roas}x</span> },
    { key: "cpa", label: "CPA", render: (v, r) => <span>{r.cpa}€</span> },
    { key: "ctr", label: "CTR", render: (v, r) => <span>{r.ctr}%</span> },
    {
        key: "action", label: "Acción", render: (v, r) => {
            const colors = { escalar: "#10b981", pausar: "#f59e0b", "revisar creativos": "#3b82f6", mantener: "#8b5cf6" };
            return <span style={{ fontWeight: 600, color: colors[r.action] || "#0ea5e9", fontSize: 12, textTransform: "uppercase" }}>{r.action}</span>;
        }
    },
];

export default function Marketing() {
    const { activeTenant } = useTenant();
    const [isLoading, setIsLoading] = useState(true);
    const [campaignsList, setCampaignsList] = useState([]);
    const [platformsData, setPlatformsData] = useState([]);

    useEffect(() => {
        let isMounted = true;
        async function fetchMarketing() {
            if (!activeTenant) return;
            setIsLoading(true);
            try {
                const data = await getCampaigns(activeTenant.id);
                if (isMounted) {
                    setCampaignsList(data || []);

                    const platMap = {};
                    (data || []).forEach(c => {
                        if (!platMap[c.platform]) platMap[c.platform] = { name: c.platform, spend: 0, revenue: 0, color: c.platform === "Meta" ? "#3b82f6" : c.platform === "Google" ? "#10b981" : "#ec4899" };
                        platMap[c.platform].spend += c.spend;
                        platMap[c.platform].revenue += c.revenue;
                    });

                    const pList = Object.values(platMap).map(p => ({
                        ...p,
                        roas: p.spend > 0 ? (p.revenue / p.spend).toFixed(2) : 0
                    }));
                    setPlatformsData(pList);
                }
            } catch (err) {
                console.error("Error fetching admin marketing:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        fetchMarketing();
        return () => { isMounted = false; };
    }, [activeTenant]);

    return (
        <div>


            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Marketing</h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Rendimiento de campañas y plataformas publicitarias</p>
                </div>

            </motion.div>

            {/* Platform KPIs */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Rendimiento por plataforma</motion.div>

            {isLoading ? (
                <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} height={140} borderRadius={16} />)}
                </div>
            ) : platformsData.length === 0 ? (
                <EmptyState icon="📈" title="Sin campañas activas" message="Conecta Meta Ads o Google Analytics en Ajustes para ver tu rendimiento." height={180} />
            ) : (
                <StaggerContainer staggerDelay={0.08} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }} className="stats-grid">
                    {platformsData.map((p, i) => (
                        <StaggerItem key={p.name}>
                            <div className="glass-card" style={{ padding: "22px 24px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                    <LiquidIcon color={p.color} size={36}>{I.marketing}</LiquidIcon>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                                            {p.name}
                                            <Tooltip content={`Datos agregados directamente desde ${p.name} Ads api`}>
                                                <span style={{ display: "inline-flex", color: "var(--text-dim)", opacity: 0.7 }}>{I.info}</span>
                                            </Tooltip>
                                        </div>
                                        <span className="badge" style={{ background: `${p.color}12`, color: p.color, fontSize: 9 }}>
                                            ROAS {p.roas}x
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Gasto</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)" }}>{p.spend.toFixed(0)}€</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Ingresos</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", color: p.color }}>{p.revenue.toFixed(0)}€</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>ROAS</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", color: p.roas >= 3 ? "#10b981" : "#f59e0b" }}>{p.roas}x</div>
                                    </div>
                                </div>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            )}

            {/* Campaigns Table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Campañas</motion.div>
            {!isLoading && campaignsList.length > 0 && (
                <DataTable columns={colDefs} data={campaignsList} />
            )}
        </div>
    );
}
