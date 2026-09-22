import React, { useState } from "react";
import {
  Database,
  FileJson,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  Info,
} from "lucide-react";
import { StorageState } from "../types";

interface DuplicateStorageViewerProps {
  storageState: StorageState | null;
  onResetState: () => void;
  onToggleContest: (lotteryId: string, contestNumber: number) => void;
}

export const DuplicateStorageViewer: React.FC<DuplicateStorageViewerProps> = ({
  storageState,
  onResetState,
  onToggleContest,
}) => {
  const [activeView, setActiveView] = useState<"table" | "json" | "sqlite">("table");

  const lotteries = [
    { id: "megasena", name: "Mega-Sena", color: "#209869" },
    { id: "lotofacil", name: "Lotofácil", color: "#93098f" },
    { id: "quina", name: "Quina", color: "#260085" },
    { id: "lotomania", name: "Lotomania", color: "#f78100" },
    { id: "diadesorte", name: "Dia de Sorte", color: "#cb852b" },
  ];

  return (
    <div className="space-y-6">
      {/* Banner de Explicação */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Mecanismo de Prevenção de Duplicidade (State Management)
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Cada concurso processado tem seu identificador e data registrados de forma atômica no armazenamento persistente (<strong>data/lottery_state.json</strong> ou SQLite <strong>data/lotteries.db</strong>). Antes de formatar e disparar ao WhatsApp, o bot consulta se o número do concurso já existe. Caso positivo, a apuração é descartada sem duplicar mensagens no canal.
              </p>
            </div>
          </div>

          <button
            onClick={onResetState}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Resetar Histórico (Simular Concursos Novos)</span>
          </button>
        </div>
      </div>

      {/* Tabs de Visualização */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveView("table")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeView === "table"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Tabela de Concursos Processados</span>
          </button>

          <button
            onClick={() => setActiveView("json")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeView === "json"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileJson className="h-3.5 w-3.5 text-amber-400" />
            <span>Estado JSON (lottery_state.json)</span>
          </button>

          <button
            onClick={() => setActiveView("sqlite")}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeView === "sqlite"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="h-3.5 w-3.5 text-sky-400" />
            <span>Schema SQLite (lotteries.db)</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Arquivo: data/lottery_state.json
        </span>
      </div>

      {/* Visão em Tabela */}
      {activeView === "table" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Loteria</th>
                  <th className="py-3.5 px-4">Último Concurso</th>
                  <th className="py-3.5 px-4">Data do Sorteio</th>
                  <th className="py-3.5 px-4">Horário de Envio</th>
                  <th className="py-3.5 px-4">Histórico Guardado</th>
                  <th className="py-3.5 px-4 text-right">Ação de Teste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {lotteries.map((lot) => {
                  const record = storageState?.lotteries?.[lot.id];
                  const hasProcessed = record && record.last_contest_number !== null;
                  const lastNum = record?.last_contest_number ?? "---";
                  const drawDate = record?.last_draw_date || "--/--/----";
                  const processedAt = record?.last_processed_at
                    ? new Date(record.last_processed_at).toLocaleString("pt-BR")
                    : "Pendente";
                  const historyList = record?.history || [];

                  return (
                    <tr
                      key={lot.id}
                      className="hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-200 flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: lot.color }}
                        />
                        <span>{lot.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-100 font-bold">
                        {hasProcessed ? (
                          <span className="text-emerald-400">#{lastNum}</span>
                        ) : (
                          <span className="text-slate-500">Nenhum</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{drawDate}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {hasProcessed ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                            {processedAt}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Clock className="h-3.5 w-3.5" />
                            Pendente de Envio
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {historyList.length > 0 ? (
                            historyList.slice(-6).map((num) => (
                              <span
                                key={num}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700"
                              >
                                #{num}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600 text-[10px] font-sans">
                              Vazio
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        {hasProcessed && (
                          <button
                            onClick={() => onToggleContest(lot.id, Number(lastNum))}
                            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition cursor-pointer"
                          >
                            Alternar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visão JSON */}
      {activeView === "json" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-x-auto shadow-inner text-emerald-400 leading-relaxed">
          <pre>{JSON.stringify(storageState, null, 2)}</pre>
        </div>
      )}

      {/* Visão SQLite */}
      {activeView === "sqlite" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 font-mono">
              Arquivo: data/lotteries.db (SQLite3)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              ACID Compliant
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-sky-300 leading-relaxed">
            <pre>{`-- Tabela de Concursos Processados (Evita envios duplicados)
CREATE TABLE IF NOT EXISTS processed_contests (
    lottery_name     TEXT NOT NULL,
    contest_number   INTEGER NOT NULL,
    draw_date        TEXT,
    processed_at     TEXT NOT NULL,
    meta_json        TEXT,
    PRIMARY KEY (lottery_name, contest_number)
);

-- Consulta de checagem pré-envio
SELECT 1 FROM processed_contests 
WHERE lottery_name = 'megasena' AND contest_number = 3060;`}</pre>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-sky-400" />
            <span>
              A chave primária composta <code>(lottery_name, contest_number)</code> garante integridade no nível do banco contra concorrência e execuções paralelas.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
