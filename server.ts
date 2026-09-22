import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Constantes de Loterias
const LOTTERIES = [
  { id: "megasena", name: "Mega-Sena", color: "#209869", badge: "6 acertos" },
  { id: "lotofacil", name: "Lotofácil", color: "#93098f", badge: "15 acertos" },
  { id: "quina", name: "Quina", color: "#260085", badge: "5 acertos" },
  { id: "lotomania", name: "Lotomania", color: "#f78100", badge: "20 acertos" },
  { id: "diadesorte", name: "Dia de Sorte", color: "#cb852b", badge: "7 acertos" }
];

const CAIXA_API_BASE = "https://servicebus2.caixa.gov.br/portaldeloterias/api";
const STATE_FILE_PATH = path.join(__dirname, "bot_python", "data", "lottery_state.json");

// Helper para ler estado
function getStorageState() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const content = fs.readFileSync(STATE_FILE_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Erro ao ler state file:", e);
  }
  return { lotteries: {} };
}

// Helper para salvar estado
function saveStorageState(state: any) {
  try {
    const dir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("Erro ao salvar state file:", e);
  }
}

// Formatação de moeda BRL
function formatBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

// Formatação padrão da mensagem do WhatsApp conforme especificação do usuário
function formatWhatsAppMessage(lotteryId: string, data: any): string {
  const lot = LOTTERIES.find((l) => l.id === lotteryId);
  const title = (lot?.name || lotteryId).toUpperCase();
  const contestNum = data?.numero ?? "---";
  const drawDate = data?.dataApuracao ?? "---";

  // Dezenas sorteadas
  const rawNums: string[] = data?.listaDezenas || [];
  let dezenasFormatadas = "Aguardando confirmação oficial";

  if (rawNums.length > 0) {
    const sorted = [...rawNums].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    const items = sorted.map((n) => `[${n.padStart(2, "0")}]`);
    if (lotteryId === "lotomania" && items.length === 20) {
      dezenasFormatadas = `${items.slice(0, 10).join(" - ")}\n${items.slice(10).join(" - ")}`;
    } else if (lotteryId === "lotofacil" && items.length === 15) {
      dezenasFormatadas = `${items.slice(0, 8).join(" - ")}\n${items.slice(8).join(" - ")}`;
    } else {
      dezenasFormatadas = items.join(" - ");
    }
  }

  // Mês da sorte
  let extraMonth = "";
  if (lotteryId === "diadesorte" && data?.nomeTimeCoracaoMesSorte) {
    extraMonth = `\n🗓️ *Mês da Sorte:* ${data.nomeTimeCoracaoMesSorte}`;
  }

  // Faixa Principal
  const rateio = data?.listaRateioPremio || [];
  const faixa1 = rateio[0] || {};
  const faixaDesc = faixa1.descricaoFaixa || (lot?.badge ?? "Faixa 1");
  const ganhadores = faixa1.numeroDeGanhadores ?? 0;
  const valorPremio = formatBRL(faixa1.valorPremio ?? 0);

  const acumulouStr = data?.acumulado ? "Sim" : "Não";
  const proximoConcursoData = data?.dataProximoConcurso ?? "A definir";
  const proximoEstimativa = formatBRL(data?.valorEstimadoProximoConcurso ?? 0);

  return `🏆 *RESULTADO - ${title}*
📅 *Concurso:* ${contestNum} | *Data:* ${drawDate}

🔢 *Dezenas Sorteadas:*
${dezenasFormatadas}${extraMonth}

💰 *Premiação:*
• ${faixaDesc}: ${ganhadores} aposta(s) ganhadora(s) (${valorPremio})
• Acumulou? ${acumulouStr}
• Próximo concurso: ${proximoConcursoData} (Estimativa: ${proximoEstimativa})

📲 *Acompanhe no canal Loterias Brasil*`;
}

// ==========================================
// ROTAS DA API
// ==========================================

