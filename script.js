
const form = document.querySelector("#form-calculadora");

const campos = {
    produto: document.querySelector("#produto"),
    materiais: document.querySelector("#materiais"),
    extras: document.querySelector("#extras"),
    horas: document.querySelector("#horas"),
    valorHora: document.querySelector("#valor-hora"),
    unidades: document.querySelector("#unidades"),
    taxas: document.querySelector("#taxas"),
    margem: document.querySelector("#margem")
};

const tela = {
    margemValor: document.querySelector("#margem-valor"),
    nome: document.querySelector("#nome-resultado"),
    preco: document.querySelector("#preco"),
    custoUnitario: document.querySelector("#custo-unitario"),
    lucroUnitario: document.querySelector("#lucro-unitario"),
    margemReal: document.querySelector("#margem-real"),
    custoLote: document.querySelector("#custo-lote"),
    resumo: document.querySelector("#resumo"),
    mensagem: document.querySelector("#mensagem")
};

const botaoLimpar = document.querySelector("#botao-limpar");
const botaoRestaurar = document.querySelector("#botao-restaurar");

// Valores iniciais para demonstração.
const valoresExemplo = {
    produto: "Bolo caseiro",
    materiais: "30",
    extras: "10",
    horas: "2",
    valorHora: "15",
    unidades: "1",
    taxas: "0",
    margem: "30"
};

// Formata valores como moeda brasileira.
function moeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// Realiza os cálculos da precificação.
function calcularPrecificacao(dados) {
    const custoMaoDeObra = dados.horas * dados.valorHora;

    const custoLote =
        dados.materiais + dados.extras + custoMaoDeObra;

    const custoUnitario = custoLote / dados.unidades;

    const percentualTaxas = dados.taxas / 100;
    const percentualMargem = dados.margem / 100;

    const divisor =
        1 - percentualTaxas - percentualMargem;

    if (divisor <= 0) {
        throw new Error(
            "A soma da margem e das taxas deve ser menor que 100%."
        );
    }

    const precoUnitario = custoUnitario / divisor;
    const valorTaxas = precoUnitario * percentualTaxas;

    const lucroUnitario =
        precoUnitario - custoUnitario - valorTaxas;

    // Evita divisão por zero quando o preço é zero.
    const margemReal = precoUnitario > 0
        ? (lucroUnitario / precoUnitario) * 100
        : 0;

    return {
        custoMaoDeObra,
        custoLote,
        custoUnitario,
        precoUnitario,
        valorTaxas,
        lucroUnitario,
        margemReal
    };
}

// Exibe uma mensagem de erro.
function mostrarErro(mensagem) {
    tela.mensagem.classList.remove("sucesso");
    tela.mensagem.textContent = mensagem;
}

// Limpa os valores apresentados no resultado.
function limparResultado() {
    tela.nome.textContent = "Seu produto";
    tela.preco.textContent = "—";
    tela.custoUnitario.textContent = "—";
    tela.lucroUnitario.textContent = "—";
    tela.margemReal.textContent = "—";
    tela.custoLote.textContent = "—";
    tela.resumo.textContent =
        "Preencha os campos para descobrir seu preço.";
}

