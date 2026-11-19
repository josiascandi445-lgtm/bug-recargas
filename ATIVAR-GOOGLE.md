# Ativar "Continuar com Google" (opcional)

O app já tem o código do botão. Ele só aparece quando o plugin do Google estiver instalado.
Não consegui testar este passo aqui (precisa da tua conta Firebase), por isso faz com calma e, se o build falhar,
envia-me o erro do GitHub Actions.

## 1. Firebase
1. Console do Firebase → Configurações do projeto → "Adicionar app" → Android.
   - Nome do pacote: `com.bugshop.recargas`
   - Certificado SHA-1: `4F:FC:F7:23:3F:11:EF:5A:7E:7D:5C:4B:DD:AD:BD:EB:02:2A:C4:5E`
   - (adiciona também o SHA-256: `3A:11:36:FE:E3:55:90:32:97:45:AC:C7:97:C3:8B:C0:C9:55:3A:F1:4B:8A:17:BC:65:C5:D2:B6:00:2D:7D:31`)
2. Descarrega o `google-services.json` e coloca-o na RAIZ do repositório (ao lado do package.json).
3. Authentication → Método de início de sessão → Google → Ativar (escolhe o e-mail de suporte) → Guardar.

Estes SHA são da chave fixa que vai em `signing/debug.keystore` (o workflow já a usa).

## 2. No repositório
1. `package.json` → em "dependencies" acrescenta:
   `"@capacitor-firebase/authentication": "^8.0.0"`
2. `capacitor.config.json` → dentro de "plugins" acrescenta:
   `"FirebaseAuthentication": { "skipNativeAuth": true, "providers": ["google.com"] }`
3. Faz push e gera o APK. O workflow copia o google-services.json sozinho.

Quando o plugin estiver no APK, o botão "Continuar com Google" aparece no ecrã de entrada.
