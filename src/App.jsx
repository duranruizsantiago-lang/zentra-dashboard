import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar, { NAV_SECTIONS } from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import AuthGuard from "./components/AuthGuard";
import { useAuth } from "./context/AuthContext";
import { trackPageView } from "./services/analyticsService";

// Lazy-load Pilot approved pages
const Overview = lazy(() => import("./pages/Overview"));
const Marketing = lazy(() => import("./pages/Marketing"));
const Clientes = lazy(() => import("./pages/CustomerIntelligence"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const ActionTracker = lazy(() => import("./pages/ActionTracker"));
const Settings = lazy(() => import("./pages/Settings"));

// ── Error Boundary ──
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("CRITICAL UI ERROR:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", color: "var(--text-primary)", padding: 20 }}>
          <div className="glass-card" style={{ padding: 40, maxWidth: 600, width: "100%" }}>
            <h2 style={{ marginBottom: 16, color: "#ef4444" }}>⚠️ Recuperación del Sistema</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Ha ocurrido un error inesperado en la interfaz.</p>
            {/* Sensitive stack traces swallowed for production safety */}
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: 8, padding: 16, marginBottom: 20, fontSize: 13, color: "#fca5a5" }}>
              Se ha registrado este incidente. Por favor, reinicia la interfaz o contacta con soporte si el problema persiste.
            </div>
            <button className="btn-gold" onClick={() => window.location.reload()}>Reiniciar Interfaz</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Route Map ──
const ROUTE_MAP = {
  overview: (nav) => <Overview onNavigate={nav} />,
  marketing: () => <Marketing />,
  customers: () => <Clientes />,
  alerts: (nav) => <Alerts onNavigate={nav} />,
  recommendations: (nav) => <Recommendations onNavigate={nav} />,
  tracker: () => <ActionTracker />,
  settings: (nav) => <Settings onNavigate={nav} />,
};

export default function App() {
  const { logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [period, setPeriod] = useState("7d");
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("zentra-theme") || "light"; } catch { return "light"; }
  });

  const sideW = isMobile ? 0 : (collapsed ? 64 : 240);
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("zentra-theme", theme); } catch (e) { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");

  useEffect(() => {
    trackPageView(tab);
  }, [tab]);

  const navigate = useCallback((dest) => {
    const map = { stock: "inventory", campaign: "marketing", whatsapp: "integrations", productos: "products" };
    setTab(map[dest] || dest);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const currentPage = useMemo(() => {
    const renderer = ROUTE_MAP[tab];
    return renderer ? renderer(navigate) : <Overview onNavigate={navigate} />;
  }, [tab, navigate]);

  return (
    <ErrorBoundary>
      <AuthGuard>
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", position: "relative", zIndex: 1 }}>

          {/* Sidebar — Desktop */}
          {!isMobile && (
            <Sidebar
              activeTab={tab}
              onTabChange={setTab}
              collapsed={collapsed}
              onToggleCollapse={() => setCollapsed(c => !c)}
              isDark={isDark}
              onLogout={handleLogout}
            />
          )}

          {/* Main content */}
          <div style={{ marginLeft: sideW, flex: 1, transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
            <Header
              activeTab={tab}
              period={period}
              onPeriodChange={setPeriod}
              isMobile={isMobile}
              isDark={isDark}
              onToggleTheme={toggleTheme}
              onMenuOpen={() => setDrawerOpen(true)}
              onTabChange={setTab}
            />

            <main style={{ flex: 1, padding: isMobile ? "20px 16px" : "32px 40px", overflowX: "hidden" }}>
              <Suspense fallback={<div className="dot-pulse" style={{ margin: "20% auto" }} />}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    {currentPage}
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </main>
          </div>

          {/* Mobile Drawer */}
          <AnimatePresence>
            {isMobile && drawerOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setDrawerOpen(false)}
                  style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, backdropFilter: "blur(4px)" }}
                />
                <motion.div
                  initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{
                    position: "fixed", top: 0, bottom: 0, left: 0, width: "85%", maxWidth: 320,
                    background: "var(--sidebar-bg)", zIndex: 101, borderRight: "1px solid var(--sidebar-border)",
                    display: "flex", flexDirection: "column", padding: "20px 14px", overflowY: "auto"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 18, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>Zentra Control</div>
                    <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", fontSize: 24, color: "var(--text-muted)", cursor: "pointer" }}>×</button>
                  </div>

                  {NAV_SECTIONS.map(section => (
                    <div key={section.id} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", padding: "6px 14px 4px", opacity: 0.6 }}>
                        {section.label}
                      </div>
                      {section.items.map(item => {
                        const active = tab === item.key;
                        return (
                          <button key={item.key} onClick={() => { setTab(item.key); setDrawerOpen(false); }}
                            style={{
                              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", width: "100%",
                              borderRadius: 10, background: active ? "var(--gold-dim)" : "transparent",
                              color: active ? "var(--gold)" : "var(--text-primary)",
                              border: "none", fontSize: 14, fontWeight: active ? 600 : 500,
                              textAlign: "left", cursor: "pointer",
                            }}
                          >
                            <span style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}

                  <div style={{ flex: 1 }} />
                  <button onClick={() => { handleLogout(); setDrawerOpen(false); }} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12,
                    background: "rgba(239, 68, 68, 0.1)", color: "#ef4444",
                    border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: 15, fontWeight: 600,
                    textAlign: "left", cursor: "pointer", marginTop: 20, width: "100%"
                  }}>Cerrar Sesión</button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </AuthGuard>
    </ErrorBoundary>
  );
}
