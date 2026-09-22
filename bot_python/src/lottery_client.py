import time
import json
import logging
import ssl
from typing import Dict, Any, Optional

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    import urllib.request
    import urllib.error

logger = logging.getLogger("LoteriasBrasilBot.Client")

# Mapeamento oficial de identificadores das loterias
LOTTERY_ENDPOINTS = {
    "megasena": "megasena",
    "lotofacil": "lotofacil",
    "quina": "quina",
    "lotomania": "lotomania",
    "diadesorte": "diadesorte"
}

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://loterias.caixa.gov.br/",
    "Origin": "https://loterias.caixa.gov.br"
}

class CaixaLotteryClient:
    """
    Cliente HTTP para consumo da API pública das Loterias Caixa Econômica Federal.
    Possui tratamento de conexão, retries com backoff exponencial e validação de schema.
    Funciona tanto com a biblioteca 'requests' quanto com a biblioteca nativa 'urllib'.
    """

    PRIMARY_BASE_URL = "https://servicebus2.caixa.gov.br/portaldeloterias/api"

    def __init__(self, max_retries: int = 3, timeout_seconds: int = 10):
        self.max_retries = max_retries
        self.timeout_seconds = timeout_seconds
        if HAS_REQUESTS:
            self.session = requests.Session()
            self.session.headers.update(DEFAULT_HEADERS)
        else:
            self.session = None

    def _fetch_url(self, url: str) -> tuple[int, Any]:
        """Executa a requisição HTTP usando requests ou urllib."""
        if HAS_REQUESTS and self.session:
            resp = self.session.get(url, timeout=self.timeout_seconds)
            try:
                data = resp.json()
            except Exception:
                data = None
            return resp.status_code, data
        else:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            req = urllib.request.Request(url, headers=DEFAULT_HEADERS)
            try:
                with urllib.request.urlopen(req, timeout=self.timeout_seconds, context=ctx) as response:
                    raw_bytes = response.read()
                    data = json.loads(raw_bytes.decode("utf-8"))
                    return response.getcode(), data
            except urllib.error.HTTPError as e:
                return e.code, None
            except Exception:
                return 0, None

    def get_latest_result(self, lottery_name: str) -> Optional[Dict[str, Any]]:
        """
        Obtém os dados do último concurso realizado para a loteria especificada.
        Implementa retentativas automáticas em caso de erro transitório ou rate-limit.
        """
        normalized_name = lottery_name.lower().replace("-", "").replace("_", "")
        endpoint = LOTTERY_ENDPOINTS.get(normalized_name, normalized_name)
        url = f"{self.PRIMARY_BASE_URL}/{endpoint}"

        for attempt in range(1, self.max_retries + 1):
            try:
                logger.debug(f"Tentativa {attempt}/{self.max_retries} para {endpoint} em {url}")
                status_code, data = self._fetch_url(url)

                if status_code == 200 and data:
                    if self._validate_response(data):
                        return data
                    else:
                        logger.warning(f"Resposta inválida ou incompleta recebida da Caixa para {lottery_name}.")
                
                elif status_code == 429:
                    wait_time = attempt * 3
                    logger.warning(f"Rate-limit atingido (429) para {lottery_name}. Aguardando {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    logger.warning(f"Status HTTP {status_code} ao consultar {lottery_name} (tentativa {attempt}).")

            except Exception as e:
                logger.warning(f"Erro na tentativa {attempt} para {lottery_name}: {str(e)}")

            # Backoff exponencial antes da próxima tentativa
            if attempt < self.max_retries:
                backoff = 2 ** attempt
                time.sleep(backoff)

        logger.error(f"Falha ao obter dados da loteria {lottery_name} após {self.max_retries} tentativas.")
        return None

    def _validate_response(self, data: Any) -> bool:
        """Valida se o JSON retornado contém os campos mínimos essenciais de um concurso."""
        if not isinstance(data, dict):
            return False
        required_keys = ["numero", "dataApuracao", "listaDezenas"]
        return all(key in data for key in required_keys)