// Atualiza o preço automaticamente.
function calcular() {
    tela.mensagem.textContent = "";
    tela.mensagem.classList.remove("sucesso");

    tela.margemValor.textContent =
        `${campos.margem.value || 0}%`;

    // Campos numéricos que precisam ser preenchidos.
    const entradas = [
        campos.materiais,
        campos.extras,
        campos.horas,
        campos.valorHora,
        campos.unidades,
        campos.taxas,
        campos.margem
    ];

    // Enquanto houver campos vazios, aguardamos o preenchimento.
    const incompleto = entradas.some(
        campo => campo.value.trim() === ""
    );

    if (incompleto) {
        limparResultado();
        return;
    }

    // Valida os limites definidos no HTML.
    for (const campo of entradas) {
        if (!campo.validity.valid) {
            limparResultado();
            mostrarErro(
                "Confira os valores: eles precisam respeitar os limites dos campos."
            );
            return;
        }
    }

    const dados = {
        materiais: Number(campos.materiais.value),
        extras: Number(campos.extras.value),
        horas: Number(campos.horas.value),
        valorHora: Number(campos.valorHora.value),
        unidades: Number(campos.unidades.value),
        taxas: Number(campos.taxas.value),
        margem: Number(campos.margem.value)
    };

    if (
        !Number.isInteger(dados.unidades) ||
        dados.unidades < 1
    ) {
        limparResultado();
        mostrarErro(
            "Informe um número inteiro de unidades, igual ou maior que 1."
        );
        return;
    }

    if (dados.margem + dados.taxas >= 100) {
        limparResultado();
        mostrarErro(
            "A soma da margem de lucro e das taxas deve ser menor que 100%."
        );
        return;
    }

    let resultado;

    try {
        resultado = calcularPrecificacao(dados);
    } catch (erro) {
        limparResultado();
        mostrarErro(erro.message);
        return;
    }

    // Atualiza o painel de resultado.
    tela.nome.textContent =
        campos.produto.value.trim() || "Seu produto";

    tela.preco.textContent =
        moeda(resultado.precoUnitario);

    tela.custoUnitario.textContent =
        moeda(resultado.custoUnitario);

    tela.lucroUnitario.textContent =
        moeda(resultado.lucroUnitario);

    tela.margemReal.textContent =
        resultado.margemReal.toFixed(1).replace(".", ",") + "%";

    tela.custoLote.textContent =
        moeda(resultado.custoLote);

    tela.resumo.textContent =
        `Custo do lote de ${dados.unidades} unidade(s): ` +
        `${moeda(resultado.custoLote)}.`;
}

// Limpa os campos e o resultado.
botaoLimpar.addEventListener("click", function () {
    for (const campo of Object.values(campos)) {
        campo.value = "";
    }

    // Mantém a margem no mínimo permitido pelo controle deslizante.
    campos.margem.value = "0";

    limparResultado();

    tela.margemValor.textContent = "0%";

    tela.mensagem.classList.remove("sucesso");
    tela.mensagem.textContent =
        "Campos limpos. Preencha os valores para calcular.";

    campos.produto.focus();
});

// Restaura os valores de demonstração.
botaoRestaurar.addEventListener("click", function () {
    for (const [chave, valor] of Object.entries(valoresExemplo)) {
        campos[chave].value = valor;
    }

    calcular();

    tela.mensagem.classList.add("sucesso");
    tela.mensagem.textContent =
        "Valores de exemplo restaurados.";
});

// Atualiza os cálculos quando qualquer campo muda.
form.addEventListener("input", calcular);

// Impede o recarregamento caso o formulário seja enviado pelo teclado.
form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    calcular();
});

// Testes automáticos dos cálculos.
function testarCalculos() {
    const testes = [
        {
            nome: "Custo total do primeiro lote",
            dados: {
                materiais: 30,
                extras: 10,
                horas: 2,
                valorHora: 15,
                unidades: 1,
                taxas: 0,
                margem: 30
            },
            campo: "custoLote",
            esperado: 70
        },
        {
            nome: "Preço com margem de 30%",
            dados: {
                materiais: 30,
                extras: 10,
                horas: 2,
                valorHora: 15,
                unidades: 1,
                taxas: 0,
                margem: 30
            },
            campo: "precoUnitario",
            esperado: 100
        },
        {
            nome: "Custo por unidade em lote de duas unidades",
            dados: {
                materiais: 30,
                extras: 10,
                horas: 2,
                valorHora: 15,
                unidades: 2,
                taxas: 10,
                margem: 30
            },
            campo: "custoUnitario",
            esperado: 35
        },
        {
            nome: "Preço com taxa de 10% e margem de 30%",
            dados: {
                materiais: 30,
                extras: 10,
                horas: 2,
                valorHora: 15,
                unidades: 2,
                taxas: 10,
                margem: 30
            },
            campo: "precoUnitario",
            esperado: 58.3333333333
        },
        {
            nome: "Margem real de 30%",
            dados: {
                materiais: 30,
                extras: 10,
                horas: 2,
                valorHora: 15,
                unidades: 2,
                taxas: 10,
                margem: 30
            },
            campo: "margemReal",
            esperado: 30
        },
        {
            nome: "Preço zero quando todos os custos são zero",
            dados: {
                materiais: 0,
                extras: 0,
                horas: 0,
                valorHora: 0,
                unidades: 1,
                taxas: 0,
                margem: 30
            },
            campo: "precoUnitario",
            esperado: 0
        }
    ];

    let aprovados = 0;

    for (const teste of testes) {
        const resultado = calcularPrecificacao(teste.dados);

        const passou =
            Math.abs(resultado[teste.campo] - teste.esperado) < 0.001;

        console.assert(passou, `Falhou: ${teste.nome}`);

        if (passou) {
            aprovados++;
        }
    }

    console.log(
        `Testes de precificação: ${aprovados}/${testes.length} aprovados.`
    );
}

