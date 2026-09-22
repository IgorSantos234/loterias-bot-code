import os
import json
import sqlite3
import logging
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger("LoteriasBrasilBot.Storage")

class LotteryStorage:
    """
    Gerencia a persistência de concursos já processados para evitar envios duplicados.
    Suporta armazenamento em arquivo JSON ou em banco de dados SQLite.
    """

    def __init__(self, storage_type: str = "json", file_path: str = "data/lottery_state.json"):
        self.storage_type = storage_type.lower()
        self.file_path = file_path
        
        # Garante a existência do diretório pai
        dir_name = os.path.dirname(self.file_path)
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name, exist_ok=True)

        if self.storage_type == "sqlite":
            self._init_sqlite()
        else:
            self._init_json()

    # ==========================================
    # IMPLEMENTAÇÃO SQLITE
    # ==========================================
    def _init_sqlite(self):
        with sqlite3.connect(self.file_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS processed_contests (
                    lottery_name TEXT NOT NULL,
                    contest_number INTEGER NOT NULL,
                    draw_date TEXT,
                    processed_at TEXT NOT NULL,
                    meta_json TEXT,
                    PRIMARY KEY (lottery_name, contest_number)
                )
            """)
            conn.commit()

    # ==========================================
    # IMPLEMENTAÇÃO JSON
    # ==========================================
    def _init_json(self):
        if not os.path.exists(self.file_path):
            initial_data = {
                "_metadata": {
                    "created_at": datetime.now().isoformat(),
                    "description": "Estado dos concursos processados do Bot Loterias Brasil"
                },
                "lotteries": {}
            }
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(initial_data, f, indent=2, ensure_ascii=False)

    def _read_json(self) -> Dict[str, Any]:
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Erro ao ler JSON de estado ({str(e)}). Criando novo estado.")
            return {"lotteries": {}}

    def _write_json(self, data: Dict[str, Any]):
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    # ==========================================
    # INTERFACE PÚBLICA
    # ==========================================
    def is_contest_processed(self, lottery_name: str, contest_number: int) -> bool:
        """Verifica se determinado concurso de uma loteria já foi processado/enviado."""
        lottery_key = lottery_name.lower().strip()

        if self.storage_type == "sqlite":
            with sqlite3.connect(self.file_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT 1 FROM processed_contests WHERE lottery_name = ? AND contest_number = ?",
                    (lottery_key, int(contest_number))
                )
                return cursor.fetchone() is not None
        else:
            state = self._read_json()
            lottery_records = state.get("lotteries", {}).get(lottery_key, {})
            # Pode checar se é o último concurso ou se está na lista de históricos
            last_contest = lottery_records.get("last_contest_number")
            history = lottery_records.get("history", [])
            return (last_contest == int(contest_number)) or (int(contest_number) in history)

    def mark_contest_processed(self, lottery_name: str, contest_number: int, draw_date: str = "", meta: Optional[Dict[str, Any]] = None):
        """Salva o concurso como processado."""
        lottery_key = lottery_name.lower().strip()
        processed_at = datetime.now().isoformat()

        if self.storage_type == "sqlite":
            with sqlite3.connect(self.file_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT OR REPLACE INTO processed_contests 
                    (lottery_name, contest_number, draw_date, processed_at, meta_json)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (lottery_key, int(contest_number), draw_date, processed_at, json.dumps(meta or {}))
                )
                conn.commit()
        else:
            state = self._read_json()
            if "lotteries" not in state:
                state["lotteries"] = {}

            if lottery_key not in state["lotteries"]:
                state["lotteries"][lottery_key] = {
                    "last_contest_number": None,
                    "last_processed_at": None,
                    "history": []
                }

            record = state["lotteries"][lottery_key]
            record["last_contest_number"] = int(contest_number)
            record["last_draw_date"] = draw_date
            record["last_processed_at"] = processed_at
            
            if int(contest_number) not in record.get("history", []):
                record.setdefault("history", []).append(int(contest_number))

            # Guarda apenas os últimos 50 no histórico para manter o arquivo leve
            if len(record["history"]) > 50:
                record["history"] = record["history"][-50:]

            self._write_json(state)
            logger.debug(f"Concurso {contest_number} da {lottery_key} gravado com sucesso no JSON.")

    def get_latest_processed_contest(self, lottery_name: str) -> Optional[int]:
        """Retorna o número do último concurso processado para fins de consulta."""
        lottery_key = lottery_name.lower().strip()
        if self.storage_type == "sqlite":
            with sqlite3.connect(self.file_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT MAX(contest_number) FROM processed_contests WHERE lottery_name = ?",
                    (lottery_key,)
                )
                row = cursor.fetchone()
                return row[0] if row and row[0] is not None else None
        else:
            state = self._read_json()
            return state.get("lotteries", {}).get(lottery_key, {}).get("last_contest_number")
