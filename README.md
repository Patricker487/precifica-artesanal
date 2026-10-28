# Precifica Artesanal

Aplicação local para precificação, catálogo e registro de vendas.

## Acesso e privacidade

- Cadastro e login usam nickname exclusivo e senha com pelo menos 8 caracteres.
- As senhas são armazenadas como hash, nunca em texto puro.
- O Flask cria uma sessão e verifica a identidade no backend em todas as rotas de catálogo e vendas.
- O servidor rejeita requisições que tentem usar outro nickname, e as consultas continuam limitadas ao ID do perfil.
- O botão Sair encerra a sessão.

