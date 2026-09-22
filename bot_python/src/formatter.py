import locale
from typing import Dict, Any, List

LOTTERY_TITLES = {
    "megasena": "MEGA-SENA",
    "lotofacil": "LOTOFÁCIL",
    "quina": "QUINA",
    "lotomania": "LOTOMANIA",
    "diadesorte": "DIA DE SORTE"
}

# Quantidade de acertos da faixa principal por loteria
MAIN_TIER_ACERTOS = {
    "megasena": "6 acertos",
    "lotofacil": "15 acertos",
    "quina": "5 acertos",
    "lotomania": "20 acertos",
    "diadesorte": "7 acertos"
}

class WhatsAppMessageFormatter:
    """
    Formata os resultados das Loterias Caixa rigorosamente dentro do padrão
    de layout e marcação em negrito/itálico do WhatsApp para o canal 'Loterias Brasil'.
    """

    @staticmethod
    def format_currency(value: Any) -> str:
        """Formata valor numérico para o padrão de moeda brasileiro: R$ 1.234.567,89"""
        try:
            if value is None:
                return "R$ 0,00"
            val_float = float(value)
            # Formatação manual confiável independente do locale do SO
            formatted = f"{val_float:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            return f"R$ {formatted}"
        except (ValueError, TypeError):
            return "R$ 0,00"

    def format_numbers(self, lottery_name: str, raw_numbers: List[str]) -> str:
        """
        Formata as dezenas sorteadas no padrão [01] - [12] - [23].
        Para loterias com muitas dezenas (ex: Lotomania com 20 dezenas), quebra elegantemente em linhas.
        """
        if not raw_numbers:
            return "Aguardando confirmação oficial"

        # Ordenar numericamente
        try:
            sorted_nums = sorted(raw_numbers, key=lambda x: int(x))
            formatted_list = [f"[{int(num):02d}]" for num in sorted_nums]
        except Exception:
            formatted_list = [f"[{str(num).strip()}]" for num in raw_numbers]

        if lottery_name == "lotomania" and len(formatted_list) == 20:
            # Quebra 10 em cima e 10 embaixo para legibilidade no celular
            linha1 = " - ".join(formatted_list[:10])
            linha2 = " - ".join(formatted_list[10:])
            return f"{linha1}\n{linha2}"

        if lottery_name == "lotofacil" and len(formatted_list) == 15:
            linha1 = " - ".join(formatted_list[:8])
            linha2 = " - ".join(formatted_list[8:])
            return f"{linha1}\n{linha2}"

        return " - ".join(formatted_list)

    def extract_main_prize(self, lottery_name: str, lottery_data: Dict[str, Any]) -> tuple:
        """Extrai os dados da faixa principal de premiação."""
        rateio = lottery_data.get("listaRateioPremio", [])
        expected_label = MAIN_TIER_ACERTOS.get(lottery_name, "Faixa 1")

        if not rateio:
            return expected_label, 0, "R$ 0,00"

        # Tenta achar a faixa 1
        faixa_1 = rateio[0]
        descricao = faixa_1.get("descricaoFaixa") or expected_label
        ganhadores = faixa_1.get("numeroDeGanhadores", 0)
        valor_premio = faixa_1.get("valorPremio", 0.0)

        return descricao, ganhadores, self.format_currency(valor_premio)

    def format_message(self, lottery_name: str, data: Dict[str, Any]) -> str:
        """
        Gera o texto completo da mensagem conforme o template solicitado:

        🏆 *RESULTADO - MEGA-SENA*
        📅 *Concurso:* [Número] | *Data:* [Data do Sorteio]

        🔢 *Dezenas Sorteadas:*
        [01] - [12] - [23] - [34] - [45] - [56]

        💰 *Premiação:*
        • 6 acertos: [Qtde] aposta(s) ganhadora(s) ([Valor])
        • Acumulou? [Sim/Não]
        • Próximo concurso: [Data] (Estimativa: R$ [Valor])

        📲 *Acompanhe no canal Loterias Brasil*
        """
        normalized_name = lottery_name.lower().replace("-", "").replace("_", "")
        title = LOTTERY_TITLES.get(normalized_name, normalized_name.upper())

        contest_num = data.get("numero", "---")
        draw_date = data.get("dataApuracao", "---")
        
        # Dezenas
        dezenas = data.get("listaDezenas", [])
        dezenas_formatadas = self.format_numbers(normalized_name, dezenas)

        # Informação extra: Mês de Sorte no Dia de Sorte
        extra_info = ""
        if normalized_name == "diadesorte" and data.get("nomeTimeCoracaoMesSorte"):
            mes = data.get("nomeTimeCoracaoMesSorte")
            extra_info = f"\n🗓️ *Mês da Sorte:* {mes}"

        # Premiação
        faixa_desc, num_ganhadores, valor_ganhador = self.extract_main_prize(normalized_name, data)
        
        is_accumulated = data.get("acumulado", False)
        acumulou_str = "Sim" if is_accumulated else "Não"

        next_draw_date = data.get("dataProximoConcurso", "A definir")
        next_draw_estimate = self.format_currency(data.get("valorEstimadoProximoConcurso", 0))

        # Montagem do template
        message = (
            f"🏆 *RESULTADO - {title}*\n"
            f"📅 *Concurso:* {contest_num} | *Data:* {draw_date}\n\n"
            f"🔢 *Dezenas Sorteadas:*\n"
            f"{dezenas_formatadas}{extra_info}\n\n"
            f"💰 *Premiação:*\n"
            f"• {faixa_desc}: {num_ganhadores} aposta(s) ganhadora(s) ({valor_ganhador})\n"
            f"• Acumulou? {acumulou_str}\n"
            f"• Próximo concurso: {next_draw_date} (Estimativa: {next_draw_estimate})\n\n"
            f"📲 *Acompanhe no canal Loterias Brasil*"
        )

        return message
