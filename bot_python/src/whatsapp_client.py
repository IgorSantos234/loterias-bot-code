import os
import json
import logging
import ssl
from typing import Optional, Dict, Any

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    import urllib.request
    import urllib.error

logger = logging.getLogger("LoteriasBrasilBot.WhatsApp")

class WhatsAppClient:
    """
    Cliente para disparo de mensagens para o Canal do WhatsApp 'Loterias Brasil'.
    Suporta os provedores mais utilizados para Canais (Newsletters) do WhatsApp:
    1. Evolution API (v2)
    2. Z-API
    3. Meta WhatsApp Cloud API
    """

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.provider = os.getenv("WHATSAPP_PROVIDER", "evolution").lower().strip()
        self.base_url = os.getenv("WHATSAPP_API_URL", "https://evolution.seudominio.com").rstrip("/")
        self.instance_id = os.getenv("WHATSAPP_INSTANCE_ID", "loterias-brasil")
        self.api_key = os.getenv("WHATSAPP_API_KEY", "")
        # Canais de WhatsApp no WhatsApp Web / Baileys possuem formato: 120363xxxxxxxxx@newsletter
        self.channel_id = os.getenv("WHATSAPP_CHANNEL_ID", "120363045678901234@newsletter")

    def _post_json(self, url: str, headers: Dict[str, str], payload: Dict[str, Any]) -> tuple[int, str]:
        """Dispara POST JSON com requests ou urllib."""
        if HAS_REQUESTS:
            resp = requests.post(url, headers=headers, json=payload, timeout=15)
            return resp.status_code, resp.text
        else:
            data_bytes = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            try:
                with urllib.request.urlopen(req, timeout=15, context=ctx) as response:
                    return response.getcode(), response.read().decode("utf-8")
            except urllib.error.HTTPError as e:
                return e.code, e.read().decode("utf-8")
            except Exception as e:
                return 0, str(e)

    def send_channel_message(self, text: str) -> bool:
        """
        Envia mensagem de texto formatada para o Canal do WhatsApp 'Loterias Brasil'.
        """
        if self.dry_run:
            logger.info("[DRY-RUN] Simulação de envio para canal WhatsApp:")
            logger.info("--------------------------------------------------")
            logger.info(f"Destinatário (Canal): {self.channel_id}")
            logger.info(f"Conteúdo:\n{text}")
            logger.info("--------------------------------------------------")
            return True

        if not self.api_key or self.api_key == "sua_chave_de_api_aqui":
            logger.warning(
                "WHATSAPP_API_KEY não configurada ou com valor padrão. "
                "Registrando no log a mensagem gerada para o canal:"
            )
            logger.info(f"\n[MENSAGEM PREPARADA PARA O CANAL {self.channel_id}]:\n{text}\n")
            return True

        try:
            if self.provider == "evolution":
                return self._send_via_evolution(text)
            elif self.provider == "zapi":
                return self._send_via_zapi(text)
            elif self.provider == "meta":
                return self._send_via_meta(text)
            else:
                logger.error(f"Provedor '{self.provider}' desconhecido. Use 'evolution', 'zapi' ou 'meta'.")
                return False
        except Exception as e:
            logger.error(f"Exceção ao disparar mensagem para o WhatsApp: {str(e)}", exc_info=True)
            return False

    def _send_via_evolution(self, text: str) -> bool:
        """Envio via Evolution API v2 (compatível com Canais / Newsletters)"""
        url = f"{self.base_url}/message/sendText/{self.instance_id}"
        headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "number": self.channel_id,
            "text": text,
            "delay": 1200
        }

        logger.info(f"Enviando via Evolution API para canal: {self.channel_id}")
        code, resp_text = self._post_json(url, headers, payload)
        
        if code in [200, 201]:
            logger.info("Mensagem enviada com sucesso pela Evolution API!")
            return True
        else:
            logger.error(f"Evolution API retornou erro HTTP {code}: {resp_text}")
            return False

    def _send_via_zapi(self, text: str) -> bool:
        """Envio via Z-API (suporte a grupos e canais)"""
        url = f"{self.base_url}/instances/{self.instance_id}/token/{self.api_key}/send-text"
        headers = {
            "Content-Type": "application/json"
        }
        payload = {
            "phone": self.channel_id,
            "message": text
        }

        logger.info(f"Enviando via Z-API para canal: {self.channel_id}")
        code, resp_text = self._post_json(url, headers, payload)
        
        if code in [200, 201]:
            logger.info("Mensagem enviada com sucesso pela Z-API!")
            return True
        else:
            logger.error(f"Z-API retornou erro HTTP {code}: {resp_text}")
            return False

    def _send_via_meta(self, text: str) -> bool:
        """Envio via Meta WhatsApp Cloud API"""
        url = f"{self.base_url}/messages"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": self.channel_id,
            "type": "text",
            "text": {"preview_url": False, "body": text}
        }

        logger.info(f"Enviando via Meta Cloud API para canal: {self.channel_id}")
        code, resp_text = self._post_json(url, headers, payload)
        
        if code in [200, 201]:
            logger.info("Mensagem enviada com sucesso pela Meta Cloud API!")
            return True
        else:
            logger.error(f"Meta API retornou erro HTTP {code}: {resp_text}")
            return False