testarCalculos();


// Painel lateral do histórico de vendas (usa a API Flask).
const botaoAbrirHistorico = document.querySelector("#abrir-historico");
const botaoFecharHistorico = document.querySelector("#fechar-historico");
const painelHistorico = document.querySelector("#painel-historico");
const sobreposicaoHistorico = document.querySelector("#historico-sobreposicao");
const formNickname = document.querySelector("#form-nickname");
const campoNickname = document.querySelector("#nickname-historico");
const mensagemHistorico = document.querySelector("#mensagem-historico");
const resumoHistorico = document.querySelector("#resumo-historico");
const listaHistorico = document.querySelector("#lista-historico");

function abrirPainelHistorico() {
    painelHistorico.classList.add("aberto");
    painelHistorico.setAttribute("aria-hidden", "false");
    botaoAbrirHistorico.setAttribute("aria-expanded", "true");
    sobreposicaoHistorico.hidden = false;
    document.body.classList.add("historico-aberto");
    campoNickname.focus();
}

function fecharPainelHistorico() {
    painelHistorico.classList.remove("aberto");
    painelHistorico.setAttribute("aria-hidden", "true");
    botaoAbrirHistorico.setAttribute("aria-expanded", "false");
    sobreposicaoHistorico.hidden = true;
    document.body.classList.remove("historico-aberto");
    botaoAbrirHistorico.focus();
}

botaoAbrirHistorico.addEventListener("click", abrirPainelHistorico);
botaoFecharHistorico.addEventListener("click", fecharPainelHistorico);
sobreposicaoHistorico.addEventListener("click", fecharPainelHistorico);

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && painelHistorico.classList.contains("aberto")) {
        fecharPainelHistorico();
    }
});

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}

function formatarData(dataTexto) {
    if (!dataTexto) return "Data não informada";
    // O SQLite salva o horário em formato ISO simples.
    const data = new Date(dataTexto.replace(" ", "T") + "Z");
    if (Number.isNaN(data.getTime())) return dataTexto;
    return data.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

async function carregarHistorico(nickname) {
    mensagemHistorico.textContent = "";
    resumoHistorico.hidden = true;
    resumoHistorico.innerHTML = "";
    listaHistorico.innerHTML = '<div class="historico-vazio">Carregando histórico...</div>';

    try {
        const resposta = await fetch(
            `/api/vendas/${encodeURIComponent(nickname)}`
        );
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Não foi possível consultar o histórico.");
        }

        const faturamento = dados.vendas.reduce(
            (total, venda) => total + venda.total_centavos, 0
        );

        resumoHistorico.innerHTML = `
            <span>Faturamento registrado</span>
            <strong>${moeda(faturamento / 100)}</strong>
            <small>${dados.total_vendas} venda(s) no histórico de ${escaparHTML(dados.nickname)}</small>
        `;
        resumoHistorico.hidden = false;

        if (dados.vendas.length === 0) {
            listaHistorico.innerHTML =
                '<div class="historico-vazio">Ainda não há vendas registradas para este nickname.</div>';
            return;
        }

        listaHistorico.innerHTML = dados.vendas.map(venda => {
            const itensHTML = venda.itens.map(item => `
                <li>${escaparHTML(item.quantidade)} × ${escaparHTML(item.nome_item)}
                    — ${moeda(item.preco_unitario_centavos / 100)} cada</li>
            `).join("");

            const observacaoHTML = venda.observacao
                ? `<p class="venda-observacao">${escaparHTML(venda.observacao)}</p>`
                : "";

            return `
                <article class="venda-cartao">
                    <div class="venda-cartao-topo">
                        <strong>Venda #${escaparHTML(venda.id)}</strong>
                        <time>${escaparHTML(formatarData(venda.data))}</time>
                    </div>
                    <div class="venda-total">${moeda(venda.total_centavos / 100)}</div>
                    <ul class="venda-itens">${itensHTML}</ul>
                    ${observacaoHTML}
                </article>
            `;
        }).join("");
    } catch (erro) {
        listaHistorico.innerHTML =
            '<div class="historico-vazio">Não foi possível carregar as vendas.</div>';
        mensagemHistorico.textContent =
            erro.message + " Confira se o servidor Flask está em execução.";
    }
}

