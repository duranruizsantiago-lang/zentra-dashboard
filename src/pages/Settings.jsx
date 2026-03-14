import { useState, useContext, useEffect } from "react";
import { I, Skeleton, ErrorState } from "../components/Shared";
import { TenantContext } from "../context/TenantContext";
import { useAuth } from "../context/AuthContext";
import { logPilotEvent } from "../services/analyticsService";
import { getTenantIntegrations, saveIntegration, disconnectIntegration } from "../services/integrationsService";

const ALL_INTEGRATIONS = [
    { id: "shopify", name: "Shopify", color: "#10b981", icon: "🛍️", desc: "Sincronización de pedidos y productos" },
    { id: "meta", name: "Meta Ads", color: "#0ea5e9", icon: "📣", desc: "Campañas de publicidad" },
    { id: "ga4", name: "Google Analytics 4", color: "#f59e0b", icon: "📊", desc: "Tráfico y conversiones web" },
    { id: "whatsapp", name: "WhatsApp Business", color: "#10b981", icon: "💬", desc: "Mensajería automatizada" },
    { id: "tiktok", name: "TikTok Ads", color: "#f43f5e", icon: "🎵", desc: "Campañas TikTok" },
    { id: "stripe", name: "Stripe", color: "#6366f1", icon: "💳", desc: "Pasarela de pago" },
];

const objectives = [
    { label: "Ventas mensuales", target: "15.000€", current: "12.400€", pct: 83 },
    { label: "Margen neto", target: "65%", current: "61.8%", pct: 95 },
    { label: "ROAS mínimo", target: "3.0x", current: "3.05x", pct: 100 },
    { label: "Satisfacción cliente", target: "4.5/5", current: "4.7/5", pct: 100 },
];

const team = [
    { name: "Laura Martínez", role: "Admin", email: "laura@luna.es", status: "activo" },
    { name: "Carlos Ruiz", role: "Marketing", email: "carlos@luna.es", status: "activo" },
    { name: "Ana Torres", role: "Soporte", email: "ana@luna.es", status: "activo" },
];

const settingsTabs = ["Integraciones", "Objetivos", "Equipo", "Seguridad"];

