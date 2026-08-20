# 🛡️ Artemis

**Aplicativo de segurança pessoal feminina** com localização em tempo real, botão SOS, círculo de confiança e comunidade colaborativa.

## 📱 Sobre o projeto

Artemis é uma solução tecnológica que conecta mulheres a uma rede de confiança, permitindo acionar ajuda rapidamente em situações de perigo e compartilhar informações de segurança.

Desenvolvido como projeto acadêmico para a **FETIN 2026**.

## ✨ Funcionalidades

- 🆘 **Botão SOS** — aciona alerta com localização em tempo real
- 🗺️ **Mapa em tempo real** — acompanhe a localização do seu círculo
- 👥 **Círculo de confiança** — grupos e contatos individuais
- 💬 **Comunidade** — chat entre grupos e feed público por cidade
- 🔔 **Alertas** — receba avisos do seu círculo instantaneamente
- 📡 **Dispositivo Artemis Echo** — botão físico SOS via Bluetooth
- 🌙 **Modo escuro**
- 📍 **Histórico de rotas**
- 🔒 **Configurações de privacidade e segurança**

## 🛠️ Tecnologias

**Frontend**
- Next.js 16
- React 18
- TypeScript
- Tailwind CSS

**Backend**
- Firebase Authentication
- Firebase Firestore

**Mapas**
- Leaflet + OpenStreetMap

**App Mobile**
- Capacitor (Android)
- Background Geolocation

**Dispositivo IoT**
- ESP32-C3
- Bluetooth Low Energy (BLE)
- NimBLE

## 🚀 Como rodar

### Site (desenvolvimento)
```bash
npm install
npm run dev
```

### App Android
```bash
npm run build:app
npm run abrir:app
```

## 🌐 Deploy

Site disponível em: [artemis-reach.vercel.app](https://artemis-reach.vercel.app)

## 📂 Estrutura

app/
├── page.tsx # Login e cadastro
├── inicio/ # Tela inicial com SOS
├── mapa/ # Mapa em tempo real
├── circulo/ # Grupos e contatos
├── comunidade/ # Chat e feed
├── alertas/ # Alertas recebidos
├── dispositivo/ # Conexão Bluetooth
├── perfil/ # Perfil do usuário
└── configuracoes/ # Configurações

## 🔄 Como atualizar o projeto no GitHub

### Fluxo básico (salvar mudanças)

```bash
# 1. Adiciona todos os arquivos modificados
git add .

# 2. Cria um commit com uma descrição do que mudou
git commit -m "descrição da mudança"

# 3. Envia para o GitHub
git push origin main
```

### Trabalhando com branches

```bash
# Ver em qual branch você está
git branch

# Criar uma nova branch (ex: para testar algo)
git checkout -b nome-da-branch

# Mudar de branch
git checkout main

# Enviar uma branch para o GitHub
git push origin nome-da-branch
```

### Juntar uma branch com a main

```bash
# 1. Vai para a main
git checkout main

# 2. Junta a outra branch
git merge nome-da-branch

# 3. Envia para o GitHub
git push origin main
```

### Baixar atualizações do GitHub

```bash
# Baixa as mudanças mais recentes
git pull origin main
```

### Exemplos de mensagens de commit

```bash
git commit -m "adiciona modo escuro"
git commit -m "corrige bug no mapa"
git commit -m "atualiza tela de alertas"
git commit -m "feat: implementa chat individual"
git commit -m "fix: resolve erro de deploy no Vercel"
```

### Atualizar o app após mudanças

```bash
# Gera o app com as mudanças novas
npm run build:app

# Abre no Android Studio
npm run abrir:app
```

### Deploy do site

O deploy no Vercel é **automático**. Ao fazer `git push origin main`, o Vercel detecta e atualiza o site sozinho em alguns minutos.

```
git push origin main → Vercel faz deploy automático
```