formNickname.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nickname = campoNickname.value.trim();

    if (!nickname) {
        mensagemHistorico.textContent = "Digite seu nickname.";
        return;
    }

    await carregarHistorico(nickname);
});


// Painel lateral do catálogo de produtos e serviços.
const botaoAbrirCatalogo = document.querySelector("#abrir-catalogo");
const botaoFecharCatalogo = document.querySelector("#fechar-catalogo");
const painelCatalogo = document.querySelector("#painel-catalogo");
const formCatalogoNickname = document.querySelector("#form-catalogo-nickname");
const campoNicknameCatalogo = document.querySelector("#nickname-catalogo");
const mensagemCatalogo = document.querySelector("#mensagem-catalogo");
const formProduto = document.querySelector("#form-produto");
const listaCatalogo = document.querySelector("#lista-catalogo");
const totalCatalogo = document.querySelector("#total-catalogo");
const tituloFormProduto = document.querySelector("#titulo-form-produto");
const botaoSalvarProduto = document.querySelector("#botao-salvar-produto");
const botaoCancelarEdicaoProduto = document.querySelector("#cancelar-edicao-produto");
let nicknameCatalogoAtual = "";
let produtoEmEdicaoId = null;

function abrirPainelCatalogo() {
    fecharPainelHistorico();
    painelCatalogo.classList.add("aberto");
    painelCatalogo.setAttribute("aria-hidden", "false");
    botaoAbrirCatalogo.setAttribute("aria-expanded", "true");
    sobreposicaoHistorico.hidden = false;
    document.body.classList.add("historico-aberto");
    campoNicknameCatalogo.focus();
}

function fecharPainelCatalogo() {
    painelCatalogo.classList.remove("aberto");
    painelCatalogo.setAttribute("aria-hidden", "true");
    botaoAbrirCatalogo.setAttribute("aria-expanded", "false");
    if (!painelHistorico.classList.contains("aberto")) {
        sobreposicaoHistorico.hidden = true;
        document.body.classList.remove("historico-aberto");
    }
    botaoAbrirCatalogo.focus();
}

// Ajusta o fechamento para que a sobreposição continue ativa enquanto um painel está aberto.
const fecharHistoricoOriginal = fecharPainelHistorico;
fecharPainelHistorico = function () {
    painelHistorico.classList.remove("aberto");
    painelHistorico.setAttribute("aria-hidden", "true");
    botaoAbrirHistorico.setAttribute("aria-expanded", "false");
    if (!painelCatalogo.classList.contains("aberto")) {
        sobreposicaoHistorico.hidden = true;
        document.body.classList.remove("historico-aberto");
    }
};

botaoAbrirCatalogo.addEventListener("click", abrirPainelCatalogo);
botaoFecharCatalogo.addEventListener("click", fecharPainelCatalogo);

// Clique fora e Escape fecham qualquer painel lateral aberto.
sobreposicaoHistorico.addEventListener("click", () => {
    if (painelCatalogo.classList.contains("aberto")) fecharPainelCatalogo();
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && painelCatalogo.classList.contains("aberto")) {
        fecharPainelCatalogo();
    }
});

