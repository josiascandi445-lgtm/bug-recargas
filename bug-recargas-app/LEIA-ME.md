# Bug Shop Recargas — App Android

O site dentro de um app Android de verdade (Capacitor). O painel admin NÃO vai dentro do app.

## Gerar o APK (sem instalar nada no PC)

1. Cria um repositório novo no GitHub (pode ser privado).
2. Sobe TODO o conteúdo desta pasta para lá (inclusive a pasta oculta `.github`).
3. No GitHub abre o separador **Actions** → **Gerar APK** → **Run workflow**
   (também corre sozinho a cada push).
4. Espera uns 5–10 minutos. No fim, abre a execução e descarrega o ficheiro
   **bug-shop-recargas-apk** (vem em .zip, dentro está o .apk).
5. Passa o .apk para o telemóvel e instala (permite "instalar de fontes desconhecidas").

## IMPORTANTE — atualizar o site no Netlify (1 ficheiro)

Dentro do app o Nick é buscado pela função do Netlify, mas vindo de fora do site.
Substitui no teu projeto do site o ficheiro `netlify/functions/ff-nick.js`
pelo de `netlify-atualizar/ff-nick.js` e faz deploy. Sem isto, o "Ver Nick" falha no app.

## Atualizar o app quando mudares o site

O app leva uma cópia do site na pasta `www/`. Quando alterares o site,
copia os ficheiros novos para `www/` (sem admin) e faz push — o APK novo sai sozinho.

## Play Store

Este APK é de teste (debug). Para publicar precisas de uma conta Google Play
Developer e de um AAB assinado — pede-me e eu adiciono isso ao workflow.
