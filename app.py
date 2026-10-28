
from flask import Flask, jsonify, request, send_from_directory, session
from database import conectar, inicializar_banco
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os

app = Flask(__name__)
app.secret_key = os.environ.get("PRECIFICA_SECRET_KEY", "troque-esta-chave-local-antes-de-publicar-precifica")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False  # True quando hospedado com HTTPS

inicializar_banco()


def exigir_login(funcao):
    @wraps(funcao)
    def wrapper(*args, **kwargs):
        if not session.get("empreendedor_id") or not session.get("nickname"):
            return jsonify({"erro": "Faça login para continuar."}), 401
        # Impede que uma requisição altere o nickname para consultar dados alheios.
        nickname_requisicao = kwargs.get("nickname")
        if nickname_requisicao is None:
            dados = request.get_json(silent=True) or {}
            nickname_requisicao = dados.get("nickname")
        if nickname_requisicao and str(nickname_requisicao).strip().casefold() != session["nickname"].casefold():
            return jsonify({"erro": "Acesso negado: este perfil não pertence à sessão atual."}), 403
        return funcao(*args, **kwargs)
    return wrapper



# Entrega a interface pelo próprio Flask para que o site e a API
# funcionem na mesma origem, sem precisar do Live Server.
@app.route("/")
def pagina_inicial():
    return send_from_directory(app.root_path, "index.html")


@app.route("/style.css")
def arquivo_css():
    return send_from_directory(app.root_path, "style.css")


@app.route("/script.js")
def arquivo_javascript():
    return send_from_directory(app.root_path, "script.js")


@app.route("/api/status", methods=["GET"])
def status():
    return jsonify({
        "projeto": "Precifica",
        "status": "online",
        "mensagem": "Backend e banco de dados conectados!"
    })


@app.route("/api/login", methods=["POST"])
def login():
    dados = request.get_json(silent=True) or {}
    nickname = dados.get("nickname", "")
    senha = dados.get("senha", "")
    if not isinstance(nickname, str) or not isinstance(senha, str):
        return jsonify({"erro": "Informe nickname e senha válidos."}), 400
    nickname = nickname.strip()
    if not nickname or len(nickname) > 30 or not senha:
        return jsonify({"erro": "Informe seu nickname e senha."}), 400
    with conectar() as conexao:
        usuario = conexao.execute("SELECT id, nickname, senha_hash FROM empreendedores WHERE nickname = ?", (nickname,)).fetchone()
        if not usuario:
            return jsonify({"erro": "Nickname ou senha incorretos."}), 401
        # Compatibilidade com perfis antigos: primeiro acesso define a senha.
        if not usuario["senha_hash"]:
            conexao.execute("UPDATE empreendedores SET senha_hash = ? WHERE id = ? AND senha_hash IS NULL", (generate_password_hash(senha), usuario["id"]))
        elif not check_password_hash(usuario["senha_hash"], senha):
            return jsonify({"erro": "Nickname ou senha incorretos."}), 401
        session.clear()
        session["empreendedor_id"] = usuario["id"]
        session["nickname"] = usuario["nickname"]
        return jsonify({"id": usuario["id"], "nickname": usuario["nickname"], "mensagem": "Login realizado."})


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"mensagem": "Você saiu da conta."})


@app.route("/api/sessao", methods=["GET"])
def sessao_atual():
    if not session.get("empreendedor_id"):
        return jsonify({"autenticado": False})
    return jsonify({"autenticado": True, "id": session["empreendedor_id"], "nickname": session["nickname"]})


@app.route("/api/empreendedores", methods=["POST"])
def criar_empreendedor():
    dados = request.get_json(silent=True) or {}
    nickname, senha = dados.get("nickname", ""), dados.get("senha", "")
    if not isinstance(nickname, str) or not isinstance(senha, str):
        return jsonify({"erro": "Nickname e senha são obrigatórios."}), 400
    nickname = nickname.strip()
    if len(nickname) < 3 or len(nickname) > 30:
        return jsonify({"erro": "O nickname deve ter entre 3 e 30 caracteres."}), 400
    if len(senha) < 8:
        return jsonify({"erro": "A senha precisa ter pelo menos 8 caracteres."}), 400
    try:
        with conectar() as conexao:
            cursor = conexao.execute("INSERT INTO empreendedores (nickname, senha_hash) VALUES (?, ?)", (nickname, generate_password_hash(senha)))
            usuario_id = cursor.lastrowid
    except Exception as erro:
        if "UNIQUE" in str(erro).upper():
            return jsonify({"erro": "Esse nickname já está cadastrado. Escolha outro."}), 409
        raise
    session.clear()
    session["empreendedor_id"] = usuario_id
    session["nickname"] = nickname
    return jsonify({"id": usuario_id, "nickname": nickname, "mensagem": "Perfil criado com sucesso."}), 201


