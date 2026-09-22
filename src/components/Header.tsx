import React, { useEffect, useState } from "react";
import { Radio, RefreshCw, Send, CheckCircle2, ShieldCheck, Clock } from "lucide-react";

interface HeaderProps {
  onRefresh: () => void;
  onRunCycle: (force: boolean) => void;
  isRunningCycle: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onRunCycle,
  isRunningCycle,
  activeTab,
  setActiveTab,
}) => {
  const [brasiliaTime, setBrasiliaTime] = useState<string>("");
  const [isNightWindow, setIsNightWindow] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const hour = parseInt(
        now.toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          hour12: false,
        }),
        10
      );
      setBrasiliaTime(timeStr);
      setIsNightWindow(hour >= 20 && hour <= 22);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Título */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Radio className="h-5 w-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Loterias Brasil
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Bot WhatsApp Channel
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Monitoramento Caixa CEF • Deduplicação de Concursos • Canal @newsletter
              </p>
            </div>
          </div>

          {/* Badges de Status do Sistema */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-slate-400">Brasília:</span>
              <span className="font-mono font-medium text-slate-200">
                {brasiliaTime || "Carregando..."} BRT
              </span>
              <span
                className={`ml-1 h-2 w-2 rounded-full ${
                  isNightWindow
                    ? "bg-amber-400 animate-ping"
                    : "bg-slate-500"
                }`}
                title={
                  isNightWindow
                    ? "Janela ativa de sorteios (20h às 22h)"
                    : "Fora da janela de sorteios"
                }
              />
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>API Caixa Online</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Deduplicação Ativa</span>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center gap-2">
              <button
                id="btn-refresh-lotteries"
                onClick={onRefresh}
                title="Atualizar dados da Caixa"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              <button
                id="btn-run-manual-cycle"
                onClick={() => onRunCycle(false)}
                disabled={isRunningCycle}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Send className={`h-3.5 w-3.5 ${isRunningCycle ? "animate-spin" : ""}`} />
                <span>{isRunningCycle ? "Checando..." : "Testar Ciclo"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Navegação por Abas */}
        <div className="flex items-center gap-1 sm:gap-2 mt-4 pt-3 border-t border-slate-800/80 overflow-x-auto text-xs">
          {[
            { id: "dashboard", label: "Resultados & Mensagens" },
            { id: "storage", label: "Prevenção de Duplicidade" },
            { id: "console", label: "Console de Execução" },
            { id: "scheduler", label: "Agendamento Noturno" },
            { id: "code", label: "Arquivos & Código Python" },
            { id: "deploy", label: "Deploy Gratuito (Actions / Render)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
