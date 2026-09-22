import React from "react";
import { Clock, Moon, Calendar, Zap, Bell, CheckCircle2, Shield } from "lucide-react";

export const SchedulerTimeline: React.FC = () => {
  const checkTimes = [
    { time: "20:00", desc: "Início dos sorteios no Espaço da Sorte (São Paulo)" },
    { time: "20:30", desc: "1ª Checagem: Dezenas preliminares da Lotofácil e Quina" },
    { time: "21:00", desc: "2ª Checagem: Resultado apurado da Mega-Sena" },
    { time: "21:30", desc: "3ª Checagem: Rateio consolidado e premiação Dia de Sorte/Lotomania" },
    { time: "22:00", desc: "4ª Checagem: Fechamento das apurações de todos os concursos" },
    { time: "22:30", desc: "Varredura final de segurança de eventuais atrasos" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Informativo */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 border border-slate-800">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Moon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Janela Estratégica Noturna de Sorteios (20h00 às 22h00 BRT)
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              A Caixa Econômica Federal realiza os sorteios diariamente às 20h00 (horário de Brasília). O processamento dos dados, conferência dos bilhetes em todo o país e cálculo do rateio de prêmios ocorrem entre as 20h15 e 22h00. O agendador do bot concentra as consultas nessa janela, economizando processamento e evitando spam de requisições fora de hora.
            </p>
          </div>
        </div>
      </div>

      {/* Régua Visual das 24 Horas do Dia */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>Distribuição de Horários (Horário Oficial de Brasília - UTC-3)</span>
          </h4>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
            Intervalo: a cada 30 min
          </span>
        </div>

        {/* Linha das Horas */}
        <div className="space-y-2">
          <div className="grid grid-cols-24 gap-0.5 sm:gap-1 text-[10px] text-center font-mono">
            {Array.from({ length: 24 }).map((_, hour) => {
              const isNightActive = hour >= 20 && hour <= 22;
              return (
                <div
                  key={hour}
                  className={`h-12 rounded flex flex-col items-center justify-center transition border ${
                    isNightActive
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold shadow-sm shadow-emerald-500/20"
                      : "bg-slate-950 border-slate-800 text-slate-600"
                  }`}
                  title={`${hour}:00 - ${isNightActive ? "Janela Ativa de Monitoramento" : "Modo Econômico / Standby"}`}
                >
                  <span>{hour}h</span>
                  {isNightActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping mt-1" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded bg-slate-800 border border-slate-700" />
              00h às 19h: Modo Standby Econômico (Sem requisições desnecessárias)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="h-2 w-2 rounded bg-emerald-500" />
              20h às 22h: Janela Ativa de Apuração Oficial Caixa
            </span>
          </div>
        </div>
      </div>

      {/* Grid com os Ciclos da Janela Noturna */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {checkTimes.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex items-start gap-3"
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-emerald-500/20">
              {item.time}
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                {idx + 1}º Disparo Noturno ({item.time} BRT)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Expressões Cron Prontas */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          Configuração de Expressão Cron para Agendadores de Nuvem
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-sans">
              <span className="font-semibold text-slate-200">GitHub Actions / Servidores em UTC</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">UTC Time</span>
            </div>
            <p className="text-emerald-400 font-bold text-sm select-all">
              0,30 23,0,1 * * 1-6
            </p>
            <p className="text-[11px] text-slate-500 font-sans">
              Segunda a sábado, a cada 30 minutos das 23h às 01h UTC (20h às 22h no horário de Brasília).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-sans">
              <span className="font-semibold text-slate-200">Cron Linux Local (Fuso Brasil)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">America/Sao_Paulo</span>
            </div>
            <p className="text-sky-400 font-bold text-sm select-all">
              */30 20-22 * * 1-6
            </p>
            <p className="text-[11px] text-slate-500 font-sans">
              A cada 30 minutos das 20h às 22h de segunda a sábado no fuso brasileiro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
