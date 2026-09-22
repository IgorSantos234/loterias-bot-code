import React from "react";
import { Terminal, Play, RotateCcw, Trash2, Check, AlertCircle, ShieldAlert, Cpu } from "lucide-react";
import { CycleSummary } from "../types";

interface ExecutionConsoleProps {
  logs: string[];
  summary: CycleSummary | null;
  isRunning: boolean;
  onRunCycle: (force: boolean, dryRun: boolean) => void;
  onClearLogs: () => void;
}

export const ExecutionConsole: React.FC<ExecutionConsoleProps> = ({
  logs,
  summary,
  isRunning,
  onRunCycle,
  onClearLogs,
}) => {
  return (
    <div className="space-y-4">
      {/* Controles do Console */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Console de Execução & Telemetria</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhe a esteira de requisição, retries, verificação de duplicidade e envio ao canal WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onRunCycle(false, true)}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
          >
            <Play className={`h-3.5 w-3.5 ${isRunning ? "animate-spin" : ""}`} />
            <span>Rodar Ciclo Padrão</span>
          </button>

          <button
            onClick={() => onRunCycle(true, true)}
            disabled={isRunning}
            title="Ignora a verificação de duplicidade e processa todos os concursos novamente"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Forçar Reenvio (--force)</span>
          </button>

          <button
            onClick={onClearLogs}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
            title="Limpar logs do console"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cards de Resumo da Última Execução */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
              {summary.processed}
            </div>
            <div>
              <span className="text-[11px] text-emerald-400 font-semibold block">
                Processados / Enviados
              </span>
              <span className="text-[10px] text-slate-400">
                Novos concursos publicados
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
              {summary.duplicates}
            </div>
            <div>
              <span className="text-[11px] text-amber-400 font-semibold block">
                Duplicados Ignorados
              </span>
              <span className="text-[10px] text-slate-400">
                Concursos já salvos em state
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm">
              {summary.errors}
            </div>
            <div>
              <span className="text-[11px] text-slate-300 font-semibold block">
                Falhas de Conexão
              </span>
              <span className="text-[10px] text-slate-400">
                Retries acionados automaticamente
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Janela de Terminal / Logs */}
      <div className="rounded-2xl border border-slate-800 bg-[#090d13] shadow-2xl overflow-hidden font-mono text-xs">
        {/* Barra de Título do Terminal */}
        <div className="bg-[#121820] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-[11px] font-medium text-slate-300 ml-2">
              bash — python bot_python/main.py
            </span>
          </div>

          <span className="text-[10px] text-slate-500">
            {logs.length} linhas de telemetria
          </span>
        </div>

        {/* Linhas de Log */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-1.5 select-text">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic py-8 text-center">
              Nenhuma execução recente. Clique em "Rodar Ciclo Padrão" para simular a esteira.
            </div>
          ) : (
            logs.map((line, idx) => {
              let textColor = "text-slate-300";
              if (line.includes("[ERRO]")) textColor = "text-rose-400 font-semibold";
              else if (line.includes("[DUPLICADO]")) textColor = "text-amber-400";
              else if (line.includes("[SUCESSO]")) textColor = "text-emerald-400 font-semibold";
              else if (line.includes("[WHATSAPP]")) textColor = "text-teal-300";
              else if (line.includes("===>")) textColor = "text-sky-300 font-bold";

              return (
                <div key={idx} className={`${textColor} leading-relaxed break-all`}>
                  {line}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
