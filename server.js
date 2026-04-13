const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create products table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page TEXT NOT NULL,
            url TEXT NOT NULL,
            name TEXT,
            brand TEXT,
            category TEXT,
            image TEXT,
            addedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// GET /api/products : Fetch products by page name
app.get('/api/products', (req, res) => {
    const page = req.query.page || 'default';
    const sql = `SELECT * FROM products WHERE page = ? ORDER BY addedAt DESC`;
    db.all(sql, [page], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// GET /api/pages : Fetch all distinct available pages
app.get('/api/pages', (req, res) => {
    const sql = `SELECT DISTINCT page FROM products`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows.map(r => r.page));
    });
});

// POST /api/products : Add a new product
app.post('/api/products', (req, res) => {
    const { page, url, name, brand, category, image } = req.body;
    if (!page || !url) {
        res.status(400).json({ error: 'Page and valid URL are required' });
        return;
    }
    const sql = `INSERT INTO products (page, url, name, brand, category, image) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [page, url, name, brand, category, image];
    
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: { id: this.lastID, page, url, name, brand, category, image }
        });
    });
});

// DELETE /api/products/:id : Delete a product
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM products WHERE id = ?`;
    db.run(sql, id, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'deleted', changes: this.changes });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
