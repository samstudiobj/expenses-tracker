# Expense Tracker

A full-stack expense tracking web app built from scratch with **Node.js** and **Express** on the backend and **vanilla HTML/CSS/JavaScript** on the frontend — no frameworks, no build step. Built as a learning project to go from "hello world" Express server to a polished, portfolio-ready application, one milestone at a time.
LINK: https://expensestracker20.netlify.app/
## Project Overview

Expense Tracker lets you log expenses with a description, amount, and category, then view, edit, delete, search, filter, sort, and export them. A live dashboard summarizes your spending (total, average, highest expense, and top category) and updates automatically as your data changes.

The whole app runs from a single Express server with no database — all data lives in memory on the server and resets when the server restarts. This was a deliberate choice to keep the focus on learning core Node.js/Express concepts and vanilla frontend patterns before introducing persistence.

## Features

- **Create, edit, and delete expenses**, each with a description, amount, and category
- **Inline editing** — click Edit on any expense to modify it in place, with validation
- **Inline delete confirmation** — no accidental deletes
- **7 built-in categories**: Food, Transport, Shopping, Bills, Entertainment, Health, Other
- **Live dashboard** — total expense count, total amount, average, highest expense, and top spending category, always derived live from current data (never stored separately)
- **Search** expenses by description (case-insensitive, live as you type)
- **Filter** by category
- **Sort** by newest, oldest, highest amount, lowest amount, or alphabetically (A–Z / Z–A)
- **CSV export** — always exports the *full* expense list, regardless of any active search/filter, with proper escaping for commas and quotes in descriptions
- **Responsive design** — usable on both desktop and mobile
- **Friendly empty/loading/error states** throughout

## Technologies Used

- **Backend:** Node.js, Express 5
- **Frontend:** Vanilla JavaScript (ES2017+), HTML5, CSS3 (custom properties, Flexbox, Grid)
- **No frontend framework, no build tools, no external CSS/JS libraries** — everything is hand-written
- **Data storage:** in-memory (server-side JavaScript array; resets on server restart)

## Project Architecture

```
expense-tracker/
├── server.js          # Express app: all API routes + static file serving
├── package.json
├── .gitignore
└── public/            # Everything served to the browser
    ├── index.html      # Page structure (form, dashboard, list, controls)
    ├── style.css       # All styling (CSS custom properties, responsive layout)
    └── app.js          # All client-side behavior
```

**Backend (`server.js`)**
A single Express server owns two responsibilities: serving the static frontend (`express.static`) and exposing a small REST API over an in-memory `expenses` array. The server validates all input (description, amount, category) and never trusts the client — every create/update goes through the same validation rules regardless of what the frontend sends.

**Frontend (`public/app.js`)**
The frontend follows a simple unidirectional data flow:

```
currentExpenses (source of truth, synced with the server)
      │
      ▼
computeVisibleExpenses()   ← reads search box + category filter + sort dropdown
      │  (filter → search → sort, always non-mutating)
      ▼
visibleExpenses
      │
      ▼
renderList()  →  <ul id="expenses-list">
```

`currentExpenses` is the only source of truth and is never mutated in place by filtering or sorting — `computeVisibleExpenses()` always derives a new array. The dashboard (`updateDashboard()`) is always computed from the full `currentExpenses`, never from the filtered view, so the stats stay accurate no matter what's currently searched or filtered on screen.

Each expense row has three possible states — **view**, **editing**, **confirming delete** — managed via CSS classes and `dataset` attributes on its `<li>`, with only one row allowed to be in a non-view state at a time.

## How to Run Locally

**Prerequisites:** [Node.js](https://nodejs.org) 18 or later.

```bash
# 1. Clone or download this repository, then from the project folder:
npm install

# 2. Start the server
npm start

# 3. Open your browser to:
http://localhost:3000
```

The server listens on port `3000` by default, or the port specified by the `PORT` environment variable (useful for hosting platforms that assign their own port).

## API Endpoints

All endpoints are relative to the server root and exchange JSON.

| Method | Endpoint | Description | Success | Errors |
|---|---|---|---|---|
| `GET` | `/expenses` | List all expenses | `200` + array | — |
| `POST` | `/expenses` | Create an expense. Body: `{ description, amount, category }` | `201` + created expense | `400` invalid description/amount/category |
| `GET` | `/expenses/:id` | Get one expense by id | `200` + expense | `404` not found |
| `PUT` | `/expenses/:id` | Update an expense. Body: `{ description, amount, category }` | `200` + updated expense | `404` not found, `400` invalid input |
| `DELETE` | `/expenses/:id` | Delete an expense | `200` + deleted expense | `404` not found |

**Validation rules** (enforced on both `POST` and `PUT`):
- `description` — required, non-empty string
- `amount` — required number, must be greater than `0`
- `category` — required, must be one of: `Food`, `Transport`, `Shopping`, `Bills`, `Entertainment`, `Health`, `Other`

The frontend itself is served as static files directly by the same server (no separate frontend server or build step).

## Screenshots

> Screenshots aren't committed to this repository yet — add your own under `screenshots/` and reference them here, e.g.:
>
> ```markdown
> ![Desktop view](screenshots/desktop-view.png)
> ![Mobile view](screenshots/mobile-view.png)
> ```

## Future Improvements

This project intentionally stayed in-memory and single-file to focus on fundamentals. Natural next steps for a v2:

- **Persistence** — replace the in-memory array with a real database (SQLite for simplicity, or PostgreSQL/MongoDB for a production setup)
- **Authentication** — per-user accounts so expenses aren't shared/global
- **Pagination** — for large expense lists instead of loading everything at once
- **Automated tests** — unit tests for the API routes and frontend logic (currently verified manually each milestone)
- **Charts/graphs** — visual spending trends over time, not just point-in-time totals
- **Recurring expenses & budgets** — scheduled expenses and monthly budget goals with alerts
- **Multi-currency support**
- **Dark mode**
- **Deployment** — containerize with Docker and deploy to a platform like Render, Railway, or Fly.io

## License

ISC
