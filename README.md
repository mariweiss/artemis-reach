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

Antes de começar, instale na sua máquina:

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
│   ├── comunidade/
│   │   └── page.tsx          → feed da comunidade
│   ├── circulo/
│   │   └── page.tsx          → círculo de contatos
│   └── mapa/
│       └── page.tsx          → mapa em tempo real
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
| `/comunidade` | Feed de posts da comunidade |
| `/circulo` | Lista de contatos do círculo |
| `/mapa` | Mapa com localização em tempo real |

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