@app.route("/api/produtos", methods=["POST"])
@exigir_login
def criar_produto():
    dados = request.get_json(silent=True) or {}

    nickname = dados.get("nickname", "")
    nome = dados.get("nome", "")
    descricao = dados.get("descricao", "")
    tipo = dados.get("tipo", "")
    preco = dados.get("preco_centavos")
    custo = dados.get("custo_centavos", 0)

    if not all(isinstance(valor, str) for valor in
               [nickname, nome, descricao, tipo]):
        return jsonify({"erro": "Os campos de texto são inválidos."}), 400

    nickname = nickname.strip()
    nome = nome.strip()
    descricao = descricao.strip()
    tipo = tipo.strip().lower()

    if not nickname or not nome:
        return jsonify({
            "erro": "Nickname e nome do item são obrigatórios."
        }), 400

    if tipo not in ("produto", "servico"):
        return jsonify({
            "erro": "O tipo deve ser produto ou servico."
        }), 400

    # Os preços são enviados em centavos, como números inteiros.
    if type(preco) is not int or type(custo) is not int:
        return jsonify({
            "erro": "Preço e custo devem ser números inteiros em centavos."
        }), 400

    if preco < 0 or custo < 0:
        return jsonify({
            "erro": "Preço e custo não podem ser negativos."
        }), 400

    with conectar() as conexao:
        empreendedor = conexao.execute(
            """
            SELECT id FROM empreendedores
            WHERE nickname = ?
            """,
            (nickname,)
        ).fetchone()

        if not empreendedor:
            return jsonify({
                "erro": "Nickname não encontrado. Cadastre o empreendedor primeiro."
            }), 404

        cursor = conexao.execute(
            """
            INSERT INTO produtos (
                empreendedor_id, nome, descricao, tipo,
                preco_centavos, custo_centavos
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                empreendedor["id"], nome, descricao, tipo,
                preco, custo
            )
        )

        return jsonify({
            "id": cursor.lastrowid,
            "nome": nome,
            "tipo": tipo,
            "preco_centavos": preco,
            "custo_centavos": custo,
            "mensagem": "Item cadastrado com sucesso!"
        }), 201


@app.route("/api/produtos/<nickname>", methods=["GET"])
@exigir_login
def listar_produtos(nickname):
    # Nunca confia no nickname da URL: usa exclusivamente a conta autenticada.
    usuario_id = session["empreendedor_id"]
    nickname_sessao = session["nickname"]

    with conectar() as conexao:
        produtos = conexao.execute(
            """
            SELECT id, nome, descricao, tipo,
                   preco_centavos, custo_centavos
            FROM produtos
            WHERE empreendedor_id = ? AND ativo = 1
            ORDER BY nome COLLATE NOCASE
            """,
            (usuario_id,)
        ).fetchall()

        return jsonify({
            "nickname": nickname_sessao,
            "total": len(produtos),
            "produtos": [dict(produto) for produto in produtos]
        })

@app.route("/api/produtos/<int:produto_id>", methods=["PUT"])
@exigir_login
def editar_produto(produto_id):
    dados = request.get_json(silent=True) or {}
    nickname = dados.get("nickname", "")
    nome = dados.get("nome", "")
    descricao = dados.get("descricao", "")
    tipo = dados.get("tipo", "")
    preco = dados.get("preco_centavos")
    custo = dados.get("custo_centavos", 0)

    if not all(isinstance(valor, str) for valor in [nickname, nome, descricao, tipo]):
        return jsonify({"erro": "Os campos de texto são inválidos."}), 400

    nickname, nome = nickname.strip(), nome.strip()
    descricao, tipo = descricao.strip(), tipo.strip().lower()
    if not nickname or not nome:
        return jsonify({"erro": "Nickname e nome do item são obrigatórios."}), 400
    if tipo not in ("produto", "servico"):
        return jsonify({"erro": "O tipo deve ser produto ou servico."}), 400
    if type(preco) is not int or type(custo) is not int or preco < 0 or custo < 0:
        return jsonify({"erro": "Preço e custo devem ser inteiros em centavos, iguais ou maiores que zero."}), 400

    with conectar() as conexao:
        empreendedor = conexao.execute(
            "SELECT id FROM empreendedores WHERE nickname = ?", (nickname,)
        ).fetchone()
        if not empreendedor:
            return jsonify({"erro": "Nickname não encontrado."}), 404

        cursor = conexao.execute(
            """UPDATE produtos
               SET nome = ?, descricao = ?, tipo = ?, preco_centavos = ?, custo_centavos = ?
               WHERE id = ? AND empreendedor_id = ? AND ativo = 1""",
            (nome, descricao, tipo, preco, custo, produto_id, empreendedor["id"])
        )
        if cursor.rowcount == 0:
            return jsonify({"erro": "Item não encontrado no catálogo deste nickname."}), 404

    return jsonify({"mensagem": "Item atualizado com sucesso!", "id": produto_id})


@app.route("/api/produtos/<int:produto_id>", methods=["DELETE"])
@exigir_login
def excluir_produto(produto_id):
    dados = request.get_json(silent=True) or {}
    nickname = dados.get("nickname", "")
    if not isinstance(nickname, str) or not nickname.strip():
        return jsonify({"erro": "Informe o nickname."}), 400

    with conectar() as conexao:
        empreendedor = conexao.execute(
            "SELECT id FROM empreendedores WHERE nickname = ?", (nickname.strip(),)
        ).fetchone()
        if not empreendedor:
            return jsonify({"erro": "Nickname não encontrado."}), 404

        # Exclusão lógica: mantém os registros antigos de vendas intactos.
        cursor = conexao.execute(
            "UPDATE produtos SET ativo = 0 WHERE id = ? AND empreendedor_id = ? AND ativo = 1",
            (produto_id, empreendedor["id"])
        )
        if cursor.rowcount == 0:
            return jsonify({"erro": "Item não encontrado no catálogo deste nickname."}), 404

    return jsonify({"mensagem": "Item removido do catálogo."})


@app.route("/api/vendas", methods=["POST"])
@exigir_login
def criar_venda():
    dados = request.get_json(silent=True) or {}

    nickname = dados.get("nickname", "")
    itens = dados.get("itens", [])
    observacao = dados.get("observacao", "")

    if not isinstance(nickname, str) or not nickname.strip():
        return jsonify({"erro": "Informe o nickname."}), 400

    if not isinstance(itens, list) or not itens:
        return jsonify({"erro": "Adicione pelo menos um item à venda."}), 400

    if not isinstance(observacao, str):
        return jsonify({"erro": "Observação inválida."}), 400

    nickname = nickname.strip()
    total_centavos = 0

    with conectar() as conexao:
        empreendedor = conexao.execute(
            "SELECT id FROM empreendedores WHERE nickname = ?",
            (nickname,)
        ).fetchone()

        if not empreendedor:
            return jsonify({"erro": "Nickname não encontrado."}), 404

        # Validamos todos os itens antes de salvar a venda.
        itens_validados = []

        for item in itens:
            if not isinstance(item, dict):
                return jsonify({"erro": "Item de venda inválido."}), 400

            produto_id = item.get("produto_id")
            quantidade = item.get("quantidade")

            if type(produto_id) is not int or type(quantidade) is not int:
                return jsonify({
                    "erro": "Produto e quantidade devem ser números inteiros."
                }), 400

            if produto_id <= 0 or quantidade <= 0:
                return jsonify({
                    "erro": "Produto e quantidade devem ser positivos."
                }), 400

            produto = conexao.execute(
                """
                SELECT id, nome, preco_centavos, custo_centavos
                FROM produtos
                WHERE id = ? AND empreendedor_id = ? AND ativo = 1
                """,
                (produto_id, empreendedor["id"])
            ).fetchone()

            if not produto:
                return jsonify({
                    "erro": f"Produto {produto_id} não encontrado no catálogo."
                }), 400

            subtotal = produto["preco_centavos"] * quantidade
            total_centavos += subtotal

            itens_validados.append({
                "produto_id": produto["id"],
                "nome": produto["nome"],
                "quantidade": quantidade,
                "preco": produto["preco_centavos"],
                "custo": produto["custo_centavos"]
            })

        cursor = conexao.execute(
            """
            INSERT INTO vendas (empreendedor_id, total_centavos, observacao)
            VALUES (?, ?, ?)
            """,
            (empreendedor["id"], total_centavos, observacao.strip())
        )

        venda_id = cursor.lastrowid

        for item in itens_validados:
            conexao.execute(
                """
                INSERT INTO itens_venda (
                    venda_id, produto_id, nome_item, quantidade,
                    preco_unitario_centavos, custo_unitario_centavos
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    venda_id,
                    item["produto_id"],
                    item["nome"],
                    item["quantidade"],
                    item["preco"],
                    item["custo"]
                )
            )

        return jsonify({
            "mensagem": "Venda registrada com sucesso!",
            "venda_id": venda_id,
            "total_centavos": total_centavos
        }), 201


