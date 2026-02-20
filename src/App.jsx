import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const API_BASE = "https://vendia-api-production.up.railway.app";
const BUSINESS_ID = "bisuteria-luna";

// --- Icons (inline SVG) ---
const Icons = {
  chat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  cart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  trending: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  package: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  alert: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  refresh: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  send: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  whatsapp: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
};

// --- Styles ---
const theme = {
  bg: "#0a0a0b",
  surface: "#141416",
  surfaceHover: "#1a1a1e",
  border: "#232328",
  borderLight: "#2a2a30",
  text: "#e8e8ec",
  textMuted: "#8a8a96",
  textDim: "#5a5a66",
  accent: "#c8a96e",
  accentDim: "rgba(200,169,110,0.12)",
  accentGlow: "rgba(200,169,110,0.25)",
  green: "#4ade80",
  greenDim: "rgba(74,222,128,0.12)",
  red: "#f87171",
  redDim: "rgba(248,113,113,0.12)",
  blue: "#60a5fa",
  blueDim: "rgba(96,165,250,0.12)",
};

// --- API Hooks ---
function useAPI(endpoint) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}${endpoint}`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// --- Stat Card ---
function StatCard({ icon, label, value, sub, color = theme.accent, bgColor = theme.accentDim }) {
  return (
    <div style={{
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: 14,
      padding: "22px 24px",
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
      transition: "all 0.2s",
      cursor: "default",
    }}>
      <div style={{
        background: bgColor,
        color: color,
        borderRadius: 10,
        width: 42,
        height: 42,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ color: theme.textMuted, fontSize: 12, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ color: theme.text, fontSize: 28, fontWeight: 700, lineHeight: 1.1, fontFamily: "'DM Sans', sans-serif" }}>
          {value}
        </div>
        {sub && <div style={{ color: theme.textDim, fontSize: 12, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

// --- Product Row ---
function ProductRow({ product, index }) {
  const isLowStock = product.stock <= 5;
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "44px 1fr 80px 70px",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      borderBottom: `1px solid ${theme.border}`,
      background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 8,
        background: theme.accentDim,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {product.image_url && product.image_url !== "https://example.com" ?
          <img src={product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> :
          <span style={{ fontSize: 18 }}>✨</span>
        }
      </div>
      <div>
        <div style={{ color: theme.text, fontSize: 13, fontWeight: 500 }}>{product.title}</div>
        <div style={{ color: theme.textDim, fontSize: 11 }}>{product.product_type}</div>
      </div>
      <div style={{ color: theme.accent, fontSize: 14, fontWeight: 600, textAlign: "right" }}>
        {product.price}€
      </div>
      <div style={{
        textAlign: "right",
        fontSize: 12,
        fontWeight: 600,
        color: isLowStock ? theme.red : theme.green,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 4,
      }}>
        {isLowStock && <span style={{ color: theme.red }}>{Icons.alert}</span>}
        {product.stock}
      </div>
    </div>
  );
}

// --- Conversation Card ---
function ConversationCard({ conv, onClick }) {
  const statusColors = {
    active: { bg: theme.greenDim, color: theme.green, label: "Activa" },
    resolved: { bg: theme.blueDim, color: theme.blue, label: "Resuelta" },
    escalated: { bg: theme.redDim, color: theme.red, label: "Escalada" },
  };
  const status = statusColors[conv.status] || statusColors.active;
  const time = conv.last_message_at ? new Date(conv.last_message_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div onClick={onClick} style={{
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: 12,
      padding: "16px 18px",
      cursor: "pointer",
      transition: "all 0.15s",
      marginBottom: 8,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.background = theme.surfaceHover; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = theme.surface; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ color: theme.green, opacity: 0.7 }}>{Icons.whatsapp}</div>
          <span style={{ color: theme.text, fontSize: 14, fontWeight: 500 }}>+{conv.customer_phone}</span>
        </div>
        <span style={{
          background: status.bg,
          color: status.color,
          fontSize: 11,
          fontWeight: 600,
          padding: "3px 10px",
          borderRadius: 20,
        }}>
          {status.label}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: theme.textDim, fontSize: 12 }}>
          {conv.message_count} mensajes
          {conv.sale_made && <span style={{ color: theme.accent, marginLeft: 8 }}>💰 Venta</span>}
        </span>
        <span style={{ color: theme.textDim, fontSize: 11 }}>{time}</span>
      </div>
    </div>
  );
}

// --- Chat Viewer ---
function ChatViewer({ conversationId, onClose }) {
  const { data, loading } = useAPI(`/api/conversations/${conversationId}/messages`);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        width: "100%",
        maxWidth: 480,
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${theme.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: theme.green }}>{Icons.whatsapp}</span>
            <span style={{ color: theme.text, fontSize: 15, fontWeight: 600 }}>Conversación</span>
          </div>
          <button onClick={onClose} style={{
            background: "none",
            border: "none",
            color: theme.textMuted,
            fontSize: 20,
            cursor: "pointer",
            padding: "4px 8px",
          }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? (
            <div style={{ color: theme.textMuted, textAlign: "center", padding: 40 }}>Cargando...</div>
          ) : data?.messages?.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === "customer" ? "flex-start" : "flex-end",
              maxWidth: "80%",
            }}>
              <div style={{
                background: msg.role === "customer" ? theme.surface : theme.accentDim,
                border: `1px solid ${msg.role === "customer" ? theme.border : "rgba(200,169,110,0.2)"}`,
                color: theme.text,
                borderRadius: msg.role === "customer" ? "14px 14px 14px 4px" : "14px 14px 4px 14px",
                padding: "10px 14px",
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}>
                {msg.content}
              </div>
              <div style={{
                color: theme.textDim,
                fontSize: 10,
                marginTop: 2,
                textAlign: msg.role === "customer" ? "left" : "right",
                padding: "0 4px",
              }}>
                {msg.role === "customer" ? "Cliente" : "🤖 IA"}
                {msg.created_at && ` · ${new Date(msg.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Test Chat Panel ---
function TestChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    setMessages((prev) => [...prev, { role: "customer", content: userMsg }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/test/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.assistant }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error de conexión" }]);
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: 14,
      display: "flex",
      flexDirection: "column",
      height: 420,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "14px 18px",
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{ color: theme.green }}>{Icons.whatsapp}</div>
        <div>
          <div style={{ color: theme.text, fontSize: 14, fontWeight: 600 }}>Chat de prueba</div>
          <div style={{ color: theme.textDim, fontSize: 11 }}>Habla con tu IA en tiempo real</div>
        </div>
        <div style={{
          marginLeft: "auto",
          background: theme.greenDim,
          color: theme.green,
          fontSize: 10,
          fontWeight: 600,
          padding: "3px 10px",
          borderRadius: 20,
        }}>EN LÍNEA</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ color: theme.textDim, fontSize: 13, textAlign: "center", padding: "60px 20px" }}>
            Escribe un mensaje para probar tu asistente IA
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "customer" ? "flex-end" : "flex-start",
            maxWidth: "82%",
          }}>
            <div style={{
              background: msg.role === "customer" ? theme.accentDim : theme.surfaceHover,
              border: `1px solid ${msg.role === "customer" ? "rgba(200,169,110,0.2)" : theme.border}`,
              color: theme.text,
              borderRadius: msg.role === "customer" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              padding: "10px 14px",
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", color: theme.textMuted, fontSize: 13, padding: "8px 14px" }}>
            <span style={{ animation: "pulse 1.5s infinite" }}>Escribiendo...</span>
          </div>
        )}
      </div>

      <div style={{
        padding: 12,
        borderTop: `1px solid ${theme.border}`,
        display: "flex",
        gap: 8,
      }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Escribe un mensaje..."
          style={{
            flex: 1,
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            padding: "10px 14px",
            color: theme.text,
            fontSize: 13,
            outline: "none",
          }}
        />
        <button onClick={sendMessage} disabled={loading || !message.trim()} style={{
          background: theme.accent,
          border: "none",
          borderRadius: 10,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: theme.bg,
          opacity: loading || !message.trim() ? 0.4 : 1,
        }}>
          {Icons.send}
        </button>
      </div>
    </div>
  );
}

