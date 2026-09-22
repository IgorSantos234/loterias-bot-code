import React from "react";
import {
  MessageSquare,
  Copy,
  Calendar,
  Sparkles,
  Trophy,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Share2,
} from "lucide-react";
import { LotteryItem } from "../types";

interface LotteryCardsProps {
  lotteries: LotteryItem[];
  isLoading: boolean;
  onSelectForPreview: (lottery: LotteryItem) => void;
  onCopyMessage: (text: string, lotteryName: string) => void;
  onToggleProcessed: (lotteryId: string, contestNumber: number) => void;
}

export const LotteryCards: React.FC<LotteryCardsProps> = ({
  lotteries,
  isLoading,
  onSelectForPreview,
  onCopyMessage,
  onToggleProcessed,
}) => {
  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || val === null) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  if (isLoading && lotteries.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 animate-pulse space-y-4"
          >
            <div className="h-6 bg-slate-800 rounded w-1/3" />
            <div className="h-4 bg-slate-800 rounded w-1/2" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((b) => (
                <div key={b} className="h-8 w-8 bg-slate-800 rounded-full" />
              ))}
            </div>
            <div className="h-10 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Resultados Oficiais das Loterias Caixa</span>
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              5 Loterias Monitoradas
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dados obtidos diretamente da API oficial da Caixa com formatação rigorosa para o canal WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Processado
          </span>
          <span className="flex items-center gap-1.5 ml-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Pendente de Envio
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {lotteries.map((lot) => {
          const data = lot.data;
          const contestNum = data?.numero ?? 0;
          const drawDate = data?.dataApuracao ?? "--/--/----";
          const isAccumulated = data?.acumulado ?? false;
          const nextDate = data?.dataProximoConcurso ?? "A definir";
          const nextEstimate = formatCurrency(data?.valorEstimadoProximoConcurso);
          
          const rawNumbers = data?.listaDezenas || [];
          const sortedNumbers = [...rawNumbers].sort(
            (a, b) => parseInt(a, 10) - parseInt(b, 10)
          );

          // Faixa 1
          const rateio = data?.listaRateioPremio || [];
          const faixa1 = rateio[0];
          const ganhadores = faixa1?.numeroDeGanhadores ?? 0;
          const valorFaixa1 = formatCurrency(faixa1?.valorPremio);

          return (
            <div
              key={lot.id}
              className="flex flex-col justify-between rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-lg relative overflow-hidden"
            >
              {/* Barra de cor superior da Loteria */}
              <div
                className="h-2 w-full"
                style={{ backgroundColor: lot.color }}
              />

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Cabeçalho do Card */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {lot.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">
                          Concurso #{contestNum}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {drawDate}
                        </span>
                      </div>
                    </div>

                    {/* Badge de Duplicidade / Envio */}
                    <button
                      onClick={() => onToggleProcessed(lot.id, contestNum)}
                      title="Clique para alternar o status de processamento (teste de duplicidade)"
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                        lot.isProcessed
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                          : "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                      }`}
                    >
                      {lot.isProcessed ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          <span>Enviado</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          <span>Pendente</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Status de Acúmulo */}
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        isAccumulated
                          ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          : "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                      }`}
                    >
                      {isAccumulated ? "🔥 ACUMULOU!" : "🎉 TEVE GANHADOR"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {lot.badge}: {ganhadores} aposta(s) ({valorFaixa1})
                    </span>
                  </div>
                </div>

                {/* Dezenas Sorteadas */}
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                    Dezenas Sorteadas
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {sortedNumbers.length > 0 ? (
                      sortedNumbers.map((num, idx) => (
                        <span
                          key={idx}
                          className="h-7 w-7 rounded-lg bg-slate-800 text-slate-100 font-mono text-xs font-bold flex items-center justify-center border border-slate-700 shadow-sm"
                          style={{
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06)`,
                          }}
                        >
                          {num.padStart(2, "0")}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">
                        Dezenas ainda não divulgadas
                      </span>
                    )}
                  </div>

                  {/* Dia de Sorte - Mês da Sorte */}
                  {lot.id === "diadesorte" && data?.nomeTimeCoracaoMesSorte && (
                    <div className="mt-2 text-xs font-medium text-amber-300/90 flex items-center gap-1.5 bg-amber-950/30 px-2 py-1 rounded-md border border-amber-900/40">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>Mês da Sorte: <strong>{data.nomeTimeCoracaoMesSorte}</strong></span>
                    </div>
                  )}
                </div>

                {/* Estimativa Próximo Concurso */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      Próximo Concurso:
                    </span>
                    <span className="font-medium text-slate-300">{nextDate}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-slate-200">
                    <span>Estimativa de Prêmio:</span>
                    <span className="font-bold font-mono text-emerald-400">
                      {nextEstimate}
                    </span>
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => onSelectForPreview(lot)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Ver no WhatsApp</span>
                  </button>

                  <button
                    onClick={() => onCopyMessage(lot.formattedMessage, lot.name)}
                    title="Copiar mensagem formatada para a área de transferência"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(lot.formattedMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Compartilhar diretamente via WhatsApp Web"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700 transition"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