async function carregarCatalogo(nickname) {
    mensagemCatalogo.textContent = "";
    listaCatalogo.innerHTML = '<div class="historico-vazio">Carregando catálogo...</div>';
    try {
        const resposta = await fetch(`/api/produtos/${encodeURIComponent(nickname)}`);
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar o catálogo.");

        nicknameCatalogoAtual = dados.nickname;
        formProduto.hidden = false;
        totalCatalogo.textContent = `${dados.total} ${dados.total === 1 ? "item" : "itens"}`;

        if (!dados.produtos.length) {
            listaCatalogo.innerHTML = '<div class="historico-vazio">Nenhum item cadastrado ainda. Use o formulário acima para adicionar o primeiro.</div>';
            return;
        }

        listaCatalogo.innerHTML = dados.produtos.map(item => `
            <article class="produto-cartao">
                <div class="produto-cartao-topo">
                    <strong>${escaparHTML(item.nome)}</strong>
                    <span class="produto-tipo">${item.tipo === "servico" ? "Serviço" : "Produto"}</span>
                </div>
                ${item.descricao ? `<p>${escaparHTML(item.descricao)}</p>` : ""}
                <div class="produto-precos">
                    <span>Venda <strong>${moeda(item.preco_centavos / 100)}</strong></span>
                    <span>Custo <strong>${moeda(item.custo_centavos / 100)}</strong></span>
                </div>
                <div class="produto-acoes">
                    <button type="button" class="botao-item-editar" data-acao="editar" data-id="${item.id}">Editar</button>
                    <button type="button" class="botao-item-excluir" data-acao="excluir" data-id="${item.id}" data-nome="${escaparHTML(item.nome)}">Excluir</button>
                </div>
            </article>
        `).join("");
    } catch (erro) {
        formProduto.hidden = true;
        totalCatalogo.textContent = "0 itens";
        listaCatalogo.innerHTML = '<div class="historico-vazio">Não foi possível carregar o catálogo.</div>';
        mensagemCatalogo.textContent = erro.message + " Confira se o servidor Flask está em execução e se o nickname já foi cadastrado.";
    }
}

formCatalogoNickname.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nickname = campoNicknameCatalogo.value.trim();
    if (!nickname) {
        mensagemCatalogo.textContent = "Digite seu nickname.";
        return;
    }
    await carregarCatalogo(nickname);
});

formProduto.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (!nicknameCatalogoAtual) return;

    const preco = Number(document.querySelector("#produto-preco").value);
    const custo = Number(document.querySelector("#produto-custo").value);
    if (!Number.isFinite(preco) || !Number.isFinite(custo) || preco < 0 || custo < 0) {
        mensagemCatalogo.textContent = "Informe valores válidos para preço e custo.";
        return;
    }

    const dados = {
        nickname: nicknameCatalogoAtual,
        nome: document.querySelector("#produto-nome").value.trim(),
        descricao: document.querySelector("#produto-descricao").value.trim(),
        tipo: document.querySelector("#produto-tipo").value,
        preco_centavos: Math.round(preco * 100),
        custo_centavos: Math.round(custo * 100)
    };

    if (!dados.nome) {
        mensagemCatalogo.textContent = "Informe o nome do item.";
        return;
    }

    botaoSalvarProduto.disabled = true;
    const editando = produtoEmEdicaoId !== null;
    mensagemCatalogo.textContent = editando ? "Atualizando item..." : "Salvando item...";
    try {
        const resposta = await fetch(editando ? `/api/produtos/${produtoEmEdicaoId}` : "/api/produtos", {
            method: editando ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });
        const resultado = await resposta.json();
        if (!resposta.ok) throw new Error(resultado.erro || "Não foi possível salvar o item.");

        resetarFormularioProduto();
        await carregarCatalogo(nicknameCatalogoAtual);
        mensagemCatalogo.textContent = editando ? "Item atualizado com sucesso!" : "Item salvo no catálogo!";
    } catch (erro) {
        mensagemCatalogo.textContent = erro.message;
    } finally {
        botaoSalvarProduto.disabled = false;
    }
});

function resetarFormularioProduto() {
    produtoEmEdicaoId = null;
    formProduto.reset();
    document.querySelector("#produto-custo").value = "0";
    tituloFormProduto.textContent = "Novo item";
    botaoSalvarProduto.textContent = "Salvar no catálogo";
    botaoCancelarEdicaoProduto.hidden = true;
}

botaoCancelarEdicaoProduto.addEventListener("click", resetarFormularioProduto);

