import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import api from '../../api';
import { 
    Lock, Mail, ArrowRight, AlertCircle, 
    Sun, Moon, Database, Users, LineChart, 
    Loader2, User, Sparkles, CheckCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { gsap } from 'gsap';

/**
 * ============================================
 * 🌌 GH-SCORE PRO: LUXURY CINEMATIC EXPERIENCE V3
 * Seamless Transition & Real-time Connection Status
 * Optimized for DISCOL - "Nivel NASA Premium"
 * ============================================
 */

// --- PARTICLE AMBIANCE (WITH MOUSE PARALLAX) ---
const ParticleAmbiance: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: any[] = [];
        const mouse = { x: -100, y: -100 };

        class Particle {
            x: number; y: number; vx: number; vy: number; size: number; alpha: number;
            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 0.5;
                this.alpha = Math.random() * 0.5 + 0.2;
            }
            update(w: number, h: number) {
                this.x += this.vx; this.y += this.vy;
                if (this.x < 0 || this.x > w) this.vx *= -1;
                if (this.y < 0 || this.y > h) this.vy *= -1;
                
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    this.x -= dx * 0.01;
                    this.y -= dy * 0.01;
                }
            }
            draw(ctx: CanvasRenderingContext2D, allParticles: any[], index: number) {
                const distThreshold = 140;
                for (let j = index + 1; j < allParticles.length; j++) {
                    const p2 = allParticles[j];
                    const dx = this.x - p2.x;
                    const dy = this.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < distThreshold) {
                        ctx.beginPath();
                        ctx.moveTo(this.x, this.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = theme === 'dark' 
                            ? `rgba(0, 212, 255, ${0.8 * (1 - dist / distThreshold)})` 
                            : `rgba(5, 80, 152, ${0.6 * (1 - dist / distThreshold)})`;
                        ctx.lineWidth = theme === 'dark' ? 1.0 : 1.5;
                        ctx.stroke();
                    }
                }
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = theme === 'dark' ? `rgba(0, 212, 255, ${this.alpha})` : `rgba(5, 80, 152, ${this.alpha})`;
                ctx.fill();
            }
        }

        const init = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            for (let i = 0; i < 110; i++) particles.push(new Particle(canvas.width, canvas.height));
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, i) => {
                p.update(canvas.width, canvas.height);
                p.draw(ctx, particles, i);
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        init(); animate();
        window.addEventListener('resize', init);
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', init);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [theme]);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />;
};

// --- LUXURY CURSOR ---
const LuxuryCursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const move = (e: MouseEvent) => {
            gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 1, ease: 'expo.out' });
        };
        window.addEventListener('mousemove', move);
        return () => window.removeEventListener('mousemove', move);
    }, []);
    return <div ref={cursorRef} className="fixed w-10 h-10 border border-blue-500/20 rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center backdrop-blur-[1px]" />;
};

