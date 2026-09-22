export interface LotteryPrizeRateio {
  faixa: number;
  descricaoFaixa: string;
  numeroDeGanhadores: number;
  valorPremio: number;
}

export interface LotteryCaixaData {
  numero: number;
  dataApuracao: string;
  dataProximoConcurso: string;
  valorEstimadoProximoConcurso: number;
  acumulado: boolean;
  listaDezenas: string[];
  listaRateioPremio: LotteryPrizeRateio[];
  nomeTimeCoracaoMesSorte?: string;
  localSorteio?: string;
}

export interface LotteryItem {
  id: string;
  name: string;
  color: string;
  badge: string;
  status: "success" | "error" | "loading";
  data?: LotteryCaixaData;
  error?: string;
  isProcessed: boolean;
  lastProcessedAt?: string | null;
  formattedMessage: string;
}

export interface StorageRecord {
  last_contest_number: number | null;
  last_draw_date?: string;
  last_processed_at: string | null;
  history: number[];
}

export interface StorageState {
  _metadata?: {
    created_at?: string;
    description?: string;
  };
  lotteries: Record<string, StorageRecord>;
}

export interface CycleSummary {
  processed: number;
  duplicates: number;
  errors: number;
}

export interface WhatsAppConfig {
  provider: "evolution" | "zapi" | "meta";
  apiUrl: string;
  instanceId: string;
  apiKey: string;
  channelId: string;
}

export interface CodeFileMeta {
  path: string;
  name: string;
  description: string;
  language: string;
}
