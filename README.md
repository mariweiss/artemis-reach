# 📍 Ártemis Reach

App de segurança pessoal com localização em tempo real, círculo de contatos e comunidade.

---

## 🛠️ Tecnologias utilizadas

| Tecnologia | Descrição |
|---|---|
| **Next.js** | Framework React para o site |
| **React** | Biblioteca de interface |
| **Tailwind CSS** | Estilização |
| **Firebase** | Banco de dados e autenticação |
| **TypeScript** | Linguagem principal |

---

## ✅ Pré-requisitos

Antes de começar, instale na sua máquina (o que você não tiver):

| Ferramenta | Link |
|---|---|
| **Node.js** (versão LTS) | https://nodejs.org |
| **Git** | https://git-scm.com/download/win |
| **VS Code** | https://code.visualstudio.com |

---

## 📥 Como baixar o projeto

**1. Clone o repositório**

Abra o terminal e rode:

```bash
git clone https://github.com/mariweiss/artemis-reach.git
cd artemis-reach
```

**2. Instale as dependências**

```bash
npm install
```

**3. Configure as variáveis de ambiente**

Crie um arquivo chamado `.env.local` na raiz do projeto.

> ⚠️ **Importante:** Esse arquivo **não está no GitHub** por segurança. Peça as chaves para a Mariana pelo WhatsApp do grupo.

O arquivo deve ficar assim:

```
NEXT_PUBLIC_FIREBASE_API_KEY=sua-chave-aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=artemis-reach.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=artemis-reach
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=artemis-reach.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-id-aqui
NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id-aqui
NEXT_PUBLIC_GOOGLE_MAPS_KEY=sua-chave-aqui
```

**4. Rode o projeto**

```bash
npm run dev
```

Abra o navegador em **http://localhost:3000** 🚀

---

## 📁 Estrutura do projeto

```
artemis-reach/
├── app/
│   ├── firebase.js           → configuração do Firebase
│   ├── page.tsx              → página de login/cadastro
│   ├── inicio/
│   │   └── page.tsx          → botoes de acesso rapido
│   ├── comunidade/
│   │   └── page.tsx          → feed da comunidade
│   ├── circulo/
│   │   └── page.tsx          → círculo de contatos
│   └── mapa/
│   │   └── page.tsx          → mapa em tempo real
│   ├── alertas/
│   │   └── page.tsx          → notificacoes
├── .env.local                → credenciais (NÃO vai pro GitHub)
├── .gitignore
└── README.md
```

---

## 🗄️ Banco de dados (Firebase)

| Coleção | Descrição |
|---|---|
| `usuarios` | Cadastro e perfil dos usuários |
| `circulos` | Rede de contatos de cada usuário |
| `localizacoes` | Coordenadas GPS em tempo real |
| `rotas` | Histórico de trajetos frequentes |
| `posts` | Feed da comunidade |
| `respostas` | Comentários nos posts |
| `alertas_sos` | Alertas de emergência |
| `dispositivos` | Dispositivos GPS físicos vinculados |

---

## 📄 Páginas do site

| Rota | Descrição |
|---|---|
| `/` | Login e cadastro |
| `/inicio` | Bootões de acesso rápido |
| `/comunidade` | Feed de posts da comunidade |
| `/circulo` | Lista de contatos do círculo |
| `/mapa` | Mapa com localização em tempo real |
| `/benefícios e parceiros` | Feed de organizações parceiras |
| `/alertas` | Lista de notificações |

---

## 🔄 Como atualizar o projeto (dia a dia)

Sempre **antes de começar a trabalhar**, atualize o projeto:

```bash
git pull origin main
```

Depois de fazer alterações, suba para o GitHub:

```bash
git add .
git commit -m "descrição do que você fez"
git push origin main
```

## 📱 Acessar o site pelo celular (localhost)

Você pode testar o site no celular mesmo sem publicar, desde que o celular e o computador estejam na **mesma rede Wi-Fi**.

### Passo 1 — Descubra o IP do seu computador

No terminal do VS Code, rode:

```bash
ipconfig
```

Procure por **"Endereço IPv4"** — vai ser algo como: XXX.XXX.X.X

### Passo 2 — Rode o projeto

No terminal, rode normalmente:

```bash
npm run dev
```

Quando iniciar, vai aparecer:
- Local:    http://localhost:3000
- Network:  http://XXX.XXX.X.X:3000  ← esse é o endereço do celular

### Passo 3 — Acesse pelo celular

No navegador do celular (Chrome ou Safari), acesse: http://XXX.XXX.X.X:3000 

### Passo 4 — Libere o firewall (se não abrir)

Se o celular não conseguir acessar, o firewall do Windows pode estar bloqueando. Para liberar:
1. Pesquise "Firewall do Windows Defender" no menu iniciar
2. Clique em "Permitir um aplicativo pelo Firewall"
3. Clique em "Alterar configurações"
4. Procure "Node.js" na lista
5. Marque as caixas "Privado" e "Público"
6. Clique em OK

### ⚠️ Observações importantes

| Situação | Resultado |
|---|---|
| GPS no celular | Funciona com precisão total |
| GPS no computador | Usa Wi-Fi/IP, menos preciso |
| Envio de SMS (SOS) | Funciona apenas no celular |
| Sirene sonora | Funciona nos dois |
| Computador e celular na mesma rede | Obrigatório |

> 💡 O IP pode mudar toda vez que você reconectar ao Wi-Fi. Se parar de funcionar, rode `ipconfig` de novo para pegar o novo endereço.

---


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
