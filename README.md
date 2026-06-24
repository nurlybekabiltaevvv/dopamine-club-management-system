
# 🚀 Next.js + PostgreSQL + Drizzle ORM Template

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green)](https://orm.drizzle.team/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Production-ready fullstack template built with modern technologies and best practices.



## 🧱 Tech Stack

- ⚡ Next.js 16 (App Router)
- ⚛️ React 19
- 🔐 TypeScript
- 🗄 PostgreSQL
- 🧩 Drizzle ORM
- 🎨 TailwindCSS v4
- 🧹 ESLint



## 🏗 Architecture Overview

Client (React / Next.js App Router)  
↓  
API Routes / Server Actions  
↓  
Drizzle ORM  
↓  
PostgreSQL  



## 🗂 Project Structure


.
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   └── page.tsx
├── db/                   # Database layer
│   ├── schema.ts
│   └── index.ts
├── public/               # Static assets
├── drizzle.config.ts
├── tailwind.config.ts
├── next.config.ts
└── .env.local



## 🧬 Example ER Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string name
        string email
        timestamp created_at
    }

    POSTS {
        uuid id PK
        uuid user_id FK
        string title
        text content
        timestamp created_at
    }

    USERS ||--o{ POSTS : creates
```



# 🚀 Getting Started

## 1️⃣ Clone repository

```bash
git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name
```



## 2️⃣ Install dependencies

Requirements:

- Node.js 18+
- PostgreSQL 14+
- npm / pnpm / yarn

Check Node version:

```bash
node -v
```

Install packages:

```bash
npm install
```

---



## 3️⃣ Setup Environment Variables

Create a file in the root directory:

```
.env.local
```

Add:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Example:

```env
DATABASE_URL=postgresql://postgres:123456@localhost:5432/mydb
```

Make sure PostgreSQL is running.



## 4️⃣ Setup Database (Drizzle)

Generate migrations:

```bash
npx drizzle-kit generate
```

Push schema to database:

```bash
npx drizzle-kit push
```



## 5️⃣ Run Development Server

```bash
npm run dev
```

Application will be available at:

```
http://localhost:3000
```



# 🛠 Available Scripts

Start development:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Start production server:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

Type check:

```bash
npm run typecheck
```



# 🐳 Docker Setup (Optional)

Dockerfile:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

docker-compose.yml:

```yaml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
    depends_on:
      - db

  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports:
      - "5432:5432"
```

Run:

```bash
docker-compose up --build
```



# 🚀 Deployment

Recommended: Vercel

1. Push project to GitHub
2. Go to https://vercel.com
3. Import repository
4. Add Environment Variable:

DATABASE_URL=your_production_database_url

5. Deploy



## 🗄 Recommended Database Hosting

- Neon (recommended)
- Railway
- Supabase
- Render



## 📄 License

MIT License © 2026
