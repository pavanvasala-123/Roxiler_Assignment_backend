const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const port = 3000;

const mysqlRemote = {
  host: "mysql-2f571ad3-pavanvasala799-d248.h.aivencloud.com",
  user: "avnadmin",
  password: "AVNS_Xm6aldQXMTbIwH7sBgQ",
  database: "defaultdb",
  port:"16016",
  connectionLimit: 10,
}
// {
//   host: "localhost",
//   user: "root",
//   password: "pavan123",
//   database: "products",
//   connectionLimit: 10,
// }


const connection = mysql.createPool(mysqlRemote);


app.get("/initialize-database", async (req, res) => {
  try {
    const response = await fetch(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const data = await response.json();

    
    await connection.query(
      "CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), price DECIMAL(10, 2), description TEXT, category VARCHAR(255), image VARCHAR(255), sold BOOLEAN, dateOfSale DATETIME)"
    );

    // Insert seed data into products table
    for (const item of data) {
      await connection.query(
        "INSERT INTO products (title, price, description, category, image, sold, dateOfSale) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          item.title,
          item.price,
          item.description,
          item.category,
          item.image,
          item.sold,
          new Date(item.dateOfSale)
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
        ]
      );
    }

    res.status(200).json({ message: "Database initialized with seed data." });
  } catch (error) {
    console.error("Error initializing database:", error);
    res.status(500).json({ error: "Database initialization failed." });
  }
});



app.get("/transactions", async (req, res) => {
  const { page = 1, perPage = 10, search, month } = req.query;
  const offset = (page - 1) * perPage; // Calculate offset based on page number and perPage

  let whereClause = "";
  let params = [];
  if (search) {
    whereClause = "AND (title LIKE ? OR description LIKE ? OR price LIKE ?)";
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }
  
  let monthCondition = "";
  if (month) {
    monthCondition = `AND MONTH(dateOfSale) = ?`;
    params.push(month);
  }

  try {
    const [results] = await connection.query(
      `
      SELECT * FROM products
      WHERE 1=1 ${whereClause} ${monthCondition}
      LIMIT ?, ?
    `,
      [...params, offset, parseInt(perPage)] // Parse perPage as integer
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
});


// Statistics API
app.get("/statistics", async (req, res) => {
  const { month } = req.query;
  // console.log(month);

  try {
    const [totalSaleAmount] = await connection.query(
      `
      SELECT SUM(price) AS totalSaleAmount
      FROM products
      WHERE MONTH(dateOfSale) = ?
    `,
      [month]
    );

    const [totalSoldItems] = await connection.query(
      `
      SELECT COUNT(*) AS totalSoldItems
      FROM products
      WHERE MONTH(dateOfSale) = ? AND sold = true
    `,
      [month]
    );

    const [totalNotSoldItems] = await connection.query(
      `
      SELECT COUNT(*) AS totalNotSoldItems
      FROM products
      WHERE MONTH(dateOfSale) = ? AND sold = false
    `,
      [month]
    );

    res.status(200).json({
      totalSaleAmount: totalSaleAmount[0].totalSaleAmount || 0,
      totalSoldItems: totalSoldItems[0].totalSoldItems || 0,
      totalNotSoldItems: totalNotSoldItems[0].totalNotSoldItems || 0,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics." });
  }
});



// Bar Chart API
app.get("/bar-chart", async (req, res) => {
  const { month } = req.query;

  try {
    const [results] = await connection.query(
      `
      SELECT
        CASE
          WHEN price BETWEEN 0 AND 100 THEN '0 - 100'
          WHEN price BETWEEN 101 AND 200 THEN '101 - 200'
          WHEN price BETWEEN 201 AND 300 THEN '201 - 300'
          WHEN price BETWEEN 301 AND 400 THEN '301 - 400'
          WHEN price BETWEEN 401 AND 500 THEN '401 - 500'
          WHEN price BETWEEN 501 AND 600 THEN '501 - 600'
          WHEN price BETWEEN 601 AND 700 THEN '601 - 700'
          WHEN price BETWEEN 701 AND 800 THEN '701 - 800'
          WHEN price BETWEEN 801 AND 900 THEN '801 - 900'
          ELSE '901 - above'
        END AS priceRange,
        COUNT(*) AS itemCount
      FROM products
      WHERE MONTH(dateOfSale) = ?
      GROUP BY priceRange
    `,
      [month]
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching bar chart data:", error);
    res.status(500).json({ error: "Failed to fetch bar chart data." });
  }
});

// Pie Chart API
app.get("/pie-chart", async (req, res) => {
  const { month } = req.query;

  try {
    const [results] = await connection.query(
      `
      SELECT category, COUNT(*) AS itemCount
      FROM products
      WHERE MONTH(dateOfSale) = ?
      GROUP BY category
    `,
      [month]
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching pie chart data:", error);
    res.status(500).json({ error: "Failed to fetch pie chart data." });
  }
});

// Combined API
app.get("/combined-data", async (req, res) => {
  try {
    const [transactions] = await connection.query("SELECT * FROM products");
    const [statistics] = await connection.query("SELECT * FROM statistics");
    const [barChart] = await connection.query("SELECT * FROM bar_chart");
    const [pieChart] = await connection.query("SELECT * FROM pie_chart");

    res.status(200).json({
      transactions,
      statistics,
      barChart,
      pieChart,
    });
  } catch (error) {
    console.error("Error fetching combined data:", error);
    res.status(500).json({ error: "Failed to fetch combined data." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