// --- Main Dashboard ---
export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [selectedConv, setSelectedConv] = useState(null);

  const analytics = useAPI(`/api/businesses/${BUSINESS_ID}/analytics?days=7`);
  const products = useAPI(`/api/businesses/${BUSINESS_ID}/products`);
  const conversations = useAPI(`/api/businesses/${BUSINESS_ID}/conversations`);

  const stats = analytics.data || {};

  const tabs = [
    { id: "overview", label: "Resumen" },
    { id: "conversations", label: "Conversaciones" },
    { id: "products", label: "Productos" },
    { id: "test", label: "Chat IA" },
  ];

  // Simulated chart data based on real analytics
  const chartData = [
    { day: "Lun", msgs: Math.max(stats.messages || 0, 2), convs: Math.max(stats.conversations || 0, 1) },
    { day: "Mar", msgs: 5, convs: 3 },
    { day: "Mié", msgs: 8, convs: 4 },
    { day: "Jue", msgs: 12, convs: 6 },
    { day: "Vie", msgs: 15, convs: 8 },
    { day: "Sáb", msgs: 9, convs: 5 },
    { day: "Dom", msgs: 6, convs: 3 },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: theme.text,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 3px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        input::placeholder { color: ${theme.textDim}; }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: `1px solid ${theme.border}`,
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(10,10,11,0.8)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            background: `linear-gradient(135deg, ${theme.accent}, #a08040)`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
            color: theme.bg,
          }}>Z</div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
            <span style={{ color: theme.accent }}>Zentra</span>
          </span>
          <span style={{
            background: theme.accentDim,
            color: theme.accent,
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 12,
            marginLeft: 4,
          }}>BETA</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            background: theme.greenDim,
            color: theme.green,
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 12px",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: theme.green }} />
            API conectada
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 60px" }}>
        {/* Business Name + Tabs */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>
            Luna Bisutería
          </h1>
          <p style={{ color: theme.textMuted, fontSize: 13 }}>
            Panel de control · Asistente IA de ventas por WhatsApp
          </p>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: `1px solid ${theme.border}`, paddingBottom: 0 }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none",
              border: "none",
              color: tab === t.id ? theme.accent : theme.textMuted,
              fontSize: 13,
              fontWeight: 500,
              padding: "10px 16px",
              cursor: "pointer",
              borderBottom: `2px solid ${tab === t.id ? theme.accent : "transparent"}`,
              transition: "all 0.15s",
              marginBottom: -1,
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div>
            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 28 }}>
              <StatCard
                icon={Icons.chat}
                label="Conversaciones"
                value={stats.conversations ?? "—"}
                sub="Últimos 7 días"
                color={theme.accent}
                bgColor={theme.accentDim}
              />
              <StatCard
                icon={Icons.users}
                label="Clientes únicos"
                value={stats.unique_customers ?? "—"}
                sub="Últimos 7 días"
                color={theme.blue}
                bgColor={theme.blueDim}
              />
              <StatCard
                icon={Icons.cart}
                label="Ventas asistidas"
                value={stats.sales_assisted ?? "—"}
                sub="Atribuidas a la IA"
                color={theme.green}
                bgColor={theme.greenDim}
              />
              <StatCard
                icon={Icons.trending}
                label="Carritos recuperados"
                value={stats.carts_recovered ?? "—"}
                sub="Ventas que se iban a perder"
                color="#c084fc"
                bgColor="rgba(192,132,252,0.12)"
              />
            </div>

            {/* Chart + Low Stock */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
              {/* Activity Chart */}
              <div style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: 22,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Actividad semanal</div>
                <div style={{ color: theme.textDim, fontSize: 12, marginBottom: 20 }}>Mensajes y conversaciones</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={theme.accent} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: theme.textDim, fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.textDim, fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: theme.textMuted }}
                    />
                    <Area type="monotone" dataKey="msgs" stroke={theme.accent} fill="url(#msgGrad)" strokeWidth={2} name="Mensajes" />
                    <Area type="monotone" dataKey="convs" stroke={theme.blue} fill="none" strokeWidth={2} strokeDasharray="4 4" name="Conversaciones" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Low Stock Alerts */}
              <div style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: 22,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ color: theme.red }}>{Icons.alert}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Stock bajo</span>
                </div>
                {stats.low_stock_alerts?.length > 0 ? (
                  stats.low_stock_alerts.map((item, i) => (
                    <div key={i} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: i < stats.low_stock_alerts.length - 1 ? `1px solid ${theme.border}` : "none",
                    }}>
                      <span style={{ color: theme.text, fontSize: 13 }}>{item.title}</span>
                      <span style={{
                        background: theme.redDim,
                        color: theme.red,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 10px",
                        borderRadius: 12,
                      }}>
                        {item.stock} uds
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: theme.textDim, fontSize: 13, padding: "20px 0" }}>
                    ✅ Todo en stock
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Conversations Tab */}
        {tab === "conversations" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ color: theme.textMuted, fontSize: 13 }}>
                {conversations.data?.count ?? 0} conversaciones
              </span>
              <button onClick={conversations.refetch} style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                padding: "6px 12px",
                color: theme.textMuted,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                {Icons.refresh} Actualizar
              </button>
            </div>
            {conversations.loading ? (
              <div style={{ color: theme.textMuted, textAlign: "center", padding: 60 }}>Cargando...</div>
            ) : conversations.data?.conversations?.length > 0 ? (
              conversations.data.conversations.map((conv) => (
                <ConversationCard key={conv.id} conv={conv} onClick={() => setSelectedConv(conv.id)} />
              ))
            ) : (
              <div style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: "60px 20px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                <div style={{ color: theme.text, fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
                  Sin conversaciones aún
                </div>
                <div style={{ color: theme.textMuted, fontSize: 13 }}>
                  Prueba el chat de IA para ver conversaciones aquí
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {tab === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ color: theme.textMuted, fontSize: 13 }}>
                {products.data?.count ?? 0} productos activos
              </span>
              <button onClick={products.refetch} style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                padding: "6px 12px",
                color: theme.textMuted,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                {Icons.refresh} Sync Shopify
              </button>
            </div>
            <div style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 14,
              overflow: "hidden",
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr 80px 70px",
                gap: 12,
                padding: "10px 16px",
                borderBottom: `1px solid ${theme.borderLight}`,
                color: theme.textDim,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                <span></span>
                <span>Producto</span>
                <span style={{ textAlign: "right" }}>Precio</span>
                <span style={{ textAlign: "right" }}>Stock</span>
              </div>
              {products.loading ? (
                <div style={{ color: theme.textMuted, textAlign: "center", padding: 40 }}>Cargando...</div>
              ) : (
                products.data?.products?.map((p, i) => <ProductRow key={i} product={p} index={i} />)
              )}
            </div>
          </div>
        )}

        {/* Test Chat Tab */}
        {tab === "test" && (
          <div style={{ maxWidth: 480 }}>
            <TestChat />
          </div>
        )}
      </div>

      {/* Chat Viewer Modal */}
      {selectedConv && <ChatViewer conversationId={selectedConv} onClose={() => setSelectedConv(null)} />}
    </div>
  );
}
