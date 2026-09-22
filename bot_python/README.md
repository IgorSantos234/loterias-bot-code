# 🎰 Bot Loterias Brasil - Automação para Canal do WhatsApp

Sistema completo, modular e autônomo para monitorar os resultados oficiais dos concursos das Loterias Caixa Econômica Federal e publicar automaticamente mensagens formatadas com emojis e tipografia do WhatsApp no canal **"Loterias Brasil"**.

---

## 📋 Sumário
1. [Visão Geral e Arquitetura](#1-visão-geral-e-arquitetura)
2. [Loterias Monitoradas](#2-loterias-monitoradas)
3. [Prevenção de Duplicidade (State Management)](#3-prevenção-de-duplicidade-state-management)
4. [Formatação do Padrão da Mensagem](#4-formatação-do-padrão-da-mensagem)
5. [Integração com WhatsApp (Canais / Newsletters)](#5-integração-com-whatsapp-canais--newsletters)
6. [Instalação Local e Execução](#6-instalação-local-e-execução)
7. [Deploy 100% Gratuito em Nuvem](#7-deploy-100-gratuito-em-nuvem)
   - [Opção A: GitHub Actions (Recomendado)](#opção-a-github-actions-cron-gratuito)
   - [Opção B: Render.com (Background Worker / Cron)](#opção-b-rendercom)
8. [Variáveis de Ambiente (.env)](#8-variáveis-de-ambiente-env)

---

## 1. Visão Geral e Arquitetura

O bot opera sob uma esteira modular com separação de responsabilidades (Clean Architecture):

```
┌─────────────────┐       ┌────────────────────┐       ┌──────────────────┐
│  API Caixa CEF  │ ----> │ LotteryClient      │ ----> │ LotteryStorage   │
│  (Servicebus)   │       │ (Retries & Backoff)│       │ (Deduplicação)   │
└─────────────────┘       └────────────────────┘       └────────┬─────────┘
                                                                │ Concurso novo?
                                                                ▼
┌─────────────────┐       ┌────────────────────┐       ┌──────────────────┐
│ Canal WhatsApp  │ <---- │ WhatsAppClient     │ <---- │ MessageFormatter │
│ Loterias Brasil │       │ (Evolution/Z-API)  │       │ (Template Emojis)│
└─────────────────┘       └────────────────────┘       └──────────────────┘
```

### Estrutura de Arquivos
```
bot_python/
├── main.py                     # Orquestrador de execução (--run-once ou daemon)
├── requirements.txt            # Dependências Python
├── .env.example                # Template de configuração
├── data/
│   └── lottery_state.json      # Base de concursos já processados
├── src/
│   ├── lottery_client.py       # Requisição à Caixa com exponential backoff
│   ├── storage.py              # Deduplicação (JSON ou SQLite)
│   ├── formatter.py            # Formatação estrita com emojis do WhatsApp
│   ├── whatsapp_client.py      # Integração com Evolution API, Z-API ou Meta
│   └── scheduler.py            # Agendamento 20h00 às 22h00 (Horário de Brasília)
└── .github/workflows/
    └── lottery_cron.yml        # Automação agendada gratuita no GitHub Actions
```

---

## 2. Loterias Monitoradas
- **Mega-Sena** (`megasena`)
- **Lotofácil** (`lotofacil`)
- **Quina** (`quina`)
- **Lotomania** (`lotomania`)
- **Dia de Sorte** (`diadesorte`)

---

## 3. Prevenção de Duplicidade (State Management)
Para garantir que o canal do WhatsApp **nunca receba uma mesma apuração duas vezes**, o sistema implementa persistência de estado configurável:
- **JSON (`data/lottery_state.json`):** Armazena o número do concurso mais recente e histórico dos últimos 50 concursos para cada loteria. É ideal para pipelines serverless como o GitHub Actions, pois pode ser versionado no Git com facilidade.
- **SQLite (`data/lotteries.db`):** Cria a tabela `processed_contests` com chave primária composta `(lottery_name, contest_number)` e data do processamento.

---

## 4. Formatação do Padrão da Mensagem
O bot gera mensagens estritamente conforme o padrão homologado:

```text
🏆 *RESULTADO - MEGA-SENA*
📅 *Concurso:* 3060 | *Data:* 20/09/2026

🔢 *Dezenas Sorteadas:*
[06] - [15] - [23] - [36] - [37] - [38]

💰 *Premiação:*
• 6 acertos: 0 aposta(s) ganhadora(s) (R$ 0,00)
• Acumulou? Sim
• Próximo concurso: 22/09/2026 (Estimativa: R$ 45.000.000,00)

📲 *Acompanhe no canal Loterias Brasil*
```

---

## 5. Integração com WhatsApp (Canais / Newsletters)
No WhatsApp, **Canais** usam identificadores no formato `120363xxxxxxxxxx@newsletter`. O bot foi projetado para as APIs mais robustas do mercado:
1. **Evolution API v2:** Disparo direto via `POST /message/sendText/{instance}` com payload `{ "number": "JID@newsletter", "text": "..." }`.
2. **Z-API:** Disparo via `POST /instances/{id}/token/{token}/send-text`.
3. **Meta WhatsApp Cloud API:** Disparo oficial via Graph API.

---

## 6. Instalação Local e Execução

### Pré-requisitos
- Python 3.10 ou superior
- Pip

### Passo a Passo
```bash
# 1. Clonar ou acessar a pasta
cd bot_python

# 2. Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate no Windows

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas chaves

# 5. Execução de Teste (Dry-run: simula sem enviar)
python main.py --run-once --dry-run

# 6. Execução em Modo Daemon Noturno (20h às 22h)
python main.py
```

---

## 7. Deploy 100% Gratuito em Nuvem

### Opção A: GitHub Actions (Cron Gratuito - Recomendado)
O GitHub Actions oferece até 2.000 minutos gratuitos por mês para repositórios públicos e privados.

1. Suba este projeto para um repositório no seu GitHub.
2. Acesse: **Settings > Secrets and variables > Actions**.
3. Adicione os seguintes Secrets:
   - `WHATSAPP_API_URL`: URL da sua Evolution API ou Z-API
   - `WHATSAPP_API_KEY`: Seu token de API
   - `WHATSAPP_INSTANCE_ID`: Nome da sua instância
   - `WHATSAPP_CHANNEL_ID`: Ex: `120363045678901234@newsletter`
4. Acesse a aba **Actions** > **Bot Loterias Brasil - Verificador Noturno**.
5. O workflow rodará automaticamente nos horários programados (20h00, 20h30, 21h00, 21h30, 22h00 e 22h30 BRT) e comitará o arquivo `lottery_state.json` para manter o histórico de duplicidade.

### Opção B: Render.com
1. Crie uma conta gratuita em [render.com](https://render.com).
2. Conecte seu repositório GitHub.
3. Escolha **Cron Job** (ou **Background Worker**):
   - **Build Command:** `pip install -r bot_python/requirements.txt`
   - **Command:** `python bot_python/main.py --run-once`
   - **Schedule:** `*/30 23,0,1 * * 1-6` (em UTC)
4. Adicione as variáveis de ambiente na aba **Environment**.

---

## 8. Variáveis de Ambiente (.env)

| Variável | Padrão | Descrição |
|---|---|---|
| `WHATSAPP_PROVIDER` | `evolution` | Provedor: `evolution`, `zapi` ou `meta` |
| `WHATSAPP_API_URL` | - | URL base da sua API de WhatsApp |
| `WHATSAPP_INSTANCE_ID` | `loterias-brasil` | Identificador da instância conectada |
| `WHATSAPP_API_KEY` | - | Chave ou token de autenticação |
| `WHATSAPP_CHANNEL_ID` | `...@newsletter` | JID do Canal do WhatsApp |
| `STORAGE_TYPE` | `json` | Mecanismo de persistência (`json` ou `sqlite`) |
| `TIMEZONE` | `America/Sao_Paulo` | Fuso horário dos sorteios |
| `CHECK_INTERVAL_MINUTES` | `30` | Intervalo de verificação |
