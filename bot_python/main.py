import os
import sys
import time
import argparse
import logging
from datetime import datetime, timezone, timedelta
try:
    from zoneinfo import ZoneInfo
except ImportError:
    try:
        from pytz import timezone as ZoneInfo
    except ImportError:
        # Fallback para fuso UTC-3 caso nem zoneinfo nem pytz estejam instalados
        class ZoneInfo:
            def __init__(self, key):
                self.key = key
            def utcoffset(self, dt):
                return timedelta(hours=-3)
            def tzname(self, dt):
                return "BRT"
            def dst(self, dt):
                return timedelta(0)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Garantir que o diretório bot_python esteja no sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.lottery_client import CaixaLotteryClient
from src.storage import LotteryStorage
from src.formatter import WhatsAppMessageFormatter
from src.whatsapp_client import WhatsAppClient
from src.scheduler import LotteryScheduler

# Configuração de Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("LoteriasBrasilBot")

class LoteriasBrasilOrchestrator:
    """
    Orquestrador principal do bot Loterias Brasil.
    Executa a esteira:
    1. Busca o resultado mais recente na API da Caixa
    2. Valida duplicidade no Storage (JSON ou SQLite)
    3. Formata a mensagem com layout do canal do WhatsApp
    4. Dispara para o Canal do WhatsApp via API
    5. Registra o concurso como processado
    """

    def __init__(self):
        self.lottery_client = CaixaLotteryClient()
        
        storage_type = os.getenv("STORAGE_TYPE", "json")
        storage_path = os.getenv("STORAGE_FILE_PATH", "data/lottery_state.json")
        self.storage = LotteryStorage(storage_type=storage_type, file_path=storage_path)
        
        self.formatter = WhatsAppMessageFormatter()
        self.whatsapp_client = WhatsAppClient()
        
        lotteries_env = os.getenv("LOTTERIES", "megasena,lotofacil,quina,lotomania,diadesorte")
        self.target_lotteries = [lot.strip() for lot in lotteries_env.split(",") if lot.strip()]

    def run_check_cycle(self, force_send: bool = False):
        """Executa um ciclo completo de verificação para todas as loterias configuradas."""
        tz_br = ZoneInfo(os.getenv("TIMEZONE", "America/Sao_Paulo"))
        now_br = datetime.now(tz_br)
        
        logger.info(f"===> Iniciando ciclo de checagem às {now_br.strftime('%Y-%m-%d %H:%M:%S %Z')} <===")
        
        processed_count = 0
        skipped_count = 0
        errors_count = 0

        for lottery_name in self.target_lotteries:
            try:
                logger.info(f"Consultando loteria: {lottery_name.upper()}...")
                lottery_data = self.lottery_client.get_latest_result(lottery_name)
                
                if not lottery_data:
                    logger.warning(f"Nenhum dado retornado para {lottery_name}.")
                    errors_count += 1
                    continue

                contest_number = lottery_data.get("numero")
                draw_date = lottery_data.get("dataApuracao")
                
                logger.info(f"[{lottery_name.upper()}] Último concurso na Caixa: #{contest_number} ({draw_date})")

                # Verificação de Duplicidade
                if not force_send and self.storage.is_contest_processed(lottery_name, contest_number):
                    logger.info(f"[{lottery_name.upper()}] Concurso #{contest_number} já foi processado anteriormente. Ignorando.")
                    skipped_count += 1
                    continue

                # Formatação da mensagem
                message_text = self.formatter.format_message(lottery_name, lottery_data)
                
                logger.info(f"[{lottery_name.upper()}] Publicando no canal WhatsApp Loterias Brasil...")
                send_success = self.whatsapp_client.send_channel_message(message_text)

                if send_success:
                    self.storage.mark_contest_processed(
                        lottery_name=lottery_name,
                        contest_number=contest_number,
                        draw_date=draw_date,
                        meta={
                            "acumulado": lottery_data.get("acumulado"),
                            "dezenas": lottery_data.get("listaDezenas", [])
                        }
                    )
                    logger.info(f"[{lottery_name.upper()}] Concurso #{contest_number} enviado e registrado com sucesso!")
                    processed_count += 1
                else:
                    logger.error(f"[{lottery_name.upper()}] Falha ao enviar mensagem pelo WhatsApp.")
                    errors_count += 1

                # Pequena pausa entre envios para respeitar boas práticas de rede
                time.sleep(1.5)

            except Exception as e:
                logger.error(f"Erro ao processar {lottery_name}: {str(e)}", exc_info=True)
                errors_count += 1

        logger.info(
            f"===> Ciclo finalizado: {processed_count} enviados, {skipped_count} duplicados ignorados, {errors_count} erros <===\n"
        )
        return {
            "processed": processed_count,
            "skipped": skipped_count,
            "errors": errors_count
        }

def main():
    parser = argparse.ArgumentParser(description="Bot Loterias Brasil - WhatsApp Automation")
    parser.add_argument("--run-once", action="store_true", help="Executa a checagem uma única vez e encerra (ideal para GitHub Actions / Cron)")
    parser.add_argument("--force", action="store_true", help="Força o envio mesmo se o concurso já estiver no histórico")
    parser.add_argument("--dry-run", action="store_true", help="Executa sem enviar de fato para o WhatsApp (apenas loga)")
    args = parser.parse_args()

    orchestrator = LoteriasBrasilOrchestrator()
    if args.dry_run:
        orchestrator.whatsapp_client.dry_run = True
        logger.info("Modo Dry-Run ATIVADO (nenhuma mensagem real será disparada).")

    if args.run_once:
        logger.info("Modo de execução única (--run-once) iniciado.")
        orchestrator.run_check_cycle(force_send=args.force)
    else:
        logger.info("Iniciando modo daemon com agendador noturno (20h às 22h BRT)...")
        scheduler = LotteryScheduler(job_callback=lambda: orchestrator.run_check_cycle(force_send=args.force))
        scheduler.start()

if __name__ == "__main__":
    main()
