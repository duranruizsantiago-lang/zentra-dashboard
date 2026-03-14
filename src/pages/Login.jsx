import { useState } from "react";
import { motion } from "framer-motion";
import { I } from "../components/Shared";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Use secure auth context
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        const success = await login(email, password);

        if (!success) {
            setIsLoading(false);
            setErrorMsg("Credenciales incorrectas. Verifica tu email y contraseña.");
        }
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--bg-primary)", position: "relative", overflow: "hidden"
        }}>
            {/* Background blobs are handled by index.css body::before/after */}

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card"
                style={{
                    width: "100%", maxWidth: 420, padding: "48px 40px", zIndex: 10, position: "relative",
                    background: "rgba(255, 255, 255, 0.45)",
                    border: "1px solid rgba(255, 255, 255, 0.6)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.5)"
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
                    <div className="welcome-badge">
                        {I.sparkle} Bienvenido al Ecosistema Zentra
                    </div>

                    <motion.div
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
                        style={{
                            width: 64, height: 64, borderRadius: 18, marginBottom: 20,
                            background: "var(--logo-gradient)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 32, fontWeight: 800, color: "var(--logo-color)",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.4)",
                            animation: "iconBob 4s ease-in-out infinite"
                        }}>Z</motion.div>

                    <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 10, letterSpacing: "-0.03em" }}>Zentra Dashboard</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14, textAlign: "center", opacity: 0.8 }}>Ingresa tus credenciales para sincronizar tu tienda y gestionar tu crecimiento con IA.</p>
                </div>

                <motion.form
                    onSubmit={handleSubmit}
                    style={{ display: "flex", flexDirection: "column", gap: 20 }}
                    animate={errorMsg ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                >
                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Email (Tenant Admin)</label>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>{I.user}</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
                                placeholder="tu@empresa.com"
                                style={{
                                    width: "100%", padding: "12px 16px 12px 42px", borderRadius: 12,
                                    background: "var(--bg-surface)", border: `1px solid ${errorMsg ? "var(--red)" : "var(--border)"}`,
                                    color: "var(--text-primary)", fontSize: 14, outline: "none",
                                    transition: "all 0.2s ease", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                                }}
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Contraseña</label>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>{I.key}</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
                                placeholder="••••••••"
                                style={{
                                    width: "100%", padding: "12px 16px 12px 42px", borderRadius: 12,
                                    background: "var(--bg-surface)", border: `1px solid ${errorMsg ? "var(--red)" : "var(--border)"}`,
                                    color: "var(--text-primary)", fontSize: 14, outline: "none",
                                    transition: "all 0.2s ease", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                                }}
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {errorMsg && (
                        <div style={{ color: "var(--red)", fontSize: 13, fontWeight: 500, textAlign: "center", background: "var(--red-dim)", padding: "10px", borderRadius: "8px" }}>
                            {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !email || !password}
                        className="btn-gold"
                        style={{
                            marginTop: 8, padding: 14, borderRadius: 12, border: "none",
                            background: "linear-gradient(135deg, #0ea5e9, #38bdf8)", color: "#fff",
                            fontSize: 15, fontWeight: 600, cursor: (isLoading || !email || !password) ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 14px rgba(14, 165, 233, 0.3)", opacity: (isLoading || !email || !password) ? 0.7 : 1,
                            display: "flex", justifyContent: "center", alignItems: "center"
                        }}
                    >
                        {isLoading ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                        ) : "Entrar al Dashboard"}
                    </button>
                </motion.form>
            </motion.div>
        </div>
    );
}
