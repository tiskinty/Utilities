/*
Creates a (simple) REST API microservice for connecting to a postgres database

As-is assumes the table `products` with the structure like
```
  CREATE TABLE product (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      price NUMERIC(10, 2)
  );
  
  INSERT INTO product (name, price) VALUES 
      ('Product 1', RANDOM() * 100),
      ('Product 2', RANDOM() * 100),
      ('Product 3', RANDOM() * 100),
      ('Product 4', RANDOM() * 100),
      ('Product 5', RANDOM() * 100);
```

*** There is no security built into the current form, use at your own risk ***

*/

const express = require('express');
const { Pool } = require('pg');
const pg = require('pg');

const app = express();
const port = 3000;

// Configure PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'db',
  password: 'postgres',
  port: 5432,
});

// Middleware to parse JSON bodies
app.use(express.json());

// https://localhost:3000
app.get('/products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a single product by id
app.get('/products/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (rows.length === 0) {
      res.json([]);
    } else {
      res.json([rows[0]]);
    }
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new product
app.post('/products', async (req, res) => {
  const { name, price } = req.body;
  try {
    const { rows } = await pool.query('INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *', [name, price]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a product by id
app.put('/products/:id', async (req, res) => {
  const productId = req.params.id;
  const { name, price } = req.body;
  try {
    const { rows } = await pool.query('UPDATE products SET name = $1, price = $2 WHERE id = $3 RETURNING *', [name, price, productId]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a product by id
app.delete('/products/:id', async (req, res) => {
  const productId = req.params.id;
  try {
    const { rows } = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [productId]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.json({ message: 'Product deleted successfully' });
    }
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