listaCatalogo.addEventListener("click", async (evento) => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao || !nicknameCatalogoAtual) return;

    const id = Number(botao.dataset.id);
    const acao = botao.dataset.acao;

    if (acao === "editar") {
        try {
            const resposta = await fetch(`/api/produtos/${encodeURIComponent(nicknameCatalogoAtual)}`);
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar o item.");
            const item = dados.produtos.find(produto => produto.id === id);
            if (!item) throw new Error("Esse item não está mais no catálogo.");

            produtoEmEdicaoId = item.id;
            document.querySelector("#produto-nome").value = item.nome;
            document.querySelector("#produto-descricao").value = item.descricao || "";
            document.querySelector("#produto-tipo").value = item.tipo;
            document.querySelector("#produto-preco").value = (item.preco_centavos / 100).toFixed(2);
            document.querySelector("#produto-custo").value = (item.custo_centavos / 100).toFixed(2);
            tituloFormProduto.textContent = "Editar item";
            botaoSalvarProduto.textContent = "Salvar alterações";
            botaoCancelarEdicaoProduto.hidden = false;
            document.querySelector("#produto-nome").focus();
            mensagemCatalogo.textContent = `Editando: ${item.nome}`;
        } catch (erro) {
            mensagemCatalogo.textContent = erro.message;
        }
        return;
    }

    if (acao === "excluir") {
        const nome = botao.dataset.nome || "este item";
        if (!window.confirm(`Deseja remover "${nome}" do catálogo? As vendas antigas serão preservadas.`)) return;
        botao.disabled = true;
        try {
            const resposta = await fetch(`/api/produtos/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname: nicknameCatalogoAtual })
            });
            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.erro || "Não foi possível excluir o item.");
            if (produtoEmEdicaoId === id) resetarFormularioProduto();
            await carregarCatalogo(nicknameCatalogoAtual);
            mensagemCatalogo.textContent = "Item removido do catálogo. As vendas anteriores foram preservadas.";
        } catch (erro) {
            mensagemCatalogo.textContent = erro.message;
            botao.disabled = false;
        }
    }
});


// Painel de registro de vendas usando os itens do catálogo.
const botaoAbrirVenda = document.querySelector("#abrir-venda");
const botaoFecharVenda = document.querySelector("#fechar-venda");
const painelVenda = document.querySelector("#painel-venda");
const formVendaNickname = document.querySelector("#form-venda-nickname");
const campoNicknameVenda = document.querySelector("#nickname-venda");
const mensagemVenda = document.querySelector("#mensagem-venda");
const formItensVenda = document.querySelector("#form-itens-venda");
const selectItemVenda = document.querySelector("#item-venda");
const campoQuantidadeVenda = document.querySelector("#quantidade-venda");
const carrinhoVenda = document.querySelector("#carrinho-venda");
const totalItensVenda = document.querySelector("#total-itens-venda");
const totalVenda = document.querySelector("#total-venda");
const botaoSalvarVenda = document.querySelector("#salvar-venda");
let nicknameVendaAtual = "";
let produtosVendaDisponiveis = [];
let itensCarrinhoVenda = [];

function abrirPainelVenda() {
    fecharPainelHistorico();
    fecharPainelCatalogo();
    painelVenda.classList.add("aberto");
    painelVenda.setAttribute("aria-hidden", "false");
    botaoAbrirVenda.setAttribute("aria-expanded", "true");
    sobreposicaoHistorico.hidden = false;
    document.body.classList.add("historico-aberto");
    campoNicknameVenda.focus();
}

function fecharPainelVenda() {
    painelVenda.classList.remove("aberto");
    painelVenda.setAttribute("aria-hidden", "true");
    botaoAbrirVenda.setAttribute("aria-expanded", "false");
    if (!painelHistorico.classList.contains("aberto") &&
        !painelCatalogo.classList.contains("aberto")) {
        sobreposicaoHistorico.hidden = true;
        document.body.classList.remove("historico-aberto");
    }
    botaoAbrirVenda.focus();
}

botaoAbrirVenda.addEventListener("click", abrirPainelVenda);
botaoFecharVenda.addEventListener("click", fecharPainelVenda);
sobreposicaoHistorico.addEventListener("click", () => {
    if (painelVenda.classList.contains("aberto")) fecharPainelVenda();
});
document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && painelVenda.classList.contains("aberto")) {
        fecharPainelVenda();
    }
});

formVendaNickname.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nickname = campoNicknameVenda.value.trim();
    mensagemVenda.textContent = "";
    if (!nickname) {
        mensagemVenda.textContent = "Digite seu nickname.";
        return;
    }

    mensagemVenda.textContent = "Carregando catálogo...";
    try {
        const resposta = await fetch(`/api/produtos/${encodeURIComponent(nickname)}`);
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar o catálogo.");

        nicknameVendaAtual = dados.nickname;
        produtosVendaDisponiveis = dados.produtos;
        itensCarrinhoVenda = [];
        desenharCarrinhoVenda();
        selectItemVenda.innerHTML = '<option value="">Selecione um produto ou serviço</option>' +
            produtosVendaDisponiveis.map(item =>
                `<option value="${item.id}">${escaparHTML(item.nome)} — ${moeda(item.preco_centavos / 100)}</option>`
            ).join("");
        formItensVenda.hidden = false;
        mensagemVenda.textContent = produtosVendaDisponiveis.length
            ? `Catálogo carregado: ${produtosVendaDisponiveis.length} item(ns).`
            : "Seu catálogo está vazio. Cadastre um item em Meu catálogo primeiro.";
        botaoSalvarVenda.disabled = produtosVendaDisponiveis.length === 0;
    } catch (erro) {
        nicknameVendaAtual = "";
        produtosVendaDisponiveis = [];
        itensCarrinhoVenda = [];
        formItensVenda.hidden = true;
        mensagemVenda.textContent = erro.message + " Confira se o nickname já foi cadastrado e se o Flask está em execução.";
    }
});

function desenharCarrinhoVenda() {
    const quantidadeTotal = itensCarrinhoVenda.reduce((total, item) => total + item.quantidade, 0);
    const soma = itensCarrinhoVenda.reduce((total, item) => total + item.preco_centavos * item.quantidade, 0);
    totalItensVenda.textContent = `${quantidadeTotal} ${quantidadeTotal === 1 ? "item" : "itens"}`;
    totalVenda.textContent = moeda(soma / 100);

    if (!itensCarrinhoVenda.length) {
        carrinhoVenda.innerHTML = '<div class="historico-vazio">Adicione itens para calcular o total.</div>';
        return;
    }

    carrinhoVenda.innerHTML = itensCarrinhoVenda.map((item, indice) => `
        <article class="item-carrinho-venda">
            <div>
                <strong>${escaparHTML(item.nome)}</strong>
                <small>${item.quantidade} × ${moeda(item.preco_centavos / 100)} = ${moeda(item.quantidade * item.preco_centavos / 100)}</small>
            </div>
            <button type="button" class="botao-remover-item" data-remover-item="${indice}" aria-label="Remover ${escaparHTML(item.nome)}">Remover</button>
        </article>
    `).join("");

    carrinhoVenda.querySelectorAll("[data-remover-item]").forEach(botao => {
        botao.addEventListener("click", () => {
            itensCarrinhoVenda.splice(Number(botao.dataset.removerItem), 1);
            desenharCarrinhoVenda();
        });
    });
}

formItensVenda.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const produtoId = Number(selectItemVenda.value);
    const quantidade = Number(campoQuantidadeVenda.value);
    const produto = produtosVendaDisponiveis.find(item => item.id === produtoId);
    if (!produto) {
        mensagemVenda.textContent = "Selecione um produto ou serviço.";
        return;
    }
    if (!Number.isInteger(quantidade) || quantidade < 1) {
        mensagemVenda.textContent = "A quantidade deve ser um número inteiro maior que zero.";
        return;
    }

    const itemExistente = itensCarrinhoVenda.find(item => item.produto_id === produto.id);
    if (itemExistente) {
        itemExistente.quantidade += quantidade;
    } else {
        itensCarrinhoVenda.push({
            produto_id: produto.id, nome: produto.nome,
            preco_centavos: produto.preco_centavos, quantidade
        });
    }
    mensagemVenda.textContent = "Item adicionado à venda.";
    campoQuantidadeVenda.value = "1";
    desenharCarrinhoVenda();
});

botaoSalvarVenda.addEventListener("click", async () => {
    if (!nicknameVendaAtual) {
        mensagemVenda.textContent = "Carregue seu catálogo pelo nickname primeiro.";
        return;
    }
    if (!itensCarrinhoVenda.length) {
        mensagemVenda.textContent = "Adicione pelo menos um item antes de registrar a venda.";
        return;
    }

    botaoSalvarVenda.disabled = true;
    mensagemVenda.textContent = "Registrando venda...";
    try {
        const resposta = await fetch("/api/vendas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nickname: nicknameVendaAtual,
                itens: itensCarrinhoVenda.map(item => ({
                    produto_id: item.produto_id, quantidade: item.quantidade
                })),
                observacao: document.querySelector("#observacao-venda").value.trim()
            })
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível registrar a venda.");

        mensagemVenda.textContent = `Venda #${dados.venda_id} registrada! Total: ${moeda(dados.total_centavos / 100)}.`;
        itensCarrinhoVenda = [];
        document.querySelector("#observacao-venda").value = "";
        desenharCarrinhoVenda();
    } catch (erro) {
        mensagemVenda.textContent = erro.message;
    } finally {
        botaoSalvarVenda.disabled = false;
    }
});


