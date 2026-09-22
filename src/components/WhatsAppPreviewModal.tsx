import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Send,
  Radio,
  BadgeCheck,
  ExternalLink,
  Smartphone,
  ChevronRight,
} from "lucide-react";
import { LotteryItem } from "../types";

interface WhatsAppPreviewModalProps {
  lottery: LotteryItem | null;
  onClose: () => void;
  onCopyMessage: (text: string, lotteryName: string) => void;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  lottery,
  onClose,
  onCopyMessage,
}) => {
  const [copied, setCopied] = useState(false);
  const [testSendStatus, setTestSendStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (!lottery) return null;

  const handleCopy = () => {
    onCopyMessage(lottery.formattedMessage, lottery.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateSend = async () => {
    setIsSending(true);
    setTestSendStatus(null);
    try {
      const res = await fetch("/api/whatsapp/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "evolution",
          channelId: "120363045678901234@newsletter",
          message: lottery.formattedMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestSendStatus(
          "Mensagem despachada com sucesso para o Canal Loterias Brasil!"
        );
      } else {
        setTestSendStatus(`Erro no envio: ${data.error}`);
      }
    } catch (e: any) {
      setTestSendStatus(`Erro: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header do Modal */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Visualização no Canal do WhatsApp
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mockup do WhatsApp */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/70">
          <div className="max-w-sm mx-auto rounded-2xl bg-[#0b141a] border border-slate-800 shadow-xl overflow-hidden">
            {/* Header da Conversa no WhatsApp */}
            <div className="bg-[#202c33] px-3.5 py-3 flex items-center justify-between text-white border-b border-[#2a3942]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xs shadow">
                  LB
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold">Loterias Brasil</span>
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400/20" />
                  </div>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">
                    Canal • 48.5K seguidores
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Canal Oficial
              </span>
            </div>

            {/* Corpo do Chat com Papel de Parede do WhatsApp */}
            <div
              className="p-4 min-h-[340px] flex flex-col justify-end"
              style={{
                backgroundColor: "#0b141a",
                backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
                backgroundSize: "16px 16px",
              }}
            >
              {/* Balão da Mensagem */}
              <div className="rounded-2xl rounded-tl-sm bg-[#005c4b] text-[#e9edef] p-3.5 shadow-md text-xs font-sans whitespace-pre-wrap leading-relaxed border border-[#02735e]/40 select-text">
                {lottery.formattedMessage}
                <div className="flex justify-end items-center gap-1 mt-2 text-[10px] text-emerald-200/70">
                  <span>Hoje às 20:34</span>
                </div>
              </div>
            </div>

            {/* Barra inferior simulada */}
            <div className="bg-[#202c33] px-4 py-2 text-center text-[11px] text-slate-400 border-t border-[#2a3942]">
              Apenas administradores podem enviar mensagens neste canal
            </div>
          </div>

          {/* Feedback de Envio */}
          {testSendStatus && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs text-center flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>{testSendStatus}</span>
            </div>
          )}
        </div>

        {/* Footer com Ações */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Destinatário: <code className="text-slate-300 font-mono">120363045678901234@newsletter</code>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar Mensagem</span>
                </>
              )}
            </button>

            <button
              onClick={handleSimulateSend}
              disabled={isSending}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Send className={`h-3.5 w-3.5 ${isSending ? "animate-spin" : ""}`} />
              <span>{isSending ? "Enviando..." : "Disparar para Canal"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
