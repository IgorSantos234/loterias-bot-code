import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { LotteryCards } from "./components/LotteryCards";
import { WhatsAppPreviewModal } from "./components/WhatsAppPreviewModal";
import { DuplicateStorageViewer } from "./components/DuplicateStorageViewer";
import { ExecutionConsole } from "./components/ExecutionConsole";
import { SchedulerTimeline } from "./components/SchedulerTimeline";
import { CodeExplorer } from "./components/CodeExplorer";
import { DeploymentGuide } from "./components/DeploymentGuide";
import { LotteryItem, StorageState, CycleSummary } from "./types";
import { Check, AlertCircle } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [lotteries, setLotteries] = useState<LotteryItem[]>([]);
  const [isLoadingLotteries, setIsLoadingLotteries] = useState<boolean>(true);
  const [storageState, setStorageState] = useState<StorageState | null>(null);
  const [selectedLotteryForPreview, setSelectedLotteryForPreview] = useState<LotteryItem | null>(null);
  
  // Console logs & execution
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `[SISTEMA] Bot Loterias Brasil inicializado.`,
    `[SISTEMA] Conectado à API oficial da Caixa Econômica Federal.`,
    `[STORAGE] Base de persistência: data/lottery_state.json`,
  ]);
  const [cycleSummary, setCycleSummary] = useState<CycleSummary | null>(null);
  const [isRunningCycle, setIsRunningCycle] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Carregar dados das Loterias da Caixa
  const fetchLotteries = useCallback(async () => {
    setIsLoadingLotteries(true);
    try {
      const res = await fetch("/api/lotteries/live");
      if (res.ok) {
        const data = await res.json();
        setLotteries(data.lotteries || []);
      }
    } catch (e: any) {
      console.error("Erro ao carregar loterias:", e);
    } finally {
      setIsLoadingLotteries(false);
    }
  }, []);

  // Carregar estado de duplicidade
  const fetchStorageState = useCallback(async () => {
    try {
      const res = await fetch("/api/storage/state");
      if (res.ok) {
        const data = await res.json();
        setStorageState(data);
      }
    } catch (e: any) {
      console.error("Erro ao carregar state:", e);
    }
  }, []);

  useEffect(() => {
    fetchLotteries();
    fetchStorageState();
  }, [fetchLotteries, fetchStorageState]);

  // Executar Ciclo de Verificação (Manual ou Simulado)
  const handleRunCycle = async (force: boolean = false, dryRun: boolean = true) => {
    setIsRunningCycle(true);
    showToast(force ? "Executando checagem forçada (--force)..." : "Executando ciclo de verificação...");
    
    try {
      const res = await fetch("/api/bot/run-cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force, dryRun }),
      });

      if (res.ok) {
        const data = await res.json();
        setConsoleLogs((prev) => [...prev, ...data.logs]);
        setCycleSummary(data.summary);
        setStorageState(data.state);
        
        // Atualiza a listagem de loterias para refletir o status de duplicidade
        await fetchLotteries();

        if (data.summary.duplicates > 0 && !force) {
          showToast(`Ciclo concluído: ${data.summary.duplicates} duplicados ignorados com sucesso!`);
        } else {
          showToast(`Ciclo concluído: ${data.summary.processed} novos concursos processados.`);
        }
      }
    } catch (e: any) {
      showToast(`Erro na execução do ciclo: ${e.message}`);
    } finally {
      setIsRunningCycle(false);
    }
  };

  // Resetar Histórico
  const handleResetState = async () => {
    try {
      const res = await fetch("/api/storage/reset", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setStorageState(data.state);
        await fetchLotteries();
        setConsoleLogs((prev) => [
          ...prev,
          `[STORAGE] Histórico de concursos resetado pelo usuário. Próximo ciclo processará todos os concursos como novos.`,
        ]);
        showToast("Histórico resetado! Agora você pode testar o envio como novo concurso.");
      }
    } catch (e: any) {
      showToast(`Erro ao resetar: ${e.message}`);
    }
  };

  // Alternar concurso individual (para testar deduplicação)
  const handleToggleProcessed = async (lotteryId: string, contestNumber: number) => {
    try {
      const res = await fetch("/api/storage/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lotteryId, contestNumber }),
      });
      if (res.ok) {
        const data = await res.json();
        setStorageState(data.state);
        await fetchLotteries();
        showToast(
          data.exists
            ? `Concurso #${contestNumber} marcado como PROCESSADO (será ignorado por duplicidade).`
            : `Concurso #${contestNumber} desmarcado (será tratado como NOVO).`
        );
      }
    } catch (e: any) {
      showToast(`Erro: ${e.message}`);
    }
  };

  // Copiar Mensagem Formatada
  const handleCopyMessage = (text: string, lotteryName: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Mensagem da ${lotteryName} copiada com formatação do WhatsApp!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Header Principal */}
      <Header
        onRefresh={fetchLotteries}
        onRunCycle={handleRunCycle}
        isRunningCycle={isRunningCycle}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === "dashboard" && (
          <LotteryCards
            lotteries={lotteries}
            isLoading={isLoadingLotteries}
            onSelectForPreview={(lot) => setSelectedLotteryForPreview(lot)}
            onCopyMessage={handleCopyMessage}
            onToggleProcessed={handleToggleProcessed}
          />
        )}

        {activeTab === "storage" && (
          <DuplicateStorageViewer
            storageState={storageState}
            onResetState={handleResetState}
            onToggleContest={handleToggleProcessed}
          />
        )}

        {activeTab === "console" && (
          <ExecutionConsole
            logs={consoleLogs}
            summary={cycleSummary}
            isRunning={isRunningCycle}
            onRunCycle={handleRunCycle}
            onClearLogs={() => setConsoleLogs([])}
          />
        )}

        {activeTab === "scheduler" && <SchedulerTimeline />}

        {activeTab === "code" && <CodeExplorer />}

        {activeTab === "deploy" && <DeploymentGuide />}
      </main>

      {/* Modal de Pré-Visualização WhatsApp */}
      <WhatsAppPreviewModal
        lottery={selectedLotteryForPreview}
        onClose={() => setSelectedLotteryForPreview(null)}
        onCopyMessage={handleCopyMessage}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-medium">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Rodapé */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Sistema de Automação das Loterias Caixa • Canal WhatsApp "Loterias Brasil"
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Mega-Sena</span>
            <span>•</span>
            <span>Lotofácil</span>
            <span>•</span>
            <span>Quina</span>
            <span>•</span>
            <span>Lotomania</span>
            <span>•</span>
            <span>Dia de Sorte</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
