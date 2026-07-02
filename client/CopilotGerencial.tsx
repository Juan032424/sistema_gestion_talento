import { useState, useRef, useEffect } from "react";

// ─── TIPOS ───────────────────────────────────────────────────
interface Mensaje {
  id: string;
  rol: "user" | "bot";
  texto: string;
  timestamp: Date;
  cargando?: boolean;
}

// ─── CONFIGURACIÓN ───────────────────────────────────────────
const WEBHOOK_URL = "https://n8n.srv955634.hstgr.cloud/webhook/copilot_gerencial";

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────
export default function CopilotGerencial() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: "bienvenida",
      rol: "bot",
      texto: "Hola, soy el **Copilot Gerencial de DISCOL**. Consulto datos en tiempo real de la base de datos.\n\nPuedo responderte sobre **facturación, costos, utilidades, márgenes** y más. ¿Qué necesitas saber?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [pulsando, setPulsando] = useState(false);
  const mensajesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes]);

  // Focus al input cuando abre
  useEffect(() => {
    if (abierto && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [abierto]);

  const enviarMensaje = async () => {
    const texto = input.trim();
    if (!texto || cargando) return;

    const idUser = Date.now().toString();
    const idBot = (Date.now() + 1).toString();

    setMensajes((prev) => [
      ...prev,
      { id: idUser, rol: "user", texto, timestamp: new Date() },
      { id: idBot, rol: "bot", texto: "", timestamp: new Date(), cargando: true },
    ]);
    setInput("");
    setCargando(true);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: texto }),
      });
      const data = await res.text();

      setMensajes((prev) =>
        prev.map((m) =>
          m.id === idBot ? { ...m, texto: data || "Sin respuesta.", cargando: false } : m
        )
      );
    } catch (err) {
      setMensajes((prev) =>
        prev.map((m) =>
          m.id === idBot
            ? {
                ...m,
                texto: "⚠️ **Error de conexión.** Verifica que el workflow en n8n esté **Active** y los nodos conectados.",
                cargando: false,
              }
            : m
        )
      );
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const limpiarChat = () => {
    setMensajes([
      {
        id: "bienvenida-nueva",
        rol: "bot",
        texto: "Chat reiniciado. ¿En qué puedo ayudarte?",
        timestamp: new Date(),
      },
    ]);
  };

  // Renderiza texto con markdown básico
  const renderTexto = (texto: string) => {
    return texto
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  };

  const formatHora = (d: Date) =>
    d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* ─── ESTILOS ─────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .copilot-wrapper * {
          box-sizing: border-box;
          font-family: 'DM Sans', sans-serif;
        }

        /* Botón flotante */
        .copilot-btn {
          position: fixed;
          bottom: 28px;
          right: 28px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          z-index: 9998;
          outline: none;
        }
        .copilot-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.12);
        }
        .copilot-btn.pulsando {
          animation: pulso 1.8s ease-in-out infinite;
        }
        @keyframes pulso {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 0 rgba(44,83,100,0.5); }
          50% { box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 14px rgba(44,83,100,0); }
        }

        .copilot-btn-icon {
          width: 28px;
          height: 28px;
          transition: transform 0.3s ease, opacity 0.2s ease;
        }
        .copilot-btn-icon.oculto {
          transform: rotate(90deg) scale(0.6);
          opacity: 0;
          position: absolute;
        }

        /* Indicador de notificación */
        .copilot-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 12px;
          height: 12px;
          background: #22d3a0;
          border-radius: 50%;
          border: 2px solid #1a2332;
          animation: badge-pulse 2s ease-in-out infinite;
        }
        @keyframes badge-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Panel chat */
        .copilot-panel {
          position: fixed;
          bottom: 100px;
          right: 28px;
          width: 400px;
          height: 580px;
          background: #0d1b2a;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 9999;
          transform-origin: bottom right;
          animation: panel-enter 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes panel-enter {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .copilot-panel.cerrando {
          animation: panel-exit 0.18s ease-in forwards;
        }
        @keyframes panel-exit {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.88) translateY(16px); }
        }

        /* Header */
        .copilot-header {
          padding: 18px 20px 16px;
          background: linear-gradient(135deg, #0f2027 0%, #1a3040 100%);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .copilot-avatar {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #22d3a0, #0ea5e9);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(34,211,160,0.3);
        }
        .copilot-header-info { flex: 1; }
        .copilot-header-title {
          color: #f0f4f8;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -0.2px;
          line-height: 1.2;
        }
        .copilot-header-sub {
          color: rgba(255,255,255,0.4);
          font-size: 11px;
          margin-top: 2px;
        }
        .copilot-header-status {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #22d3a0;
          font-size: 11px;
          font-weight: 500;
        }
        .copilot-header-status::before {
          content: '';
          width: 7px;
          height: 7px;
          background: #22d3a0;
          border-radius: 50%;
          animation: badge-pulse 2s ease-in-out infinite;
        }
        .copilot-header-actions {
          display: flex;
          gap: 4px;
        }
        .copilot-icon-btn {
          width: 30px;
          height: 30px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          font-size: 13px;
        }
        .copilot-icon-btn:hover {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.85);
        }

        /* Mensajes */
        .copilot-mensajes {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .copilot-mensajes::-webkit-scrollbar { width: 4px; }
        .copilot-mensajes::-webkit-scrollbar-track { background: transparent; }
        .copilot-mensajes::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        /* Burbuja de mensaje */
        .copilot-burbuja {
          display: flex;
          gap: 8px;
          animation: msg-in 0.2s ease forwards;
        }
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .copilot-burbuja.user { flex-direction: row-reverse; }
        .copilot-burbuja-mini-avatar {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          margin-top: 2px;
        }
        .copilot-burbuja-mini-avatar.bot {
          background: linear-gradient(135deg, #22d3a0, #0ea5e9);
        }
        .copilot-burbuja-mini-avatar.user {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .copilot-burbuja-contenido { max-width: 82%; display: flex; flex-direction: column; gap: 4px; }
        .copilot-burbuja.user .copilot-burbuja-contenido { align-items: flex-end; }

        .copilot-texto {
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.55;
          word-break: break-word;
        }
        .copilot-burbuja.bot .copilot-texto {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.07);
          color: #d4e2f0;
          border-radius: 4px 14px 14px 14px;
        }
        .copilot-burbuja.user .copilot-texto {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: #fff;
          border-radius: 14px 4px 14px 14px;
          box-shadow: 0 4px 16px rgba(14,165,233,0.25);
        }
        .copilot-hora {
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          padding: 0 4px;
          font-family: 'DM Mono', monospace;
        }

        /* Indicador de carga */
        .copilot-typing {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 10px 14px;
        }
        .copilot-typing span {
          width: 6px;
          height: 6px;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          animation: typing 1.2s ease-in-out infinite;
        }
        .copilot-typing span:nth-child(2) { animation-delay: 0.2s; }
        .copilot-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        /* Sugerencias rápidas */
        .copilot-sugerencias {
          padding: 8px 16px 4px;
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          flex-shrink: 0;
        }
        .copilot-sugerencias::-webkit-scrollbar { display: none; }
        .copilot-chip {
          white-space: nowrap;
          padding: 5px 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px;
          color: rgba(255,255,255,0.5);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .copilot-chip:hover {
          background: rgba(34,211,160,0.1);
          border-color: rgba(34,211,160,0.3);
          color: #22d3a0;
        }

        /* Input area */
        .copilot-input-area {
          padding: 12px 14px 14px;
          background: rgba(0,0,0,0.2);
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .copilot-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 8px 8px 8px 14px;
          transition: border-color 0.15s ease;
        }
        .copilot-input-row:focus-within {
          border-color: rgba(34,211,160,0.4);
          box-shadow: 0 0 0 3px rgba(34,211,160,0.06);
        }
        .copilot-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #e2eaf2;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          line-height: 1.4;
          caret-color: #22d3a0;
        }
        .copilot-input::placeholder { color: rgba(255,255,255,0.25); }
        .copilot-send {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #22d3a0, #0ea5e9);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s ease;
          box-shadow: 0 4px 12px rgba(34,211,160,0.3);
        }
        .copilot-send:hover { transform: scale(1.05); }
        .copilot-send:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .copilot-footer-hint {
          text-align: center;
          color: rgba(255,255,255,0.15);
          font-size: 10px;
          margin-top: 8px;
          font-family: 'DM Mono', monospace;
        }

        @media (max-width: 480px) {
          .copilot-panel {
            right: 12px;
            left: 12px;
            width: auto;
            bottom: 88px;
            height: 70vh;
          }
          .copilot-btn { right: 16px; bottom: 20px; }
        }
      `}</style>

      <div className="copilot-wrapper">
        {/* ─── PANEL DE CHAT ─────────────────────────── */}
        {abierto && (
          <div className="copilot-panel">
            {/* Header */}
            <div className="copilot-header">
              <div className="copilot-avatar">🤖</div>
              <div className="copilot-header-info">
                <div className="copilot-header-title">Copilot Gerencial</div>
                <div className="copilot-header-sub">DISCOL S.A.S. · Asistente de Datos</div>
              </div>
              <div className="copilot-header-status">En línea</div>
              <div className="copilot-header-actions">
                <button
                  className="copilot-icon-btn"
                  onClick={limpiarChat}
                  title="Limpiar chat"
                >
                  🗑️
                </button>
                <button
                  className="copilot-icon-btn"
                  onClick={() => setAbierto(false)}
                  title="Cerrar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Mensajes */}
            <div className="copilot-mensajes" ref={mensajesRef}>
              {mensajes.map((msg) => (
                <div key={msg.id} className={`copilot-burbuja ${msg.rol}`}>
                  <div className={`copilot-burbuja-mini-avatar ${msg.rol}`}>
                    {msg.rol === "bot" ? "🤖" : "👤"}
                  </div>
                  <div className="copilot-burbuja-contenido">
                    {msg.cargando ? (
                      <div
                        className="copilot-texto"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px 14px 14px 14px" }}
                      >
                        <div className="copilot-typing">
                          <span /><span /><span />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="copilot-texto"
                        dangerouslySetInnerHTML={{ __html: renderTexto(msg.texto) }}
                      />
                    )}
                    <div className="copilot-hora">{formatHora(msg.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sugerencias rápidas */}
            <div className="copilot-sugerencias">
              {[
                "¿Cómo va ACUACAR?",
                "Mejor margen del mes",
                "Resumen SCR01",
                "Proyectos en pérdida",
                "Facturación 2026",
              ].map((s) => (
                <button
                  key={s}
                  className="copilot-chip"
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="copilot-input-area">
              <div className="copilot-input-row">
                <input
                  ref={inputRef}
                  className="copilot-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu pregunta gerencial..."
                  disabled={cargando}
                  maxLength={500}
                />
                <button
                  className="copilot-send"
                  onClick={enviarMensaje}
                  disabled={cargando || !input.trim()}
                  title="Enviar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="copilot-footer-hint">Enter para enviar · Datos en tiempo real</div>
            </div>
          </div>
        )}

        {/* ─── BOTÓN FLOTANTE ────────────────────────── */}
        <button
          className={`copilot-btn ${pulsando ? "pulsando" : ""}`}
          onClick={() => setAbierto((v) => !v)}
          onMouseEnter={() => setPulsando(false)}
          title="Copilot Gerencial"
        >
          {!abierto && <span className="copilot-badge" />}

          {/* Ícono chat */}
          <svg
            className={`copilot-btn-icon ${abierto ? "oculto" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Ícono X */}
          <svg
            className={`copilot-btn-icon ${!abierto ? "oculto" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </>
  );
}