// --- WELCOME PORTAL OVERLAY ---
const WelcomePortal: React.FC<{ user: any, active: boolean, status: 'connecting' | 'success' }> = ({ user, active, status }) => {
    const portalRef = useRef<HTMLDivElement>(null);
    const avatarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!active) return;

        // Immediate fade-in of the overlay + avatar (NO delay, NO black screen)
        gsap.to(portalRef.current, { opacity: 1, duration: 0.5, ease: 'power2.out' });
        gsap.fromTo(avatarRef.current,
            { scale: 0.7, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.5)' }
        );
    }, [active]);

    useEffect(() => {
        if (!active || status !== 'success') return;
        // Animate welcome elements when status changes to success
        gsap.fromTo(".welcome-detail",
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
        );
        gsap.fromTo(".sync-bar", { width: "0%" }, { width: "100%", duration: 1.2, ease: "power2.inOut", delay: 0.3 });
    }, [active, status]);

    if (!active) return null;

    return (
        <div ref={portalRef} className="fixed inset-0 z-[100] opacity-0 flex flex-col items-center justify-center backdrop-blur-3xl">
            {/* Soft translucent overlay — NOT solid black */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b0e14]/50 via-[#0b0e14]/70 to-[#0b0e14]/50" />

            {/* Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-xl px-10">

                {/* AVATAR — always visible when active */}
                <div ref={avatarRef} className="relative mb-10">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-110" />
                    <div className="w-44 h-44 rounded-full border-2 border-blue-500/40 p-3 bg-white/5 backdrop-blur-3xl flex items-center justify-center overflow-hidden shadow-[0_0_60px_rgba(59,130,246,0.2)]">
                        {status === 'connecting' ? (
                            <Loader2 size={60} className="text-blue-500 animate-spin" />
                        ) : (
                            <>
                                {user?.avatarUrl ? (
                                    <img src={`http://localhost:3001${user.avatarUrl}`} alt="User" className="w-full h-full object-cover rounded-full shadow-inner" />
                                ) : (
                                    <User size={90} className="text-blue-400 opacity-60" />
                                )}
                                <div className="absolute -top-1 -right-1 bg-emerald-500 p-2 rounded-full shadow-lg shadow-emerald-500/30 animate-in zoom-in duration-300">
                                    <CheckCircle size={20} className="text-white" />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* STATUS TEXT — changes dynamically */}
                <h3 className="text-sm font-black uppercase tracking-[0.5em] mb-6 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-colors duration-500"
                    style={{ color: status === 'connecting' ? '#60a5fa' : '#34d399' }}>
                    {status === 'connecting' ? '⟳ Estableciendo Conexión...' : '✓ Conexión Establecida'}
                </h3>

                {/* WELCOME DETAILS — only when success */}
                {status === 'success' && (
                    <div className="space-y-4">
                        <h2 className="welcome-detail text-5xl font-black text-white tracking-tighter leading-none">
                            ¡Bienvenido, <span className="text-blue-500">{user?.fullName?.split(' ')[0] || 'Usuario'}</span>!
                        </h2>
                        <p className="welcome-detail text-slate-400 text-base font-medium opacity-80 max-w-sm mx-auto">
                            Tu sesión ha sido verificada. Preparando tu centro de comando.
                        </p>

                        {/* Progress Bar */}
                        <div className="welcome-detail w-full max-w-xs mx-auto mt-6">
                            <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="sync-bar h-full bg-gradient-to-r from-blue-600 to-emerald-400 shadow-[0_0_15px_#34d399] w-0" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState<any>(null);
    const [activeStage, setActiveStage] = useState<'none' | 'login' | 'welcome'>('none');
    const [portalStatus, setPortalStatus] = useState<'connecting' | 'success'>('connecting');
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [pendingMessage, setPendingMessage] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const formRef = useRef<HTMLDivElement>(null);
    const brandRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setActiveStage('welcome');
        setPortalStatus('connecting');

        // Initial Form Blur/Hide
        gsap.to([formRef.current, brandRef.current], { 
            opacity: 0, 
            scale: 0.95,
            duration: 0.5, 
            ease: 'back.in(1.2)' 
        });

        try {
            const res = await api.post('/auth/login', { email, password });
            if (res.data.success) {
                // SUCCESS TRANSITION
                setLoggedInUser(res.data.user);
                setPortalStatus('success');

                // Let the user enjoy the welcome, then fade out & navigate
                setTimeout(() => {
                    login(res.data.token, res.data.user, res.data.tenant);
                    navigate('/dashboard');
                }, 2000);

            } else {
                setLoading(false);
                setActiveStage('none');
                setError('Credenciales inválidas');
                gsap.to([formRef.current, brandRef.current], { opacity: 1, scale: 1, duration: 0.3 });
            }
        } catch (err: any) {
            setLoading(false);
            setActiveStage('none');
            gsap.to([formRef.current, brandRef.current], { opacity: 1, scale: 1, duration: 0.3 });

            if (err.statusCode === 403 || (err.response && err.response.status === 403)) {
                // Si el servidor indica que la cuenta está inactiva/registrada
                setPendingMessage(
                    err.userMessage || 
                    (err.response && err.response.data && err.response.data.error) || 
                    "Tu usuario ha sido registrado. Debes esperar a que el administrador del sistema te otorgue los permisos de acceso y volver a intentarlo en 10 minutos."
                );
                setShowPendingModal(true);
            } else if (err.userMessage || (err.response && err.response.data && err.response.data.error)) {
                setError(err.userMessage || err.response.data.error);
            } else {
                setError('Error de comunicación con el núcleo.');
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row relative selection:bg-blue-500/30 overflow-hidden" 
             style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
            
            <ParticleAmbiance />
            <LuxuryCursor />
            <WelcomePortal user={loggedInUser} active={activeStage === 'welcome'} status={portalStatus} />

            {/* Header / Brand */}
            <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Sparkles className="text-white" size={20} />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-white">GH-SCORE <span className="font-light opacity-60">PRO</span></span>
                </div>
                <button
                    onClick={(e) => {
                        gsap.to(e.currentTarget, { rotation: "+=180", duration: 0.6, ease: "power2.inOut" });
                        toggleTheme();
                    }}
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all backdrop-blur-md"
                >
                    {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-blue-500" />}
                </button>
            </div>

            {/* Content Sidebar */}
            <div ref={brandRef} className="flex-1 flex flex-col justify-center items-center lg:items-start p-12 lg:pl-24 relative z-10 pt-32 lg:pt-0">
                <div className="max-w-xl">
                    <h1 className="text-6xl lg:text-7xl font-black mb-6 tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        Liderazgo <br />
                        <span className="text-blue-500 italic">Conectado</span> al Futuro
                    </h1>
                    <p className="text-xl text-slate-400 font-medium mb-12 opacity-80 max-w-md leading-relaxed">
                        Accede a la suite de gestión de talento más avanzada. Sincroniza tus procesos con el núcleo DISCOL.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <FeatureTag text="Secure Sync" />
                        <FeatureTag text="IA Engine" />
                        <FeatureTag text="Bio Metrics" />
                    </div>
                </div>
            </div>

            {/* Login Center */}
            <div ref={formRef} className="flex-1 flex flex-col justify-center items-center p-6 relative z-10">
                <div className="w-full max-w-sm glass-panel hud-corners p-12 bg-white/5 border-white/10 shadow-2xl transition-all duration-1000">
                    <div className="corner-bl" />
                    
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Login</h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Protocolo de Entrada</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 opacity-60">Usuario</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={17} />
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                                    placeholder="Usuario o email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 opacity-60">Firma de Seguridad</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={17} />
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full nasa-button py-5 text-sm font-black tracking-widest uppercase mt-4 shadow-[0_20px_40px_rgba(59,130,246,0.1)]"
                        >
                            <div className="flex items-center gap-2">
                                <span>Ingresar al Sistema</span>
                                <ArrowRight size={18} />
                            </div>
                        </button>
                    </form>
                </div>
            </div>

            <div className="absolute bottom-8 left-12 text-[9px] text-slate-700 font-black uppercase tracking-[0.5em] z-10 hidden lg:block">
                GH-SCORE // ENTERPRISE EDITION
            </div>

            {/* Modal de Activación Pendiente */}
            {showPendingModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
                    <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-blue-500/20 bg-[#0f172a] shadow-2xl relative animate-in zoom-in duration-300">
                        {/* Corners decorativos */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500/40 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500/40 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500/40 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500/40 rounded-br-lg" />

                        <div className="w-16 h-16 bg-blue-500/10 rounded-full border border-blue-500/30 flex items-center justify-center mx-auto mb-6 text-blue-400">
                            <Sparkles size={28} className="animate-pulse" />
                        </div>
                        
                        <h3 className="text-2xl font-black text-white tracking-tight mb-4 text-center">Registro Completado</h3>
                        
                        <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium text-center">
                            {pendingMessage}
                        </p>
                        
                        <div className="py-3 px-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-[11px] font-black text-blue-400 uppercase tracking-widest mb-8 text-center">
                            ⏱ Por favor, vuelve a intentarlo en 10 minutos
                        </div>
                        
                        <button
                            onClick={() => setShowPendingModal(false)}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black tracking-widest uppercase rounded-2xl shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 transition-all cursor-pointer"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const FeatureTag: React.FC<{ text: string }> = ({ text }) => (
    <div className="px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {text}
    </div>
);

export default LoginPage;
