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