// Acesso com nickname + senha. A sessão é validada no backend em cada rota.
const formAcesso = document.querySelector("#form-acesso");
const campoNicknameAcesso = document.querySelector("#nickname-acesso");
const campoSenhaAcesso = document.querySelector("#senha-acesso");
const mensagemAcesso = document.querySelector("#mensagem-acesso");
const botaoAcessar = document.querySelector("#botao-acessar");
const botaoCriarPerfil = document.querySelector("#botao-criar-perfil");
const botaoSair = document.querySelector("#botao-sair");

function liberarAcesso(dados) {
    ["#nickname-historico", "#nickname-catalogo", "#nickname-venda"].forEach((seletor) => {
        const campo = document.querySelector(seletor);
        if (campo) {
            campo.value = dados.nickname;
            campo.readOnly = true;
            campo.setAttribute("aria-readonly", "true");
        }
    });
    mensagemAcesso.textContent = `Bem-vindo(a), ${dados.nickname}!`;
    mensagemAcesso.classList.add("sucesso");
    document.body.classList.add("autenticado");
    window.scrollTo(0, 0);
}

formAcesso.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensagemAcesso.textContent = "";
    mensagemAcesso.classList.remove("sucesso");
    botaoAcessar.disabled = true;
    botaoAcessar.textContent = "Entrando...";
    try {
        const resposta = await fetch("/api/login", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nickname: campoNicknameAcesso.value.trim(), senha: campoSenhaAcesso.value })
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível entrar.");
        liberarAcesso(dados);
    } catch (erro) {
        mensagemAcesso.textContent = erro.message || "Erro ao entrar. Verifique se o Flask está em execução.";
    } finally {
        botaoAcessar.disabled = false;
        botaoAcessar.textContent = "Entrar";
    }
});

