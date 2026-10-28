# Precifica Artesanal

Aplicação local para precificação, catálogo e registro de vendas.

## Executar no Windows

1. Faça uma cópia de segurança de `precifica.db` antes de atualizar arquivos.
2. Instale as dependências: `pip install -r requirements.txt`.
3. Execute: `python app.py`.
4. Abra `http://127.0.0.1:5000`.

## Acesso e privacidade

- Cadastro e login usam nickname exclusivo e senha com pelo menos 8 caracteres.
- As senhas são armazenadas como hash, nunca em texto puro.
- O Flask cria uma sessão e verifica a identidade no backend em todas as rotas de catálogo e vendas.
- O servidor rejeita requisições que tentem usar outro nickname, e as consultas continuam limitadas ao ID do perfil.
- O botão Sair encerra a sessão.
- Perfis antigos sem senha preservam seus dados; no primeiro login, a senha digitada é gravada como senha inicial. Faça isso apenas no ambiente local e configure a senha de cada perfil antigo com cuidado.

Este projeto está preparado para uso local e demonstração. Antes de publicar na internet, configure `PRECIFICA_SECRET_KEY` com um valor aleatório secreto, use HTTPS e defina `SESSION_COOKIE_SECURE=True`.

