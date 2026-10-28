
import sqlite3
from pathlib import Path

# Mantém o banco na pasta principal do projeto.
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "precifica.db"


def conectar():
    conexao = sqlite3.connect(DB_PATH)
    conexao.row_factory = sqlite3.Row
    conexao.execute("PRAGMA foreign_keys = ON")
    return conexao


def inicializar_banco():
    with conectar() as conexao:
        conexao.executescript("""
            CREATE TABLE IF NOT EXISTS empreendedores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nickname TEXT NOT NULL COLLATE NOCASE UNIQUE,
                senha_hash TEXT,
                criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS produtos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                empreendedor_id INTEGER NOT NULL,
                nome TEXT NOT NULL,
                descricao TEXT DEFAULT '',
                tipo TEXT NOT NULL
                    CHECK (tipo IN ('produto', 'servico')),
                preco_centavos INTEGER NOT NULL
                    CHECK (preco_centavos >= 0),
                custo_centavos INTEGER NOT NULL DEFAULT 0
                    CHECK (custo_centavos >= 0),
                ativo INTEGER NOT NULL DEFAULT 1
                    CHECK (ativo IN (0, 1)),
                criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (empreendedor_id)
                    REFERENCES empreendedores(id)
            );

            CREATE TABLE IF NOT EXISTS vendas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                empreendedor_id INTEGER NOT NULL,
                data_venda TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                total_centavos INTEGER NOT NULL
                    CHECK (total_centavos >= 0),
                observacao TEXT DEFAULT '',

                FOREIGN KEY (empreendedor_id)
                    REFERENCES empreendedores(id)
            );

            CREATE TABLE IF NOT EXISTS itens_venda (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                venda_id INTEGER NOT NULL,
                produto_id INTEGER,
                nome_item TEXT NOT NULL,
                quantidade INTEGER NOT NULL
                    CHECK (quantidade > 0),
                preco_unitario_centavos INTEGER NOT NULL
                    CHECK (preco_unitario_centavos >= 0),
                custo_unitario_centavos INTEGER NOT NULL DEFAULT 0
                    CHECK (custo_unitario_centavos >= 0),

                FOREIGN KEY (venda_id)
                    REFERENCES vendas(id),
                FOREIGN KEY (produto_id)
                    REFERENCES produtos(id)
                    ON DELETE SET NULL
            );

            CREATE INDEX IF NOT EXISTS idx_produtos_empreendedor
                ON produtos(empreendedor_id);

            CREATE INDEX IF NOT EXISTS idx_vendas_empreendedor_data
                ON vendas(empreendedor_id, data_venda);
        """)
        # Migração segura: adiciona a coluna de senha sem apagar os perfis existentes.
        colunas = [linha[1] for linha in conexao.execute("PRAGMA table_info(empreendedores)").fetchall()]
        if "senha_hash" not in colunas:
            conexao.execute("ALTER TABLE empreendedores ADD COLUMN senha_hash TEXT")


if __name__ == "__main__":
    inicializar_banco()
    print(f"Banco criado ou verificado em: {DB_PATH}")
