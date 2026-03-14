import { motion } from "framer-motion";
import { I } from "../Shared";
import GlobalSearch from "../GlobalSearch";
import { useTenant } from "../../context/TenantContext";

const PERIODS = ["Hoy", "7d", "30d", "Mes"];

const PAGE_TITLES = {
    overview: "Panel General", reports: "Reportes",
    sales: "Ventas", marketing: "Marketing", customers: "Inteligencia de Clientes",
    inventory: "Inventario", products: "Rendimiento de Producto", returns: "Devoluciones",
    alerts: "Alertas",
    audit: "Auditoría", recommendations: "Recomendaciones", tracker: "Seguimiento",
    rules: "Reglas", integrations: "Integraciones",
    settings: "Configuración",
};

const SECTION_LABELS = {
    overview: "Ejecutivo", reports: "Ejecutivo",
    sales: "Ingresos", marketing: "Ingresos", customers: "Ingresos",
    inventory: "Operaciones", products: "Operaciones", returns: "Operaciones", alerts: "Operaciones",
    audit: "Mejora", recommendations: "Mejora", tracker: "Mejora",
    rules: "Automatización", integrations: "Automatización",
    settings: "Automatización",
};

export default function Header({ activeTab, period, onPeriodChange, isMobile, isDark, onToggleTheme, onMenuOpen, onTabChange }) {
    const section = SECTION_LABELS[activeTab] || "";
    const title = PAGE_TITLES[activeTab] || "Overview";
    const { activeTenant, tenants, switchTenant } = useTenant();

    return (
        <header style={{
            height: 56, borderBottom: "1px solid var(--header-border)",
            padding: isMobile ? "0 16px" : "0 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--header-bg)",
            backdropFilter: "blur(20px) saturate(1.3)", WebkitBackdropFilter: "blur(20px) saturate(1.3)",
            position: "sticky", top: 0, zIndex: 40,
            boxShadow: "var(--header-shadow)",
            transition: "background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {isMobile && (
                    <button onClick={onMenuOpen} style={{ background: "none", border: "none", color: "var(--text-primary)", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center" }}>
                        ≡
                    </button>
                )}
                {/* Breadcrumb & Tenant */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {activeTenant && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "4px 10px", background: "var(--bg-glass)", border: "1px solid var(--border)",
                            borderRadius: 20, marginRight: 8
                        }}>
                            <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Cta:</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)" }}>{activeTenant.name}</span>
                            {activeTenant.role && (
                                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, background: "rgba(14, 165, 233, 0.15)", color: "#0ea5e9", marginLeft: 4, textTransform: "uppercase" }}>
                                    {activeTenant.role}
                                </span>
                            )}
                        </div>
                    )}
                    {section && (
                        <>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{section}</span>
                            <span style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.4 }}>/</span>
                        </>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                        {title}
                    </span>
                </div>
            </div>

            <div className="header-actions-mobile" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Period filter */}
                <div className="period-filter-container" style={{
                    display: "flex", gap: 2, background: "var(--bg-glass)", borderRadius: 12,
                    padding: 3, border: "1px solid var(--border)",
                    maxWidth: isMobile ? 120 : "auto", overflowX: isMobile ? "auto" : "visible", scrollbarWidth: "none"
                }}>
                    {PERIODS.map(p => (
                        <motion.button key={p} onClick={() => onPeriodChange(p)}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                padding: isMobile ? "4px 8px" : "5px 12px", borderRadius: 9, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                                background: period === p ? "var(--gold-gradient)" : "transparent",
                                color: period === p ? "#fff" : "var(--text-muted)",
                                transition: "background 0.2s, color 0.2s",
                                boxShadow: period === p ? "0 2px 10px rgba(14,165,233,0.25)" : "none",
                                whiteSpace: "nowrap"
                            }}>{p}</motion.button>
                    ))}
                </div>

                <GlobalSearch setTab={onTabChange} />

                {/* Theme toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, cursor: "pointer", opacity: isDark ? 0.4 : 1, transform: `scale(${isDark ? 0.85 : 1})`, transition: "opacity 0.3s, transform 0.3s" }} onClick={onToggleTheme}>☀️</span>
                    <motion.button className="theme-toggle" onClick={onToggleTheme} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label="Toggle dark mode" />
                    <span style={{ fontSize: 14, cursor: "pointer", opacity: isDark ? 1 : 0.4, transform: `scale(${isDark ? 1 : 0.85})`, transition: "opacity 0.3s, transform 0.3s" }} onClick={onToggleTheme}>🌙</span>
                </div>
            </div>
        </header>
    );
}
