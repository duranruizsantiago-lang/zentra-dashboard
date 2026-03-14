import { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts, getCustomerList } from '../services/dataService';
import { TenantContext } from '../context/TenantContext';
import { I } from './Shared';

export default function GlobalSearch({ setTab }) {
    const { activeTenant } = useContext(TenantContext);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [products, setProducts] = useState([]);
    const [clients, setClients] = useState([]);
    const containerRef = useRef(null);

    // Fetch data asynchronously on mount/tenant change
    useEffect(() => {
        if (!activeTenant) return;
        async function load() {
            try {
                const [prods, cli] = await Promise.all([
                    getProducts(activeTenant.id),
                    Promise.resolve(getCustomerList(activeTenant.id))
                ]);
                setProducts(prods || []);
                setClients(cli || []);
            } catch (err) {
                console.error("Error loading search data:", err);
            }
        }
        load();
    }, [activeTenant]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [containerRef]);

    const handleNavigation = (tabName) => {
        setTab(tabName);
        setIsOpen(false);
        setQuery("");
    };

    const q = query.toLowerCase();

    // Static Routes
    const availableDocs = [
        { id: 'overview', title: 'Resumen', type: 'Página', icon: I.home },
        { id: 'ventas', title: 'Ventas', type: 'Página', icon: I.sales },
        { id: 'productos', title: 'Productos', type: 'Página', icon: I.products },
        { id: 'clientes', title: 'Clientes', type: 'Página', icon: I.customers },
        { id: 'whatsapp', title: 'WhatsApp', type: 'Mensajería', icon: I.whatsapp },
        { id: 'marketing', title: 'Marketing', type: 'Crecimiento', icon: I.marketing }
    ];

    const resultsPages = q ? availableDocs.filter(d => d.title.toLowerCase().includes(q)) : [];
    const resultsProducts = q ? products.filter(p => p.title.toLowerCase().includes(q)).slice(0, 3) : [];
    const resultsClients = q ? clients.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).slice(0, 2) : [];

    const totalResults = resultsPages.length + resultsProducts.length + resultsClients.length;

    return (
        <div ref={containerRef} style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>{I.search}</span>
            <input
                placeholder="Buscar..."
                className="input-glass"
                style={{ paddingLeft: 32, width: 220, height: 32, fontSize: 13, transition: "width 0.3s ease" }}
                value={query}
                onChange={e => {
                    setQuery(e.target.value);
                    if (!isOpen) setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
            />

            <AnimatePresence>
                {isOpen && query && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.15 }}
                        className="glass-card"
                        style={{
                            position: "absolute",
                            top: "calc(100% + 8px)",
                            right: 0, // Align right so it doesn't overflow left if width is too big
                            width: 380,
                            maxHeight: 400,
                            overflowY: "auto",
                            borderRadius: 16,
                            padding: "12px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                            border: "1px solid var(--border)",
                            zIndex: 100,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12
                        }}
                    >
                        {totalResults === 0 && (
                            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                                No se encontraron resultados para "{query}"
                            </div>
                        )}

                        {resultsPages.length > 0 && (
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, paddingLeft: 8 }}>Páginas</div>
                                {resultsPages.map((p, i) => (
                                    <button key={i} onClick={() => handleNavigation(p.id)} className="table-row-hover" style={{
                                        width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, border: "none",
                                        background: "transparent", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13
                                    }}>
                                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--gold-dim)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center" }}>{p.icon}</div>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{p.title}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {resultsProducts.length > 0 && (
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, paddingLeft: 8 }}>Productos</div>
                                {resultsProducts.map((p, i) => (
                                    <button key={i} onClick={() => handleNavigation('productos')} className="table-row-hover" style={{
                                        width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, border: "none",
                                        background: "transparent", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13
                                    }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-glass)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                            {p.img ? <img src={p.img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 14 }}>💍</span>}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                                            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Stock: {p.stock}</div>
                                        </div>
                                        <span style={{ fontWeight: 600, color: "var(--gold)", fontSize: 12 }}>{p.price}€</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {resultsClients.length > 0 && (
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, paddingLeft: 8 }}>Clientes</div>
                                {resultsClients.map((c, i) => (
                                    <button key={i} onClick={() => handleNavigation('clientes')} className="table-row-hover" style={{
                                        width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: 8, border: "none",
                                        background: "transparent", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13
                                    }}>
                                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))", color: "#60a5fa", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 10 }}>{c.name[0]}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                                            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{c.email}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
