import { motion, AnimatePresence } from "framer-motion";

/* ── Animated Glass Card ── */
export function GlassCard({ children, className = "", style = {}, delay = 0, interactive = false, onClick, glow = false }) {
    return (
        <motion.div
            className={`glass-card ${interactive ? "glass-card-interactive" : ""} ${className}`}
            style={style}
            onClick={onClick}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: delay * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={interactive ? {
                y: -4,
                scale: 1.02,
                transition: { duration: 0.3, ease: "easeOut" }
            } : {
                y: -2,
                transition: { duration: 0.3, ease: "easeOut" }
            }}
            whileTap={interactive ? {
                scale: 0.98

                , transition: { duration: 0.1 }
            } : undefined}
        >
            {glow && (
                <div
                    style={{
                        position: "absolute", inset: 0, borderRadius: "inherit",
                        background: "radial-gradient(circle at 50% 50%, rgba(14,165,233,0.06) 0%, transparent 70%)",
                        pointerEvents: "none", zIndex: 0,
                        animation: "glowPulse 4s ease-in-out infinite"
                    }}
                />
            )}
            {children}
        </motion.div>
    );
}

/* ── Page Transition Wrapper ── */
export function PageTransition({ children, key: pageKey }) {
    return (
        <motion.div
            key={pageKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {children}
        </motion.div>
    );
}

/* ── Staggered Container ── */
export function StaggerContainer({ children, staggerDelay = 0.06, style = {}, className = "" }) {
    return (
        <motion.div
            style={style}
            className={className}
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: staggerDelay } }
            }}
        >
            {children}
        </motion.div>
    );
}

/* ── Stagger Item ── */
export function StaggerItem({ children, style = {}, className = "" }) {
    return (
        <motion.div
            style={style}
            className={className}
            variants={{
                hidden: { opacity: 0, y: 20, scale: 0.97 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } }
            }}
        >
            {children}
        </motion.div>
    );
}

/* ── Liquid Glow Icon — CSS animation replaces Framer Motion for perf ── */
export function LiquidIcon({ children, color = "#0ea5e9", size = 38, hover = false }) {
    return (
        <div
            style={{
                background: `${color}12`,
                color,
                borderRadius: 14,
                width: size,
                height: size,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                animation: "iconBob 3s ease-in-out infinite",
                transition: hover ? "transform 0.2s, box-shadow 0.2s" : undefined,
            }}
            onMouseEnter={hover ? (e) => {
                e.currentTarget.style.transform = "scale(1.15)";
                e.currentTarget.style.boxShadow = `0 0 20px ${color}30`;
            } : undefined}
            onMouseLeave={hover ? (e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
            } : undefined}
        >
            {/* Internal liquid glow — CSS animation */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    background: `radial-gradient(circle at 50% 80%, ${color}20 0%, transparent 60%)`,
                    pointerEvents: "none",
                    animation: "glowPulse 3.5s ease-in-out infinite",
                }}
            />
            <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
        </div>
    );
}

/* ── Animated Number Counter ── */
export function LiquidNumber({ value, prefix = "", suffix = "", color = "var(--text-primary)", size = 26 }) {
    return (
        <motion.div
            style={{ fontSize: size, fontWeight: 700, fontFamily: "var(--font-display)", lineHeight: 1, color }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
        </motion.div>
    );
}

/* ── Hover Scale Button ── */
export function LiquidButton({ children, variant = "gold", style = {}, onClick }) {
    return (
        <motion.button
            className={`btn-${variant}`}
            style={style}
            onClick={onClick}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
        >
            {children}
        </motion.button>
    );
}