export default function Settings({ onNavigate }) {
    const { activeTenant } = useContext(TenantContext);
    const { updatePassword } = useAuth();
    const [activeTab, setActiveTab] = useState("Integraciones");

    // Integrations State
    const [integrationsList, setIntegrationsList] = useState(ALL_INTEGRATIONS.map(i => ({ ...i, status: 'desconectado' })));
    const [isLoadingInts, setIsLoadingInts] = useState(true);
    const [connectingId, setConnectingId] = useState(null);
    const [syncModal, setSyncModal] = useState({ open: false, intId: null, step: 0, logs: [] });

    // Sync Wizard Steps
    const WIZARD_STEPS = [
        "Estableciendo canal seguro...",
        "Autenticando con plataforma...",
        "Mapeando catálogo y transacciones...",
        "Calculando cohortes históricas...",
        "Sincronización completada."
    ];

    useEffect(() => {
        if (!activeTenant) return;
        async function fetchInts() {
            setIsLoadingInts(true);
            const saved = await getTenantIntegrations(activeTenant.id);
            setIntegrationsList(prev => prev.map(int => {
                const found = saved.find(s => s.provider === int.id);
                return found ? { ...int, status: found.status } : int;
            }));
            setIsLoadingInts(false);
        }
        fetchInts();
    }, [activeTenant]);

    const [shopifyModal, setShopifyModal] = useState({ open: false, storeUrl: "", accessToken: "" });
    const [metaModal, setMetaModal] = useState({ open: false, adAccountId: "", accessToken: "" });
    const [ga4Modal, setGa4Modal] = useState({ open: false, propertyId: "", credentialsJson: "" });
    const [syncError, setSyncError] = useState(null);

    const handleConnect = async (intId) => {
        if (!activeTenant) return;
        if (intId !== 'shopify' && intId !== 'meta' && intId !== 'ga4') {
            setSyncError("Esta integración no está habilitada en la fase actual. Usa Shopify, Meta o GA4.");
            return;
        }

        if (intId === 'shopify') {
            setShopifyModal({ open: true, storeUrl: "", accessToken: "" });
            return;
        }
        if (intId === 'meta') {
            setMetaModal({ open: true, adAccountId: "", accessToken: "" });
            return;
        }
        if (intId === 'ga4') {
            setGa4Modal({ open: true, propertyId: "", credentialsJson: "" });
            return;
        }
    };

    // Shared sync execution logic
    const executeSyncFlow = async (intId, credentials) => {
        setSyncError(null);
        const intInfo = ALL_INTEGRATIONS.find(i => i.id === intId);
        setSyncModal({ open: true, intId, step: 0, logs: [`Iniciando conexión con ${intInfo.name}`] });

        for (let i = 0; i < WIZARD_STEPS.length - 1; i++) {
            await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
            setSyncModal(prev => ({
                ...prev,
                step: i + 1,
                logs: [...prev.logs, WIZARD_STEPS[i]]
            }));
        }

        const res = await saveIntegration(activeTenant.id, intId, credentials);

        if (res.success) {
            setSyncModal(prev => ({ ...prev, step: WIZARD_STEPS.length, logs: [...prev.logs, WIZARD_STEPS[WIZARD_STEPS.length - 1]] }));
            logPilotEvent('integration_connected', { tenant_id: activeTenant.id, integration_id: intId });
            setIntegrationsList(prev => prev.map(int => int.id === intId ? { ...int, status: res.phase === 'edge_function' ? 'pending' : 'active' } : int));

            if (res.error) {
                // Soft warning (e.g. Edge Function not deployed)
                setSyncModal(prev => ({ ...prev, logs: [...prev.logs, `⚠️ ${res.error}`] }));
                await new Promise(r => setTimeout(r, 2500));
            }
        } else {
            const errorMsg = res.phase === 'credential_validation'
                ? `❌ Configuración inválida: ${res.error}`
                : res.phase === 'persistence'
                ? `❌ Error de persistencia: ${res.error}`
                : `❌ ${res.error}`;
            setSyncModal(prev => ({ ...prev, logs: [...prev.logs, errorMsg] }));
            setSyncError(res.error);
            await new Promise(r => setTimeout(r, 2500));
        }

        await new Promise(r => setTimeout(r, 1000));
        setSyncModal({ open: false, intId: null, step: 0, logs: [] });
    };

    const handleMetaSubmit = async (e) => {
        e.preventDefault();
        const { adAccountId, accessToken } = metaModal;
        if (!adAccountId || !accessToken) return;
        setMetaModal({ open: false, adAccountId: "", accessToken: "" });
        await executeSyncFlow('meta', { ad_account_id: adAccountId, access_token: accessToken });
    };

    const handleGA4Submit = async (e) => {
        e.preventDefault();
        const { propertyId, credentialsJson } = ga4Modal;
        if (!propertyId || !credentialsJson) return;
        setGa4Modal({ open: false, propertyId: "", credentialsJson: "" });
        await executeSyncFlow('ga4', { property_id: propertyId, credentials_json: credentialsJson });
    };

    const handleShopifySubmit = async (e) => {
        e.preventDefault();
        const { storeUrl, accessToken } = shopifyModal;
        if (!storeUrl || !accessToken) return;
        setShopifyModal({ open: false, storeUrl: "", accessToken: "" });
        await executeSyncFlow('shopify', { store_domain: storeUrl, access_token: accessToken });
        if (onNavigate) onNavigate("overview");
    };

    const handleDisconnect = async (intId) => {
        if (!activeTenant) return;
        if (window.confirm(`¿Seguro que deseas desconectar ${intId}? Se detendrá la sincronización.`)) {
            setConnectingId(intId);
            const ok = await disconnectIntegration(activeTenant.id, intId);
            if (ok) {
                logPilotEvent('integration_disconnected', { tenant_id: activeTenant.id, integration_id: intId });
                setIntegrationsList(prev => prev.map(int => int.id === intId ? { ...int, status: 'desconectado' } : int));
            }
            setConnectingId(null);
        }
    };

    // Security tab states
    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [passError, setPassError] = useState("");
    const [passSuccess, setPassSuccess] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPassError("");
        setPassSuccess(false);

        if (newPass.length < 6) {
            setPassError("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (newPass !== confirmPass) {
            setPassError("Las nuevas contraseñas no coinciden.");
            return;
        }

        // Apply new password via Supabase Auth
        const result = await updatePassword(newPass);
        if (result.success) {
            setPassSuccess(true);
            setCurrentPass("");
            setNewPass("");
            setConfirmPass("");
            setTimeout(() => setPassSuccess(false), 3000);
        } else {
            setPassError("Error al actualizar la contraseña: " + result.error);
        }
    };

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 4 }}>Configuración</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Gestión de integraciones, objetivos y equipo · <strong style={{ color: "#0ea5e9" }}>{activeTenant?.name || "Cargando..."}</strong> — Plan Pro</p>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg-glass)", borderRadius: 12, padding: 3, width: "fit-content", border: "1px solid var(--border)" }}>
                {settingsTabs.map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                        style={{
                            padding: "8px 20px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                            background: activeTab === t ? "linear-gradient(135deg, #0ea5e9, #06b6d4)" : "transparent",
                            color: activeTab === t ? "#fff" : "var(--text-muted)",
                            transition: "background 0.2s, box-shadow 0.2s, color 0.2s",
                            boxShadow: activeTab === t ? "0 2px 10px rgba(14,165,233,0.2)" : "none"
                        }}>{t}</button>
                ))}
            </div>

            {activeTab === "Integraciones" && (
                isLoadingInts ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        {[1, 2, 3].map(i => <Skeleton key={i} height={120} borderRadius={16} />)}
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        {integrationsList.map((int, i) => {
                            const isConnected = int.status === "active";
                            const isPending = int.status === "pending" || int.status === "syncing";
                            const isError = int.status === "error";
                            const isConnecting = connectingId === int.id;
                            const statusLabel = isConnected ? 'Conectado' : isPending ? 'Pendiente' : isError ? 'Error' : 'Desconectado';
                            const statusColor = isConnected ? int.color : isPending ? '#f59e0b' : isError ? '#ef4444' : 'var(--text-muted)';
                            return (
                                <div key={i} className="glass-card fade-in-up" style={{ padding: "18px 20px", animationDelay: `${i * 60}ms`, border: (isConnected || isPending) ? `1px solid ${statusColor}40` : undefined }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                        <span style={{ fontSize: 24 }}>{int.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{int.name}</div>
                                            <span className="badge" style={{ background: (isConnected || isPending) ? `${statusColor}12` : isError ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)', color: statusColor, fontSize: 9 }}>
                                                ● {statusLabel}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>{int.desc}</div>
                                    <button
                                        className={(isConnected || isPending) ? "btn-ghost" : "btn-gold"}
                                        style={{ fontSize: 12, padding: "8px 12px", fontWeight: 600, width: "100%", opacity: isConnecting ? 0.6 : 1, background: (isConnected || isPending) ? 'rgba(239, 68, 68, 0.1)' : isError ? 'rgba(245, 158, 11, 0.1)' : undefined, color: (isConnected || isPending) ? '#ef4444' : isError ? '#f59e0b' : undefined, borderRadius: 8 }}
                                        onClick={() => (isConnected || isPending) ? handleDisconnect(int.id) : handleConnect(int.id)}
                                        disabled={isConnecting}
                                    >
                                        {isConnecting ? "Sincronizando..." : (isConnected || isPending) ? "Desconectar" : isError ? "Reconectar" : "Conectar"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {activeTab === "Objetivos" && (
                <div className="glass-card fade-in-up" style={{ padding: 22 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Objetivos del negocio</div>
                    {objectives.map((obj, i) => (
                        <div key={i} style={{ marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 500 }}>{obj.label}</span>
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{obj.current} / {obj.target}</span>
                            </div>
                            <div style={{ height: 6, background: "rgba(14,165,233,0.06)", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{
                                    width: `${Math.min(obj.pct, 100)}%`, height: "100%", borderRadius: 3,
                                    background: obj.pct >= 100 ? "linear-gradient(90deg, #10b981, #34d399)" : obj.pct >= 80 ? "linear-gradient(90deg, #0ea5e9, #06b6d4)" : "linear-gradient(90deg, #f59e0b, #eab308)",
                                    transition: "width 0.6s"
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === "Equipo" && (
                <div className="glass-card fade-in-up" style={{ padding: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>Miembros del equipo</span>
                        <button className="btn-gold" style={{ fontSize: 11, padding: "6px 14px" }}>+ Invitar</button>
                    </div>
                    {team.map((t, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < team.length - 1 ? "1px solid rgba(14,165,233,0.06)" : "none" }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(14,165,233,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#0ea5e9" }}>{t.name[0]}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.email}</div>
                            </div>
                            <span className="badge" style={{ background: "rgba(14,165,233,0.08)", color: "#0ea5e9" }}>{t.role}</span>
                            <button className="btn-ghost" style={{ fontSize: 10, padding: "4px 10px" }}>Editar</button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === "Seguridad" && (
                <div className="glass-card fade-in-up" style={{ padding: 24, maxWidth: 500 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                        <div style={{ background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9", padding: 8, borderRadius: 8, display: "flex" }}>
                            {I.key}
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600 }}>Cambiar Contraseña Maestra</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>La credencial por defecto es admin2026</div>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Contraseña Actual</label>
                            <input
                                type="password" value={currentPass} onChange={(e) => { setCurrentPass(e.target.value); setPassError(""); }}
                                style={{
                                    width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--bg-surface)",
                                    border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none"
                                }}
                            />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Nueva Contraseña</label>
                                <input
                                    type="password" value={newPass} onChange={(e) => { setNewPass(e.target.value); setPassError(""); }}
                                    style={{
                                        width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--bg-surface)",
                                        border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none"
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Confirmar Nueva</label>
                                <input
                                    type="password" value={confirmPass} onChange={(e) => { setConfirmPass(e.target.value); setPassError(""); }}
                                    style={{
                                        width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--bg-surface)",
                                        border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none"
                                    }}
                                />
                            </div>
                        </div>

                        {passError && <div style={{ color: "var(--red)", fontSize: 12, fontWeight: 500, padding: "8px 12px", background: "var(--red-dim)", borderRadius: 8 }}>{passError}</div>}
                        {passSuccess && <div style={{ color: "var(--green)", fontSize: 12, fontWeight: 500, padding: "8px 12px", background: "var(--green-dim)", borderRadius: 8 }}>Contraseña actualizada correctamente.</div>}

                        <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                            <button
                                type="submit"
                                disabled={!currentPass || !newPass || !confirmPass}
                                className="btn-gold" style={{ padding: "8px 16px", fontSize: 12, opacity: (!currentPass || !newPass || !confirmPass) ? 0.5 : 1 }}
                            >
                                Actualizar Credenciales
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {syncModal.open && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div className="glass-card" style={{ width: 440, padding: "32px 40px", textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ fontSize: 40, animation: "spin 2s linear infinite", width: 40, height: 40, margin: "0 auto", borderRadius: "50%", borderTop: `3px solid ${syncError ? '#ef4444' : '#0ea5e9'}`, borderRight: "3px solid transparent", borderBottom: "3px solid transparent", borderLeft: "3px solid transparent" }} />
                        <h3 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)" }}>{syncError ? 'Error en Sincronización' : 'Sincronizando Origen'}</h3>

                        {/* Progress Bar */}
                        <div style={{ width: "100%", height: 6, background: "var(--bg-primary)", borderRadius: 3, overflow: "hidden", border: "1px solid var(--border)" }}>
                            <div style={{ width: `${(syncModal.step / WIZARD_STEPS.length) * 100}%`, height: "100%", background: syncError ? '#ef4444' : '#0ea5e9', transition: "width 0.4s ease-out" }} />
                        </div>

                        <div style={{ fontSize: 13, color: "var(--text-muted)", minHeight: 60, display: "flex", flexDirection: "column", gap: 6, alignItems: "center", justifyContent: "center" }}>
                            {syncModal.logs.slice(-3).map((log, idx) => (
                                <div key={idx} style={{ opacity: idx === syncModal.logs.slice(-3).length - 1 ? 1 : 0.5, color: log.startsWith('❌') ? '#ef4444' : log.startsWith('⚠️') ? '#f59e0b' : undefined }}>{log}</div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Meta Ads Connection Modal */}
            {metaModal.open && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div className="glass-card" style={{ width: 440, padding: 32, textAlign: "left", display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)" }}>Conectar Meta Ads</h3>
                            <button className="btn-ghost" style={{ padding: 4 }} onClick={() => setMetaModal({ open: false, adAccountId: "", accessToken: "" })}>✕</button>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                            Introduce el ID de cuenta publicitaria y el Token de Acceso de tu aplicación de Meta Business.
                            Puedes obtenerlos desde <strong>Meta Business Suite → Configuración → API</strong>.
                        </p>
                        <form onSubmit={handleMetaSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Ad Account ID</label>
                                <input
                                    type="text"
                                    placeholder="act_123456789"
                                    value={metaModal.adAccountId}
                                    onChange={(e) => setMetaModal({ ...metaModal, adAccountId: e.target.value })}
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Access Token (Meta API)</label>
                                <input
                                    type="password"
                                    placeholder="EAABsbCS..."
                                    value={metaModal.accessToken}
                                    onChange={(e) => setMetaModal({ ...metaModal, accessToken: e.target.value })}
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                                    required
                                />
                            </div>
                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
                                <button type="button" className="btn-ghost" onClick={() => setMetaModal({ open: false, adAccountId: "", accessToken: "" })}>Cancelar</button>
                                <button type="submit" className="btn-gold">Iniciar Sincronización</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* GA4 Connection Modal */}
            {ga4Modal.open && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div className="glass-card" style={{ width: 440, padding: 32, textAlign: "left", display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)" }}>Conectar Google Analytics 4</h3>
                            <button className="btn-ghost" style={{ padding: 4 }} onClick={() => setGa4Modal({ open: false, propertyId: "", credentialsJson: "" })}>✕</button>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                            Introduce el ID de propiedad GA4 y las Credenciales de Servicio (JSON) de la cuenta de Google Cloud vinculada.
                        </p>
                        <form onSubmit={handleGA4Submit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Property ID</label>
                                <input
                                    type="text"
                                    placeholder="123456789"
                                    value={ga4Modal.propertyId}
                                    onChange={(e) => setGa4Modal({ ...ga4Modal, propertyId: e.target.value })}
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Credenciales JSON (Service Account)</label>
                                <textarea
                                    placeholder='{"type": "service_account", ...}'
                                    value={ga4Modal.credentialsJson}
                                    onChange={(e) => setGa4Modal({ ...ga4Modal, credentialsJson: e.target.value })}
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none", minHeight: 80, resize: "vertical", fontFamily: "monospace" }}
                                    required
                                />
                            </div>
                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
                                <button type="button" className="btn-ghost" onClick={() => setGa4Modal({ open: false, propertyId: "", credentialsJson: "" })}>Cancelar</button>
                                <button type="submit" className="btn-gold">Iniciar Sincronización</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {shopifyModal.open && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div className="glass-card" style={{ width: 440, padding: 32, textAlign: "left", display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)" }}>Conectar Shopify</h3>
                            <button className="btn-ghost" style={{ padding: 4 }} onClick={() => setShopifyModal({ open: false, storeUrl: "", accessToken: "" })}>✕</button>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                            Para conectar de forma segura, introduce el dominio de tu tienda Shopify y el Token de Acceso de "Aplicación Privada/Personalizada".
                        </p>
                        <form onSubmit={handleShopifySubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Store Domain</label>
                                <input
                                    type="text"
                                    placeholder="tienda.myshopify.com"
                                    value={shopifyModal.storeUrl}
                                    onChange={(e) => setShopifyModal({ ...shopifyModal, storeUrl: e.target.value })}
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Access Token (Admin API)</label>
                                <input
                                    type="password"
                                    placeholder="shpat_..."
                                    value={shopifyModal.accessToken}
                                    onChange={(e) => setShopifyModal({ ...shopifyModal, accessToken: e.target.value })}
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
                                    required
                                />
                            </div>
                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
                                <button type="button" className="btn-ghost" onClick={() => setShopifyModal({ open: false, storeUrl: "", accessToken: "" })}>Cancelar</button>
                                <button type="submit" className="btn-gold">Iniciar Sincronización</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
