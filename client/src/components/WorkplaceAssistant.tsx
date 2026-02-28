import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Lightbulb, ChevronRight, Sparkles, Loader2, Bot, Target } from 'lucide-react';
import api from '../api';
import { cn } from '../lib/utils';

// Types
interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Recommendation {
    vacancy_id: number;
    vacancy_name: string;
    issue: string;
    action: string;
    expected_impact: string;
}

interface RecommendationsResponse {
    recommendations: Recommendation[];
    general_strategy: string;
}

const WorkplaceAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'recommendations'>('chat');

    // Chat State
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hola, soy SHEYLA. Puedo responder preguntas sobre el entorno (vacantes, candidatos) o darte recomendaciones. ¿En qué puedo ayudarte hoy?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Recommendations State
    const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
    const [isLoadingRecs, setIsLoadingRecs] = useState(false);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // Fetch recommendations when tab changes
    useEffect(() => {
        if (activeTab === 'recommendations' && !recommendations && !isLoadingRecs) {
            fetchRecommendations();
        }
    }, [activeTab]);

    const fetchRecommendations = async () => {
        setIsLoadingRecs(true);
        try {
            const res = await api.get('/intelligence/recommendations');
            // Check if response is string (raw from AI) or object
            let data = res.data;
            if (typeof data === 'string') {
                // Try to parse if AI returned a code block or stringified JSON
                try {
                    const jsonMatch = data.match(/\{[\s\S]*\}/);
                    if (jsonMatch) data = JSON.parse(jsonMatch[0]);
                } catch (e) {
                    console.error("Failed to parse manual JSON", e);
                }
            }
            setRecommendations(data);
        } catch (error) {
            console.error("Error fetching recommendations:", error);
        } finally {
            setIsLoadingRecs(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg = inputValue;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputValue('');
        setIsTyping(true);

        try {
            const res = await api.post('/intelligence/ask', { question: userMsg });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, tuve un problema al procesar tu pregunta.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* FAB Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-tr from-[#3a94cc] to-blue-600 rounded-full shadow-[0_0_20px_rgba(58,148,204,0.4)] flex items-center justify-center text-white z-50 hover:scale-110 transition-transform group animate-in fade-in zoom-in duration-300"
                >
                    <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                    </span>
                </button>
            )}

            {/* Assistant Interface */}
            {isOpen && (
                <div className="fixed bottom-8 right-8 w-[400px] h-[600px] bg-[#0d1117]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 ring-1 ring-white/10">

                    {/* Header */}
                    <div className="h-16 bg-[#161b22] border-b border-white/5 flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3a94cc] to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Bot size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">SHEYLA Assistant</h3>
                                <p className="text-[10px] text-green-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Online
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-[#0a0c10] border-b border-white/5">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={cn(
                                "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                                activeTab === 'chat' ? "bg-[#161b22] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <MessageSquare size={14} />
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('recommendations')}
                            className={cn(
                                "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                                activeTab === 'recommendations' ? "bg-[#161b22] text-[#3a94cc] shadow-sm" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <Lightbulb size={14} />
                            Recomendaciones
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden relative bg-[#0a0c10]/50">

                        {/* Chat View */}
                        {activeTab === 'chat' && (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                    {messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed",
                                                msg.role === 'user'
                                                    ? "bg-[#3a94cc] text-white self-end ml-auto rounded-tr-sm shadow-md shadow-blue-500/10"
                                                    : "bg-[#161b22] text-gray-200 self-start mr-auto rounded-tl-sm border border-white/5"
                                            )}
                                        >
                                            {msg.content}
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="bg-[#161b22] self-start rounded-2xl p-3 rounded-tl-sm border border-white/5 flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-3 bg-[#161b22] border-t border-white/5">
                                    <div className="relative flex items-center group">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Escribe tu pregunta..."
                                            className="w-full bg-[#0a0c10] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#3a94cc]/50 focus:ring-1 focus:ring-[#3a94cc]/50 transition-all"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!inputValue.trim()}
                                            className="absolute right-2 p-1.5 bg-[#3a94cc] text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-[#3a94cc] transition-colors shadow-lg shadow-blue-500/20"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recommendations View */}
                        {activeTab === 'recommendations' && (
                            <div className="h-full overflow-y-auto p-4 custom-scrollbar space-y-4">
                                {isLoadingRecs ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                                        <Loader2 size={32} className="animate-spin text-[#3a94cc]" />
                                        <p className="text-xs">Analizando el entorno...</p>
                                    </div>
                                ) : !recommendations ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                                        <Lightbulb size={32} className="text-gray-600" />
                                        <p className="text-xs">No hay recomendaciones por ahora.</p>
                                        <button
                                            onClick={fetchRecommendations}
                                            className="text-[#3a94cc] text-xs hover:underline"
                                        >
                                            Reintentar análisis
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-gradient-to-br from-[#161b22] to-[#0d1117] p-4 rounded-xl border border-[#3a94cc]/20 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                                <Target size={64} />
                                            </div>
                                            <h4 className="text-sm font-bold text-[#3a94cc] mb-2 uppercase tracking-wider">Estrategia General</h4>
                                            <p className="text-xs text-gray-300 leading-relaxed italic">
                                                "{recommendations.general_strategy || "Enfocarse en vacantes críticas."}"
                                            </p>
                                        </div>

                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4 mb-2 pl-1">Acciones Prioritarias</h4>

                                        <div className="space-y-3">
                                            {recommendations.recommendations?.map((rec, idx) => (
                                                <div key={idx} className="bg-[#161b22] border border-white/5 rounded-xl p-3 hover:border-[#3a94cc]/30 transition-colors group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h5 className="text-sm font-bold text-white group-hover:text-[#3a94cc] transition-colors">{rec.vacancy_name}</h5>
                                                            <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20">{rec.issue}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3 mt-3">
                                                        <div className="flex-1 bg-[#0a0c10] rounded-lg p-2 border border-white/5">
                                                            <p className="text-[10px] text-gray-500 mb-1 font-bold uppercase">Acción Sugerida</p>
                                                            <p className="text-xs text-gray-300">{rec.action}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 flex items-center gap-2 text-[10px] text-green-400 bg-green-400/5 px-2 py-1 rounded w-fit border border-green-400/10">
                                                        <Sparkles size={10} />
                                                        <span>Impacto: {rec.expected_impact}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default WorkplaceAssistant;
