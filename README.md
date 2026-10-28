# 🧁 Precifica Artesanal

**Uma ferramenta para ajudar artesãos e pequenos produtores a calcular preços, organizar produtos e registrar vendas.**

O Precifica Artesanal é um projeto desenvolvido para facilitar a organização financeira de quem trabalha com produtos artesanais. A proposta é reunir, em um só lugar, o cálculo de preços, o catálogo de produtos e o histórico de vendas.

> Projeto de portfólio em desenvolvimento, criado para fins de aprendizado e demonstração.

## ✨ Funcionalidades

- 🧮 **Calculadora de preços:** considere materiais, custos extras, horas de trabalho, taxas e margem de lucro.
- 📦 **Catálogo de produtos:** cadastre e organize os produtos.
- 💰 **Registro de vendas:** registre vendas para acompanhar a movimentação do negócio.
- 📜 **Histórico:** consulte informações relacionadas aos produtos e às vendas.
- 👤 **Cadastro e login:** utilize um perfil individual com nickname e senha.
- 🔒 **Isolamento de perfis:** as operações no backend são vinculadas à conta autenticada.

As funcionalidades podem mudar conforme o projeto evolui.

## 🛠️ Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Python
- Flask
- SQLite

## 💻 Como executar no computador

### 1. Baixe o projeto

Você pode baixar o código-fonte de duas maneiras:

- **Pelo GitHub:** clique em `Code` e depois em `Download ZIP`.
- **Pelo Git:** execute no terminal:

```bash
git clone https://github.com/Patricker487/precifica-artesanal.git
```

Se baixou o ZIP, extraia os arquivos para uma pasta antes de continuar.

### 2. Instale o Python

Instale uma versão do Python compatível com as dependências do projeto. Durante a instalação no Windows, habilite a opção de adicionar o Python ao PATH, se disponível.

Confira a instalação no terminal:

```bash
python --version
```

### 3. Abra a pasta do projeto

Abra a pasta extraída ou clonada no VS Code e inicie um terminal nela.

### 4. Crie um ambiente virtual

```bash
python -m venv .venv
```

Ative o ambiente virtual no Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Se o PowerShell bloquear a ativação, você também pode usar o terminal CMD:

```bat
.venv\Scripts\activate.bat
```

### 5. Instale as dependências

```bash
python -m pip install -r requirements.txt
```

### 6. Inicie a aplicação

```bash
python app.py
```

Depois, abra o endereço abaixo no navegador:

http://127.0.0.1:5000

Para encerrar a aplicação, volte ao terminal e pressione `Ctrl + C`.

## 🗄️ Sobre o banco de dados

O projeto utiliza SQLite para armazenar informações localmente.

- O banco de dados pode ser criado ou atualizado pela aplicação, conforme a implementação atual.
- O arquivo `precifica.db` é excluído do repositório por segurança e para evitar publicar dados pessoais.
- Ao baixar o projeto, seus produtos e vendas não serão os mesmos da instalação de outra pessoa.
- Faça cópias de segurança do banco de dados quando houver informações importantes.

## 🔐 Segurança

O projeto possui autenticação por nickname e senha, com armazenamento de hashes de senha e verificação de sessão no backend.

Esta é uma aplicação de portfólio e não deve ser considerada pronta para uso comercial em produção. Antes de disponibilizá-la publicamente, é necessário revisar a configuração de segurança, as sessões, as permissões e a persistência do banco de dados.

## 🚧 Estado do projeto

O Precifica Artesanal continua em desenvolvimento. Novas melhorias podem ser adicionadas conforme o aprendizado e os testes.

## 👨‍💻 Autor

Desenvolvido por [Patricker487](https://github.com/Patricker487).

Se este projeto despertou seu interesse, fique à vontade para explorar o código-fonte e acompanhar sua evolução.
