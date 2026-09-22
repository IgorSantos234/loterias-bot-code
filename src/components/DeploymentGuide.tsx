import React, { useState } from "react";
import {
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  Server,
  Workflow,
  Key,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export const DeploymentGuide: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Seção 1: GitHub Actions (Opção Recomendada Gratuita) */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Workflow className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Opção 1: GitHub Actions (100% Gratuito & Recomendado)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                  Zero Custo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Utiliza a infraestrutura de runners gratuitos do GitHub (2.000 minutos/mês inclusos) com agendamento cron e persistência automática de estado via commit.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h4 className="font-semibold text-slate-200">Subir para o GitHub</h4>
            <p className="text-slate-400 leading-relaxed">
              Crie um repositório no seu GitHub (público ou privado) e faça o push dos arquivos do projeto contidos na pasta <code>bot_python/</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h4 className="font-semibold text-slate-200">Configurar Secrets</h4>
            <p className="text-slate-400 leading-relaxed">
              No GitHub, vá em <strong>Settings &gt; Secrets and variables &gt; Actions</strong> e adicione as chaves <code>WHATSAPP_API_URL</code>, <code>WHATSAPP_API_KEY</code> e <code>WHATSAPP_CHANNEL_ID</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              3
            </span>
            <h4 className="font-semibold text-slate-200">Execução Automática</h4>
            <p className="text-slate-400 leading-relaxed">
              O arquivo <code>.github/workflows/lottery_cron.yml</code> rodará automaticamente nos horários dos sorteios (20h às 22h BRT) e comitará o estado atualizado.
            </p>
          </div>
        </div>

        {/* Secrets Necessários */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="h-4 w-4 text-emerald-400" />
            <span>Tabela de Secrets a Cadastrar no GitHub</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Nome do Secret</th>
                  <th className="py-2 px-3">Exemplo de Valor</th>
                  <th className="py-2 px-3">Finalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">WHATSAPP_API_URL</td>
                  <td className="py-2.5 px-3 text-slate-400">https://evolution.seudominio.com</td>
                  <td className="py-2.5 px-3 font-sans">URL base da Evolution API ou Z-API</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">WHATSAPP_API_KEY</td>
                  <td className="py-2.5 px-3 text-slate-400">4296fa89c3...</td>
                  <td className="py-2.5 px-3 font-sans">Token de autenticação da API</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">WHATSAPP_INSTANCE_ID</td>
                  <td className="py-2.5 px-3 text-slate-400">loterias-brasil</td>
                  <td className="py-2.5 px-3 font-sans">Nome da instância conectada</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">WHATSAPP_CHANNEL_ID</td>
                  <td className="py-2.5 px-3 text-slate-400">120363045678901234@newsletter</td>
                  <td className="py-2.5 px-3 font-sans">ID oficial do canal WhatsApp</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Seção 2: Render.com (Opção Serveless / Cron Gratuita) */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Opção 2: Render.com (Cron Job ou Background Worker)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Hospede o script como um Cron Job gratuito acionado a cada 30 minutos ou como um processo contínuo (Daemon).
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 font-sans border-b border-slate-800 pb-2">
            <span className="font-semibold text-slate-200">Parâmetros de Configuração no Render</span>
            <span className="text-[10px] text-sky-400">Render Free Tier</span>
          </div>
          <div className="space-y-2 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Service Type:</span>
              <span className="text-emerald-400 font-bold">Cron Job</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Build Command:</span>
              <code className="text-sky-300 bg-slate-900 px-2 py-0.5 rounded">pip install -r requirements.txt</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Command:</span>
              <code className="text-sky-300 bg-slate-900 px-2 py-0.5 rounded">python main.py --run-once</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Schedule (UTC):</span>
              <code className="text-amber-300 bg-slate-900 px-2 py-0.5 rounded">0,30 23,0,1 * * 1-6</code>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 3: Fluxo de Automação & Diagrama */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="h-5 w-5 text-emerald-400" />
          <span>Documentação do Fluxo de Automação do Bot</span>
        </h3>
        <p className="text-xs text-slate-400">
          O bot foi projetado segundo os princípios de idempotência e tolerância a falhas:
        </p>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-3 leading-relaxed">
          <p className="text-emerald-400 font-bold">
            [ETAPA 1] INÍCIO DO CICLO AGENDADO (20h00 - 22h00 BRT)
          </p>
          <p className="text-slate-400 pl-4">
            ↳ O Scheduler desperta e itera sobre a lista de loterias: Mega-Sena, Lotofácil, Quina, Lotomania e Dia de Sorte.
          </p>

          <p className="text-sky-400 font-bold">
            [ETAPA 2] REQUISIÇÃO À API CAIXA & TRATAMENTO DE RETRIES
          </p>
          <p className="text-slate-400 pl-4">
            ↳ Consulta <code>https://servicebus2.caixa.gov.br/portaldeloterias/api/{'{loteria}'}</code>.
            <br />↳ Em caso de timeout ou HTTP 429 (rate-limit), aguarda com backoff exponencial (2s, 4s, 8s) até 3 tentativas.
          </p>

          <p className="text-amber-400 font-bold">
            [ETAPA 3] VERIFICAÇÃO ATÔMICA DE DUPLICIDADE (STATE MANAGEMENT)
          </p>
          <p className="text-slate-400 pl-4">
            ↳ Consulta <code>lottery_state.json</code> ou <code>lotteries.db</code>: <em>"O concurso #X já foi enviado anteriormente?"</em>
            <br />↳ Se <strong>SIM</strong>: Interrompe a execução para essa loteria com log <code>[DUPLICADO] Ignorado</code>.
            <br />↳ Se <strong>NÃO</strong>: Continua para a etapa de formatação e publicação.
          </p>

          <p className="text-emerald-400 font-bold">
            [ETAPA 4] FORMATAÇÃO TIPOGRÁFICA DO WHATSAPP
          </p>
          <p className="text-slate-400 pl-4">
            ↳ Organiza as dezenas em ordem crescente no padrão <code>[01] - [12] - [23]</code>.
            <br />↳ Aplica máscara brasileira de moeda (<code>R$ 1.234.567,89</code>) e extrai quantidade de ganhadores e estimativa.
          </p>

          <p className="text-indigo-400 font-bold">
            [ETAPA 5] DISPARO PARA O CANAL DO WHATSAPP & GRAVAÇÃO DO ESTADO
          </p>
          <p className="text-slate-400 pl-4">
            ↳ Dispara via Evolution API v2 para o JID do Canal (<code>120363045678901234@newsletter</code>).
            <br />↳ Gravando o ID do concurso processado no histórico persistente para nunca mais reenviar.
          </p>
        </div>
      </div>
    </div>
  );
};
