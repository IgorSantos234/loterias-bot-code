import React, { useState, useEffect } from "react";
import {
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  Folder,
  FileText,
  ExternalLink,
  Archive,
} from "lucide-react";
import { CodeFileMeta } from "../types";

const PROJECT_FILES: CodeFileMeta[] = [
  {
    path: "bot_python/main.py",
    name: "main.py",
    description: "Ponto de entrada do bot, parsing de argumentos CLI e orquestrador da esteira",
    language: "python",
  },
  {
    path: "bot_python/src/lottery_client.py",
    name: "src/lottery_client.py",
    description: "Cliente HTTP para a API da Caixa com retries automáticos e backoff exponencial",
    language: "python",
  },
  {
    path: "bot_python/src/storage.py",
    name: "src/storage.py",
    description: "Prevenção de duplicidade: armazenamento persistente em JSON ou SQLite",
    language: "python",
  },
  {
    path: "bot_python/src/formatter.py",
    name: "src/formatter.py",
    description: "Formatação exata do layout da mensagem com emojis e marcação WhatsApp",
    language: "python",
  },
  {
    path: "bot_python/src/whatsapp_client.py",
    name: "src/whatsapp_client.py",
    description: "Disparo para o Canal WhatsApp 'Loterias Brasil' (Evolution API / Z-API / Meta)",
    language: "python",
  },
  {
    path: "bot_python/src/scheduler.py",
    name: "src/scheduler.py",
    description: "Agendador noturno inteligente para a janela 20h às 22h no horário de Brasília",
    language: "python",
  },
  {
    path: "bot_python/requirements.txt",
    name: "requirements.txt",
    description: "Dependências do projeto Python (requests, pytz, python-dotenv, schedule)",
    language: "text",
  },
  {
    path: "bot_python/.env.example",
    name: ".env.example",
    description: "Modelo de configuração com todas as variáveis de ambiente necessárias",
    language: "shell",
  },
  {
    path: "bot_python/.github/workflows/lottery_cron.yml",
    name: "lottery_cron.yml",
    description: "Pipeline agendado do GitHub Actions para execução 100% gratuita na nuvem",
    language: "yaml",
  },
  {
    path: "bot_python/README.md",
    name: "README.md",
    description: "Documentação completa do projeto, fluxo da automação e guias de deploy",
    language: "markdown",
  },
];

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFileMeta>(PROJECT_FILES[0]);
  const [fileContent, setFileContent] = useState<string>("Carregando código...");
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/files/content?path=${encodeURIComponent(selectedFile.path)}`);
        if (res.ok) {
          const data = await res.json();
          setFileContent(data.content);
        } else {
          setFileContent("// Arquivo pronto no diretório bot_python/" + selectedFile.name);
        }
      } catch (e: any) {
        setFileContent(`// Erro ao carregar arquivo: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [selectedFile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = selectedFile.name.split("/").pop() || "arquivo.py";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Barra Superior */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode className="h-4 w-4 text-emerald-400" />
            <span>Estrutura Modular do Projeto Python</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Todos os 5 entregáveis solicitados prontos para download e implantação imediata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar Arquivo</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Baixar {selectedFile.name.split("/").pop()}</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Lista de Arquivos + Visualizador de Código */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Navegador de Arquivos na Esquerda */}
        <div className="lg:col-span-4 rounded-2xl bg-slate-900/90 border border-slate-800 p-3 space-y-1 overflow-y-auto max-h-[600px]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 block">
            Entregáveis do Sistema
          </span>

          {PROJECT_FILES.map((file) => {
            const isSelected = selectedFile.path === file.path;
            const isSrc = file.name.startsWith("src/");

            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <div className="mt-0.5">
                  {file.name.endsWith(".py") ? (
                    <FileCode className={`h-4 w-4 ${isSelected ? "text-emerald-400" : "text-sky-400"}`} />
                  ) : file.name.endsWith(".yml") ? (
                    <Terminal className="h-4 w-4 text-amber-400" />
                  ) : (
                    <FileText className="h-4 w-4 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold truncate">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase ml-1">
                      {file.language}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {file.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Visualizador de Código na Direita */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-[#0a0e14] overflow-hidden flex flex-col shadow-2xl">
          {/* Header do Arquivo */}
          <div className="bg-[#121820] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-200">
                {selectedFile.path}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                UTF-8
              </span>
            </div>
            <span className="text-xs text-slate-400 font-sans">
              {selectedFile.description}
            </span>
          </div>

          {/* Área de Código */}
          <div className="p-4 flex-1 overflow-x-auto overflow-y-auto max-h-[550px] font-mono text-xs leading-relaxed text-slate-200 select-text">
            {isLoading ? (
              <div className="py-20 text-center text-slate-500 animate-pulse">
                Carregando código-fonte...
              </div>
            ) : (
              <pre className="whitespace-pre">{fileContent}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
