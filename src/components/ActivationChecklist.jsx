import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTenantIntegrations } from '../services/integrationsService';
import { getTenantSetting, saveTenantSetting } from '../services/dataService';
import { TenantContext } from '../context/TenantContext';
import { logPilotEvent } from '../services/analyticsService';

export default function ActivationChecklist({ onNavigate }) {
    const { activeTenant } = useContext(TenantContext);
    const [integrations, setIntegrations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);

    const [hasExplored, setHasExplored] = useState(false);

    useEffect(() => {
        if (!activeTenant) return;

        async function fetchState() {
            try {
                // Fetch user preferences and checklist status
                const dismissed = await getTenantSetting(activeTenant.id, 'checklist_dismissed');
                if (dismissed === true) {
                    setIsDismissed(true);
                    return; // No need to load integrations if dismissed
                }

                const explored = await getTenantSetting(activeTenant.id, 'explored_insights');
                if (explored === true) setHasExplored(true);

                const ints = await getTenantIntegrations(activeTenant.id);
                setIntegrations(ints);
            } catch (err) {
                console.error("Error fetching integrations for checklist:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchState();
    }, [activeTenant]);

    if (!activeTenant || isDismissed) return null;

    const isShopifyConnected = integrations.some(i => i.id === 'shopify' && i.status === 'conectado');
    const isMarketingConnected = integrations.some(i => (i.id === 'meta' || i.id === 'ga4') && i.status === 'conectado');

    const steps = [
        {
            id: 'shopify',
            label: 'Conecta tu Plataforma E-commerce',
            desc: 'Zentra descargará tu histórico para detectar fugas de margen.',
            done: isShopifyConnected,
            action: () => onNavigate('settings'),
            actionLabel: 'Sincronizar Tienda'
        },
        {
            id: 'marketing',
            label: 'Conecta tus Canales de Adquisición',
            desc: 'Descubre el ROAS unificado conectando Meta Ads o Google Analytics.',
            done: isMarketingConnected,
            action: () => onNavigate('settings'),
            actionLabel: 'Sincronizar Marketing'
        },
        {
            id: 'explore',
            label: 'Revisa las Recomendaciones de la IA',
            desc: 'Descubre las primeras 3 acciones que mejorarán tu rentabilidad hoy.',
            done: hasExplored,
            action: async () => {
                setHasExplored(true);
                await saveTenantSetting(activeTenant.id, 'explored_insights', true);
                logPilotEvent('onboarding_explored_insights', { tenant_id: activeTenant.id });
                onNavigate('recommendations');
            },
            actionLabel: 'Ver Recomendaciones'
        }
    ];

    const completedCount = steps.filter(s => s.done).length;
    const progress = (completedCount / steps.length) * 100;
    const isAllDone = completedCount === steps.length;

    const handleDismiss = async () => {
        logPilotEvent('onboarding_checklist_dismissed', { tenant_id: activeTenant.id, progress_percent: progress });
        setIsDismissed(true);
        await saveTenantSetting(activeTenant.id, 'checklist_dismissed', true);
    };

    if (isLoading) {
        return (
            <div className="glass-card" style={{ padding: "20px 24px", marginBottom: 24, display: "flex", gap: 20 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ width: "40%", height: 20, background: "rgba(14,165,233,0.1)", borderRadius: 4, marginBottom: 12 }}></div>
                    <div style={{ width: "100%", height: 8, background: "rgba(14,165,233,0.05)", borderRadius: 4 }}></div>
                </div>
            </div>
        );
    }

    return (
        <AnimatePresence>
            {!isDismissed && (
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, height: 0, overflow: "hidden", marginTop: 0, marginBottom: 0 }}
                    className="glass-card"
                    style={{
                        padding: "24px",
                        marginBottom: 24,
                        border: isAllDone ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(14, 165, 233, 0.3)",
                        background: isAllDone ? "linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%)" : "var(--bg-surface)",
                        position: "relative"
                    }}
                >
                    <button
                        onClick={handleDismiss}
                        style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
                        title="Ocultar checklist"
                    >
                        ×
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            background: isAllDone ? "rgba(16, 185, 129, 0.1)" : "var(--logo-gradient)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22, color: isAllDone ? "#10b981" : "#fff",
                            boxShadow: isAllDone ? "none" : "0 8px 16px rgba(14, 165, 233, 0.25)"
                        }}>
                            {isAllDone ? "🎉" : "🚀"}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>
                                {isAllDone ? "Activación Completada" : "Inicia tu despliegue en Zentra"}
                            </h3>
                            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                {isAllDone
                                    ? "Has conectado tus fuentes principales. Zentra está auditando tu negocio en segundo plano."
                                    : "Completa estos pasos para que el motor de Zentra empiece a cruzar ventas, tráfico y rentabilidad."}
                            </p>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 100 }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: isAllDone ? "#10b981" : "#0ea5e9", fontFamily: "var(--font-display)" }}>
                                {progress.toFixed(0)}%
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Completado</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: "100%", height: 6, background: "var(--bg-primary)", borderRadius: 3, marginBottom: 24, overflow: "hidden", border: "1px solid var(--border)" }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%`, background: isAllDone ? "#10b981" : "#0ea5e9" }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{ height: "100%", borderRadius: 3 }}
                        />
                    </div>

                    {/* Steps Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                        {steps.map((step, idx) => (
                            <div key={step.id} style={{
                                padding: 16, borderRadius: 12,
                                background: step.done ? "rgba(16, 185, 129, 0.04)" : "var(--bg-primary)",
                                border: step.done ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid var(--border)",
                                opacity: (!step.done && idx > 0 && !steps[idx - 1].done) ? 0.6 : 1, // Slight dimming if previous isn't done
                                transition: "all 0.2s ease"
                            }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                    <div style={{
                                        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                                        background: step.done ? "#10b981" : "transparent",
                                        color: step.done ? "#fff" : "var(--text-muted)",
                                        border: step.done ? "none" : "2px solid var(--text-muted)",
                                    }}>
                                        {step.done ? "✓" : idx + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: step.done ? "var(--text-primary)" : "var(--text-primary)", marginBottom: 4 }}>
                                            {step.label}
                                        </div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.4 }}>
                                            {step.desc}
                                        </div>
                                        {!step.done && (
                                            <button
                                                onClick={step.action}
                                                className="btn-gold"
                                                style={{
                                                    padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 8,
                                                    background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)",
                                                    cursor: "pointer", transition: "all 0.2s"
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.color = "#0ea5e9"; }}
                                                onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                                            >
                                                {step.actionLabel}
                                            </button>
                                        )}
                                        {step.done && (
                                            <div style={{ fontSize: 12, fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                                                Completado
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