@app.route("/api/vendas/<nickname>", methods=["GET"])
@exigir_login
def listar_vendas(nickname):
    # O histórico também é filtrado pelo ID autenticado, não pelo texto da URL.
    usuario_id = session["empreendedor_id"]
    nickname_sessao = session["nickname"]

    with conectar() as conexao:
        vendas = conexao.execute(
            """
            SELECT id, data_venda, total_centavos, observacao
            FROM vendas
            WHERE empreendedor_id = ?
            ORDER BY data_venda DESC, id DESC
            """,
            (usuario_id,)
        ).fetchall()

        resultado = []
        for venda in vendas:
            itens = conexao.execute(
                """
                SELECT nome_item, quantidade,
                       preco_unitario_centavos, custo_unitario_centavos
                FROM itens_venda
                WHERE venda_id = ?
                ORDER BY id
                """,
                (venda["id"],)
            ).fetchall()
            resultado.append({
                "id": venda["id"],
                "data": venda["data_venda"],
                "total_centavos": venda["total_centavos"],
                "observacao": venda["observacao"],
                "itens": [dict(item) for item in itens]
            })

        return jsonify({
            "nickname": nickname_sessao,
            "total_vendas": len(resultado),
            "vendas": resultado
        })

if __name__ == "__main__":
    app.run(debug=False)
