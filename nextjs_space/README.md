# Royal Farms Poultry Management System

A comprehensive livestock management system for Royal Farms Ltd, Nigeria.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **UI:** Tailwind CSS + ShadCN Components
- **Charts:** Recharts

## Features

- Multi-livestock support (Poultry, Cattle, Pigs, Fish, etc.)
- Egg collection tracking
- Mortality records
- Feed management
- Weight tracking & FCR analysis
- Financial reporting
- Inventory management
- Health & vaccination records
- Role-based access control

## Deployment to Railway

### Prerequisites

1. GitHub account
2. Railway account (railway.app)
3. Domain registered (royalfarms.app)

### Quick Deploy

1. Push this code to GitHub
2. Connect Railway to your GitHub repo
3. Add PostgreSQL database in Railway
4. Set environment variables
5. Deploy!

### Environment Variables

```env
DATABASE_URL=       # Auto-provided by Railway PostgreSQL
NEXTAUTH_SECRET=    # Generate: openssl rand -base64 32
NEXTAUTH_URL=       # https://royalfarms.app
```

## Default Admin Account

After deployment, run the seed script to create:
- **Email:** admin@royalfarms.com
- **Password:** RoyalFarms2026!

⚠️ **Change this password immediately after first login!**

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Production server
npx prisma studio    # Database browser
npx prisma db push   # Push schema changes
```

## License

Proprietary - Royal Farms Ltd © 2026
