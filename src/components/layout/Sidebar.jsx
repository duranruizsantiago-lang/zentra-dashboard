import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { I } from "../Shared";

const NAV_SECTIONS = [
    {
        id: "executive",
        label: "Ejecutivo",
        items: [
            { key: "overview", label: "Panel General", icon: I.home },
        ],
    },
    {
        id: "revenue",
        label: "Ingresos",
        items: [
            { key: "marketing", label: "Marketing", icon: I.marketing },
            { key: "customers", label: "Inteligencia de Clientes", icon: I.customers },
        ],
    },
    {
        id: "operations",
        label: "Operaciones",
        items: [
            { key: "alerts", label: "Alertas", icon: I.bell },
        ],
    },
    {
        id: "improvement",
        label: "Mejora Continua",
        items: [
            { key: "recommendations", label: "Recomendaciones AI", icon: I.sparkle },
            { key: "tracker", label: "Plan de Acción", icon: I.check },
        ],
    },
    {
        id: "settings",
        label: "Sistema",
        items: [
            { key: "settings", label: "Configuración", icon: I.settings },
        ],
    },
];

export { NAV_SECTIONS };

export default function Sidebar({ activeTab, onTabChange, collapsed, onToggleCollapse, isDark, onLogout }) {
    const [expandedSections, setExpandedSections] = useState(
        () => new Set(NAV_SECTIONS.map(s => s.id))
    );

    const toggleSection = (id) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const activeSection = NAV_SECTIONS.find(s => s.items.some(i => i.key === activeTab))?.id;

    return (
        <motion.aside
            animate={{ width: collapsed ? 64 : 240 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="sidebar"
            style={{
                borderRight: "1px solid var(--sidebar-border)",
                padding: collapsed ? "24px 8px 16px" : "24px 12px 16px",
                display: "flex", flexDirection: "column",
                background: "var(--sidebar-bg)",
                backdropFilter: "blur(20px) saturate(1.5)", WebkitBackdropFilter: "blur(20px) saturate(1.5)",
                position: "fixed", top: 0, bottom: 0, zIndex: 50,
                boxShadow: "var(--sidebar-shadow)",
                overflow: "hidden",
                transition: "background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease"
            }}
        >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px", marginBottom: 20 }}>
                <div style={{
                    width: 34, height: 34, borderRadius: 12,
                    background: "var(--logo-gradient)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 800, color: "var(--logo-color)", flexShrink: 0,
                    boxShadow: isDark
                        ? "0 3px 12px rgba(56,189,248,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
                        : "0 3px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.05)",
                }}>Z</div>
                {!collapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <div style={{
                            fontWeight: 700, fontSize: 17, fontFamily: "var(--font-display)", letterSpacing: "-0.02em",
                            background: "var(--logo-text-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                        }}>Zentra</div>
                        <span className="badge" style={{ background: "var(--gold-dim)", color: "var(--gold)", fontSize: 8, padding: "1px 5px" }}>CONTROL</span>
                    </motion.div>
                )}
            </div>

            {/* Navigation sections */}
            <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 2, scrollbarWidth: "none" }}>
                {NAV_SECTIONS.map((section) => {
                    const isExpanded = expandedSections.has(section.id);
                    const isSectionActive = activeSection === section.id;

                    return (
                        <div key={section.id} style={{ marginBottom: 2 }}>
                            {/* Section header */}
                            {!collapsed && (
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        width: "100%", padding: "6px 8px 4px", marginTop: 6,
                                        background: "none", border: "none", cursor: "pointer",
                                        fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                                        color: isSectionActive ? "var(--gold)" : "var(--text-muted)",
                                        opacity: isSectionActive ? 1 : 0.6,
                                        transition: "color 0.2s, opacity 0.2s",
                                    }}
                                >
                                    <span>{section.label}</span>
                                    <span style={{
                                        fontSize: 8, transition: "transform 0.2s",
                                        transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)"
                                    }}>▾</span>
                                </button>
                            )}

                            {/* Section items */}
                            <AnimatePresence initial={false}>
                                {(collapsed || isExpanded) && section.items.map((item) => {
                                    const active = activeTab === item.key;
                                    return (
                                        <motion.button
                                            key={item.key}
                                            onClick={() => onTabChange(item.key)}
                                            initial={collapsed ? false : { height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            whileHover={{ x: 2, backgroundColor: active ? "var(--gold-dim)" : isDark ? "rgba(56,189,248,0.06)" : "rgba(14,165,233,0.04)" }}
                                            whileTap={{ scale: 0.97 }}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 10,
                                                padding: collapsed ? "9px 12px" : "7px 10px 7px 16px",
                                                borderRadius: 10,
                                                background: active ? "var(--gold-dim)" : "transparent",
                                                color: active ? "var(--gold)" : "var(--text-muted)",
                                                border: active ? "1px solid var(--border-hover)" : "1px solid transparent",
                                                cursor: "pointer", fontSize: 12,
                                                fontWeight: active ? 600 : 400,
                                                transition: "color 0.2s, background 0.3s, border-color 0.3s",
                                                position: "relative",
                                                justifyContent: collapsed ? "center" : "flex-start",
                                                width: "100%", textAlign: "left",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {active && <motion.div layoutId="activeNav" style={{
                                                position: "absolute", left: collapsed ? -8 : -12, top: 5, bottom: 5, width: 3,
                                                borderRadius: "0 3px 3px 0",
                                                background: isDark ? "linear-gradient(180deg, #38bdf8, #818cf8)" : "linear-gradient(180deg, #0ea5e9, #06b6d4)"
                                            }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                                            <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                                            {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </nav>

            {/* Bottom: Collapse + User */}
            <div style={{ marginTop: 8, borderTop: "1px solid var(--sidebar-border)", paddingTop: 10 }}>
                <motion.button onClick={onToggleCollapse}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    style={{
                        width: "100%", padding: "7px", borderRadius: 10,
                        background: "var(--bg-glass)", border: "1px solid var(--sidebar-border)",
                        color: "var(--text-muted)", cursor: "pointer", fontSize: 11,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                >
                    {collapsed ? "→" : "← Collapse"}
                </motion.button>

                {!collapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: "50%",
                                background: "var(--gold-dim)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, fontWeight: 700, color: "var(--gold)"
                            }}>L</div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Luna Bisutería</div>
                                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Plan Pro</div>
                            </div>
                        </div>
                        <button onClick={onLogout} className="btn-ghost" style={{ width: "100%", fontSize: 11, padding: "6px 0", textAlign: "center" }}>
                            Cerrar Sesión
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.aside>
    );
}
