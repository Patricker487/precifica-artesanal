
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
