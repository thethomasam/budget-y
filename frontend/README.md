# Budget Dashboard Frontend

A React-based budget tracking and financial management dashboard built with Vite, React 19, and Tailwind CSS.

## Features

- **Dashboard View**: Visual overview of financial metrics
  - KPI cards for key financial indicators
  - Category spending breakdown
  - Budget vs. actual progress tracking
  - Recent transactions list
  - Spending and savings trend charts
- **Transactions View**: Detailed transaction management interface
- **Responsive Design**: Built with Tailwind CSS for responsive layouts
- **Interactive Charts**: Powered by Recharts library

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Charting library for data visualization
- **React Icons** - Icon library

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create a production build:

```bash
npm run build
```

### Preview

Preview the production build locally:

```bash
npm run preview
```

### Lint

Run ESLint to check code quality:

```bash
npm run lint
```

## Project Structure

```
frontend/
├── public/           # Static assets
├── src/
│   ├── assets/      # Images, fonts, etc.
│   ├── components/  # React components
│   │   ├── ActivityCard.jsx
│   │   ├── BalanceCard.jsx
│   │   ├── BudgetProgressCard.jsx
│   │   ├── Card.jsx
│   │   ├── GoalsCard.jsx
│   │   ├── Header.jsx
│   │   ├── KPICards.jsx
│   │   ├── PaymentsCard.jsx
│   │   ├── RecentTransactionsCard.jsx
│   │   ├── RevenueCard.jsx
│   │   ├── SaleCard.jsx
│   │   ├── SavingsTrendCard.jsx
│   │   ├── SellsCard.jsx
│   │   ├── Sidebar.jsx
│   │   └── TransactionsView.jsx
│   ├── data/        # Sample data and data utilities
│   │   └── sampleData.js
│   ├── utils/       # Utility functions
│   ├── App.jsx      # Main application component
│   ├── App.css      # Application styles
│   ├── main.jsx     # Application entry point
│   └── index.css    # Global styles
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## Configuration

### Tailwind CSS

Tailwind is configured via [tailwind.config.js](tailwind.config.js). PostCSS processes the styles with the configuration in [postcss.config.js](postcss.config.js).

### Vite

Vite configuration is in [vite.config.js](vite.config.js). It uses the `@vitejs/plugin-react` plugin for React Fast Refresh.

## Development Notes

- The app uses React 19 with modern features
- Component state is managed with React hooks
- Sample data is provided in [src/data/sampleData.js](src/data/sampleData.js) for development
- ESLint is configured for code quality with React-specific rules
