# CareTaker Self Service

A comprehensive self-service web application for Israeli families to document and generate payslips for their elder's caretaker.

## Features

- **Secure Authentication**: Login system per family with session management
- **Bilingual Support**: Full English and Hebrew language support with easy language switching
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Data Persistence**: All data stored locally in browser (localStorage)
- **Excel Export**: Export data to Excel files for record keeping

## Main Sections

1. **Dashboard**: Overview with calendar, open tasks, and quick actions
2. **Elder Financials**: Track monthly payments to the elder
3. **Elder Expenses**: Track monthly expenses (amount or hours)
4. **Shevah Coverage**: Calculate Bituah Leumi coverage and related calculations
5. **CareTaker Payslips**: Generate and manage payslips with monthly and yearly payments
6. **CareTaker Worklog**: Track activities (vacation, sick days, Shabbat, etc.)
7. **Settings**: Configure activity charges and calculate expected yearly expenses

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Default Login Credentials

- Username: `family1`
- Password: `family1`

## Technology Stack

- React 18
- React Router 6
- i18next for internationalization
- date-fns for date manipulation
- xlsx for Excel export
- Vite for build tooling

## Data Storage

All data is stored in the browser's localStorage, organized by family ID. Each family's data is isolated and secure.

## Currency

All monetary amounts are displayed in New Israeli Shekels (₪).

## Browser Support

Modern browsers that support ES6+ and localStorage.

