import os
import time
import logging
from datetime import datetime, timezone, timedelta
from typing import Callable, Any

try:
    from zoneinfo import ZoneInfo
except ImportError:
    try:
        from pytz import timezone as ZoneInfo
    except ImportError:
        class ZoneInfo:
            def __init__(self, key):
                self.key = key
            def utcoffset(self, dt):
                return timedelta(hours=-3)
            def tzname(self, dt):
                return "BRT"
            def dst(self, dt):
                return timedelta(0)

logger = logging.getLogger("LoteriasBrasilBot.Scheduler")

class LotteryScheduler:
    """
    Agendador inteligente para monitoramento dos sorteios das Loterias Caixa.
    Focado na janela crítica noturna entre 20h00 e 22h00 (Horário de Brasília),
    momento em que a Caixa realiza a apuração e publicação oficial das dezenas.
    """

    def __init__(self, job_callback: Callable[[], Any], interval_minutes: int = 30):
        self.job_callback = job_callback
        self.interval_minutes = int(os.getenv("CHECK_INTERVAL_MINUTES", interval_minutes))
        self.start_hour = int(os.getenv("SCHEDULE_START_HOUR", 20))
        self.end_hour = int(os.getenv("SCHEDULE_END_HOUR", 22))
        self.timezone_str = os.getenv("TIMEZONE", "America/Sao_Paulo")
        self.is_running = False

    def is_within_target_window(self) -> bool:
        """Verifica se o horário atual de Brasília está dentro da janela de apuração (20h00 às 22h59)."""
        tz = ZoneInfo(self.timezone_str)
        now_br = datetime.now(tz)
        current_hour = now_br.hour
        return self.start_hour <= current_hour <= self.end_hour

    def start(self):
        """Inicia o loop contínuo de agendamento."""
        self.is_running = True
        logger.info(
            f"Agendador ativo! Janela de sorteios: {self.start_hour}:00 às {self.end_hour}:59 BRT "
            f"| Intervalo: a cada {self.interval_minutes} minutos."
        )

        # Executa uma checagem inicial imediata na inicialização
        try:
            logger.info("Executando checagem inicial de inicialização...")
            self.job_callback()
        except Exception as e:
            logger.error(f"Erro na checagem inicial: {e}")

        while self.is_running:
            try:
                tz = ZoneInfo(self.timezone_str)
                now_br = datetime.now(tz)

                if self.is_within_target_window():
                    logger.info(
                        f"Horário dentro da janela de sorteios ({now_br.strftime('%H:%M:%S')} BRT). "
                        f"Aguardando {self.interval_minutes} minutos para próxima checagem..."
                    )
                    time.sleep(self.interval_minutes * 60)
                    if self.is_running:
                        self.job_callback()
                else:
                    # Fora da janela de sorteios, calcula tempo até as 20h00
                    next_start = now_br.replace(hour=self.start_hour, minute=0, second=0, microsecond=0)
                    if now_br.hour > self.end_hour:
                        # Se já passou das 22h, próximo sorteio é amanhã às 20h
                        import datetime as dt
                        next_start = next_start + dt.timedelta(days=1)

                    seconds_until_next = (next_start - now_br).total_seconds()
                    hours_until = seconds_until_next / 3600
                    logger.info(
                        f"Fora da janela de sorteios ({now_br.strftime('%H:%M:%S')} BRT). "
                        f"Próxima janela às {self.start_hour}:00 BRT (~{hours_until:.1f}h). Aguardando em modo econômico..."
                    )
                    
                    # Dorme por blocos de 15 minutos para manter responsividade
                    sleep_time = min(900, max(60, int(seconds_until_next)))
                    time.sleep(sleep_time)

            except (KeyboardInterrupt, SystemExit):
                logger.info("Agendador interrompido pelo usuário.")
                self.is_running = False
                break
            except Exception as e:
                logger.error(f"Erro no loop do scheduler: {str(e)}", exc_info=True)
                time.sleep(60)

    def stop(self):
        self.is_running = False