// 1. Consulta ao vivo das 5 Loterias Caixa
app.get("/api/lotteries/live", async (req, res) => {
  try {
    const state = getStorageState();
    const results = await Promise.all(
      LOTTERIES.map(async (lot) => {
        try {
          const response = await fetch(`${CAIXA_API_BASE}/${lot.id}`, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
              Accept: "application/json, text/plain, */*"
            }
          });

          if (!response.ok) {
            return {
              id: lot.id,
              name: lot.name,
              color: lot.color,
              badge: lot.badge,
              status: "error",
              error: `HTTP ${response.status}`
            };
          }

          const data = await response.json();
          const contestNum = data.numero;
          const processedInfo = state.lotteries?.[lot.id];
          const isProcessed =
            processedInfo?.last_contest_number === contestNum ||
            processedInfo?.history?.includes(contestNum);

          const formattedMessage = formatWhatsAppMessage(lot.id, data);

          return {
            id: lot.id,
            name: lot.name,
            color: lot.color,
            badge: lot.badge,
            status: "success",
            data,
            isProcessed: Boolean(isProcessed),
            lastProcessedAt: processedInfo?.last_processed_at || null,
            formattedMessage
          };
        } catch (err: any) {
          return {
            id: lot.id,
            name: lot.name,
            color: lot.color,
            badge: lot.badge,
            status: "error",
            error: err.message || "Falha de conexão"
          };
        }
      })
    );

    res.json({
      timestamp: new Date().toISOString(),
      lotteries: results
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Consulta de Estado de Concursos Processados (Deduplicação)
app.get("/api/storage/state", (req, res) => {
  const state = getStorageState();
  res.json(state);
});

// 3. Reset do Estado de Duplicidade (para testes)
app.post("/api/storage/reset", (req, res) => {
  const initial = {
    _metadata: {
      created_at: new Date().toISOString(),
      description: "Estado dos concursos processados do Bot Loterias Brasil (Reset manual)"
    },
    lotteries: {}
  };
  saveStorageState(initial);
  res.json({ success: true, message: "Histórico de concursos processados foi resetado com sucesso!", state: initial });
});

// 4. Marcar ou desmarcar concurso específico
app.post("/api/storage/toggle", (req, res) => {
  const { lotteryId, contestNumber } = req.body;
  if (!lotteryId || !contestNumber) {
    return res.status(400).json({ error: "lotteryId e contestNumber são obrigatórios" });
  }

  const state = getStorageState();
  if (!state.lotteries) state.lotteries = {};
  if (!state.lotteries[lotteryId]) {
    state.lotteries[lotteryId] = {
      last_contest_number: null,
      last_processed_at: null,
      history: []
    };
  }

  const rec = state.lotteries[lotteryId];
  const cNum = parseInt(contestNumber, 10);
  const exists = rec.history.includes(cNum) || rec.last_contest_number === cNum;

  if (exists) {
    // Remover para simular novo concurso
    rec.history = rec.history.filter((n: number) => n !== cNum);
    if (rec.last_contest_number === cNum) {
      rec.last_contest_number = rec.history.length > 0 ? rec.history[rec.history.length - 1] : null;
    }
  } else {
    // Adicionar como processado
    rec.last_contest_number = cNum;
    rec.last_processed_at = new Date().toISOString();
    if (!rec.history.includes(cNum)) {
      rec.history.push(cNum);
    }
  }

  saveStorageState(state);
  res.json({ success: true, exists: !exists, state });
});

// 5. Execução de Ciclo de Verificação (Disparo manual ou simulação)
app.post("/api/bot/run-cycle", async (req, res) => {
  const { force = false, dryRun = true, targetLottery = null } = req.body;
  const state = getStorageState();
  const logs: string[] = [];

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });
    logs.push(`[${timestamp} BRT] ${msg}`);
  };

  addLog(`Iniciando ciclo de checagem automatizada (Modo: ${dryRun ? "Simulação / Dry-Run" : "Disparo Real"})...`);

  const listToProcess = targetLottery
    ? LOTTERIES.filter((l) => l.id === targetLottery)
    : LOTTERIES;

  let processedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  for (const lot of listToProcess) {
    try {
      addLog(`Consultando API Caixa: ${lot.name.toUpperCase()}...`);
      const resp = await fetch(`${CAIXA_API_BASE}/${lot.id}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      if (!resp.ok) {
        addLog(`[ERRO] ${lot.name}: Falha HTTP ${resp.status}`);
        errorCount++;
        continue;
      }

      const data = await resp.json();
      const contestNum = data.numero;
      const drawDate = data.dataApuracao;

      addLog(`[${lot.name.toUpperCase()}] Último concurso apurado: #${contestNum} (${drawDate})`);

      // Checagem de Duplicidade
      const rec = state.lotteries?.[lot.id];
      const isAlreadyProcessed =
        rec?.last_contest_number === contestNum || rec?.history?.includes(contestNum);

      if (!force && isAlreadyProcessed) {
        addLog(`[DUPLICADO] Concurso #${contestNum} da ${lot.name} já foi publicado anteriormente. Ignorando.`);
        duplicateCount++;
        continue;
      }

      // Formatando mensagem
      const message = formatWhatsAppMessage(lot.id, data);
      addLog(`[WHATSAPP] Mensagem gerada para o canal "Loterias Brasil":\n${message.split("\n").slice(0, 3).join("\n")}...`);

      // Atualiza estado
      if (!state.lotteries) state.lotteries = {};
      if (!state.lotteries[lot.id]) {
        state.lotteries[lot.id] = { last_contest_number: null, last_processed_at: null, history: [] };
      }
      state.lotteries[lot.id].last_contest_number = contestNum;
      state.lotteries[lot.id].last_draw_date = drawDate;
      state.lotteries[lot.id].last_processed_at = new Date().toISOString();
      if (!state.lotteries[lot.id].history.includes(contestNum)) {
        state.lotteries[lot.id].history.push(contestNum);
      }

      addLog(`[SUCESSO] Concurso #${contestNum} processado e gravado no histórico.`);
      processedCount++;
    } catch (err: any) {
      addLog(`[ERRO] Falha ao processar ${lot.name}: ${err.message}`);
      errorCount++;
    }
  }

  saveStorageState(state);
  addLog(`Ciclo finalizado: ${processedCount} processados, ${duplicateCount} duplicados ignorados, ${errorCount} erros.`);

  res.json({
    success: true,
    logs,
    summary: {
      processed: processedCount,
      duplicates: duplicateCount,
      errors: errorCount
    },
    state
  });
});

// 6. Teste de Envio WhatsApp (Evolution API / Z-API / Mock)
app.post("/api/whatsapp/test-send", async (req, res) => {
  const { provider, apiUrl, apiKey, instanceId, channelId, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Mensagem é obrigatória" });
  }

  // Se for simulação ou sem credenciais
  if (!apiUrl || !apiKey || apiKey === "sua_chave_de_api_aqui") {
    return res.json({
      success: true,
      simulated: true,
      message: "Envio simulado com sucesso (nenhuma chave real foi informada).",
      channelId: channelId || "120363045678901234@newsletter",
      previewText: message
    });
  }

  try {
    const cleanUrl = apiUrl.replace(/\/+$/, "");
    let endpoint = "";
    let headers: Record<string, string> = { "Content-Type": "application/json" };
    let payload: any = {};

    if (provider === "evolution") {
      endpoint = `${cleanUrl}/message/sendText/${instanceId || "loterias-brasil"}`;
      headers["apikey"] = apiKey;
      payload = { number: channelId, text: message };
    } else if (provider === "zapi") {
      endpoint = `${cleanUrl}/instances/${instanceId}/token/${apiKey}/send-text`;
      payload = { phone: channelId, message };
    } else {
      endpoint = `${cleanUrl}/messages`;
      headers["Authorization"] = `Bearer ${apiKey}`;
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: channelId,
        type: "text",
        text: { body: message }
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const responseData = await response.text();
    if (response.ok) {
      res.json({ success: true, simulated: false, status: response.status, data: responseData });
    } else {
      res.status(response.status).json({ success: false, error: responseData });
    }
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 7. Leitura dos Arquivos de Código para o Code Explorer & Download
app.get("/api/files/content", (req, res) => {
  const filePathParam = req.query.path as string;
  if (!filePathParam) {
    return res.status(400).json({ error: "path é obrigatório" });
  }

  // Prevenir Directory Traversal
  const safeBase = path.normalize(path.join(__dirname, "bot_python"));
  const requestedPath = path.normalize(path.join(__dirname, filePathParam));

  if (!requestedPath.startsWith(__dirname)) {
    return res.status(403).json({ error: "Acesso não autorizado" });
  }

  try {
    if (fs.existsSync(requestedPath)) {
      const content = fs.readFileSync(requestedPath, "utf-8");
      res.json({ path: filePathParam, content });
    } else {
      res.status(404).json({ error: "Arquivo não encontrado" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciação do Servidor Vite / Estático
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Loterias Brasil Server] Operando na porta ${PORT}`);
  });
}

startServer();
