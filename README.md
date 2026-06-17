# Easy Cash - Financial Management Application

A modern web application for managing finances with React, Node.js, Express, and MySQL.

## Features

- User authentication and authorization
- Financial transaction tracking
- Dashboard with analytics
- Responsive UI with Tailwind CSS
- Real-time data updates

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS
- **Backend**: Express.js, tRPC
- **Database**: MySQL with Drizzle ORM
- **Deployment**: Render.com

## Local Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- MySQL 8.0+

### Installation

1. Clone the repository
```bash
git clone https://github.com/easy-cash-project/easy-cash.git
cd easy-cash
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up database
```bash
pnpm db:push
```

5. Start development server
```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

## Production Deployment

### Deploy to Render.com

1. Push your code to GitHub
2. Connect your GitHub repository to Render
3. Render will automatically detect `render.yaml` and deploy
4. Configure environment variables in Render dashboard
5. Your app will be available at `https://easy-cash.onrender.com`

### Connect Custom Domain

1. In Render dashboard, go to your service settings
2. Add custom domain: `easycash.club`
3. Update DNS records at Porkbun to point to Render

## Environment Variables

See `.env.example` for all required environment variables.

## Build

```bash
pnpm build
```

## Start Production Server

```bash
pnpm start
```

## License

MIT
