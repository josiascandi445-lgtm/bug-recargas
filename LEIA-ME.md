# Bug Shop Recargas — App Android (versão 3.0)

## Novidades da v3
- Conta de cliente: criar conta / entrar com e-mail e senha (recuperar senha incluído)
- Ecrã "Quase lá": ID do Free Fire (com busca de Nick), Nick, foto de perfil e foto de capa
- Perfil profissional com nível, barra de progresso, selo (prateado no Boss, verificado verde no VIP)
- Níveis: Iniciante (1.000), Flexível (3.000), Boss (5.000), VIP (8.000) — caixa de benefícios no perfil
- Botão Coletar → pedido chega ao painel admin → "aguarda 24h" → "Recarga feita com sucesso ✅"
- Notificações (sino): presentes de pontos do admin (com botão Coletar), recompensas e avisos
- Barra de cima com foto, nome, nível e pontos
- Pontos por compra: 200 (abaixo de 1.000 Kz) / 250 (a partir de 1.000 Kz), creditados quando o pedido é Concluído
- Pedidos com estado e pontos; botão Repetir
- Conta suspensa (24h ou permanente) mostra um ecrã próprio
- Produtos reorganizados: cartões alinhados, textos com tamanho certo

## ORDEM CERTA (importante!)
1. Primeiro faz o passo do FIREBASE do ficheiro LEIA-ME-ADMIN.md (site/painel): regras + documento "admins".
   Sem as regras novas o app não consegue guardar o perfil.
2. Depois sobe esta pasta para o GitHub (por cima) e gera o APK (Actions → Gerar APK → Run workflow).

## ATENÇÃO: desinstala a versão antiga UMA vez
Esta versão passa a usar uma chave de assinatura fixa (signing/debug.keystore). A partir de agora cada APK novo
instala por cima do anterior, mas o primeiro precisa de desinstalar o app antigo do telemóvel.

## Atualizar no GitHub
Envia por cima: `package.json`, `www/`, `signing/` e `.github/` (a pasta oculta). Pode apagar `www/css/native.css` se ainda existir.

## Login com Google
Veja ATIVAR-GOOGLE.md (precisa de configuração no Firebase; o botão só aparece quando estiver ativo).

## Como mexer
- Níveis, pontos e recompensas: `www/js/levels.js` (manter igual ao do painel e às regras do Firestore)
- Preços/produtos: `www/js/data/products.js`
- Temas: `www/css/app.css` e `www/js/theme.js`