botaoCriarPerfil.addEventListener("click", async () => {
    mensagemAcesso.textContent = "";
    mensagemAcesso.classList.remove("sucesso");
    botaoCriarPerfil.disabled = true;
    botaoCriarPerfil.textContent = "Criando...";
    botaoAcessar.disabled = true;
    try {
        const resposta = await fetch("/api/empreendedores", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nickname: campoNicknameAcesso.value.trim(), senha: campoSenhaAcesso.value })
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível criar o perfil.");
        liberarAcesso(dados);
    } catch (erro) {
        mensagemAcesso.textContent = erro.message || "Erro ao criar perfil.";
    } finally {
        botaoCriarPerfil.disabled = false;
        botaoCriarPerfil.textContent = "Criar perfil";
        botaoAcessar.disabled = false;
    }
});

botaoSair.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    document.body.classList.remove("autenticado");
    campoSenhaAcesso.value = "";
    mensagemAcesso.textContent = "Você saiu da conta.";
    window.scrollTo(0, 0);
});

// Se a sessão ainda estiver ativa ao atualizar a página, reutiliza o login do servidor.
(async () => {
    try {
        const resposta = await fetch("/api/sessao");
        const dados = await resposta.json();
        if (dados.autenticado) liberarAcesso(dados);
    } catch (_) { /* O usuário ainda pode entrar manualmente. */ }
})();
