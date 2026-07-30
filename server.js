const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];

let expenses = [];
let nextId = 1;

app.get('/expenses', (req, res) => {
  res.json(expenses);
});

app.post('/expenses', (req, res) => {
  const { description, amount, category } = req.body;

  if (!description || typeof amount !== 'number') {
    return res.status(400).json({ error: 'description (string) and amount (number) are required' });
  }

  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
  }

  const expense = { id: nextId++, description, amount, category };
  expenses.push(expense);
  res.status(201).json(expense);
});

app.get('/expenses/:id', (req, res) => {
  const expense = expenses.find(e => e.id === Number(req.params.id));

  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  res.json(expense);
});

app.put('/expenses/:id', (req, res) => {
  const expense = expenses.find(e => e.id === Number(req.params.id));

  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const { description, amount, category } = req.body;

  if (!description || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'description (non-empty string) and amount (number > 0) are required' });
  }

  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
  }

  expense.description = description;
  expense.amount = amount;
  expense.category = category;
  res.json(expense);
});

app.delete('/expenses/:id', (req, res) => {
  const index = expenses.findIndex(e => e.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const [deleted] = expenses.splice(index, 1);
  res.json(deleted);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
