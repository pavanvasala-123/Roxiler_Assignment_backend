// const express = require("express");
// const mysql = require("mysql2/promise");

// const app = express();
// const port = 3000;

// const mysqlRemote = {
//   host: "mysql-2f571ad3-pavanvasala799-d248.h.aivencloud.com",
//   user: "avnadmin",
//   password: "AVNS_Xm6aldQXMTbIwH7sBgQ",
//   database: "defaultdb",
//   port: "16016",
//   connectionLimit: 10,
// };
// // {
// //   host: "localhost",
// //   user: "root",
// //   password: "pavan123",
// //   database: "products",
// //   connectionLimit: 10,
// // }

// const connection = mysql.createPool(mysqlRemote);

// app.get("/initialize-database", async (req, res) => {
//   try {
//     const response = await fetch(
//       "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
//     );
//     const data = await response.json();

//     await connection.query(
//       "CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), price DECIMAL(10, 2), description TEXT, category VARCHAR(255), image VARCHAR(255), sold BOOLEAN, dateOfSale DATETIME)"
//     );

//     // Insert seed data into products table
//     for (const item of data) {
//       await connection.query(
//         "INSERT INTO products (title, price, description, category, image, sold, dateOfSale) VALUES (?, ?, ?, ?, ?, ?, ?)",
//         [
//           item.title,
//           item.price,
//           item.description,
//           item.category,
//           item.image,
//           item.sold,
//           new Date(item.dateOfSale)
//             .toISOString()
//             .slice(0, 19)
//             .replace("T", " "),
//         ]
//       );
//     }

//     res.status(200).json({ message: "Database initialized with seed data." });
//   } catch (error) {
//     console.error("Error initializing database:", error);
//     res.status(500).json({ error: "Database initialization failed." });
//   }
// });

// app.get("/transactions", async (req, res) => {
//   const { page = 1, perPage = 10, search, month } = req.query;
//   const offset = (page - 1) * perPage; // Calculate offset based on page number and perPage

//   let whereClause = "";
//   let params = [];
//   if (search) {
//     whereClause = "AND (title LIKE ? OR description LIKE ? OR price LIKE ?)";
//     params = [`%${search}%`, `%${search}%`, `%${search}%`];
//   }

//   let monthCondition = "";
//   if (month) {
//     monthCondition = `AND MONTH(dateOfSale) = ?`;
//     params.push(month);
//   }

//   try {
//     const [results] = await connection.query(
//       `
//       SELECT * FROM defaultdb
//       WHERE ${whereClause} ${monthCondition}
//       LIMIT ?, ?
//     `,
//       [...params, offset, parseInt(perPage)] // Parse perPage as integer
//     );

//     res.status(200).json(results);
//   } catch (error) {
//     console.error("Error fetching transactions:", error);
//     res.status(500).json({ error: "Failed to fetch transactions." });
//   }
// });

// // Statistics API
// app.get("/statistics", async (req, res) => {
//   const { month } = req.query;
//   console.log(month);

//   try {
//     const totalSaleAmount = await connection.query(
//       `
//       SELECT SUM(price) AS totalSaleAmount
//       FROM defaultdb
//       WHERE MONTH(dateOfSale) = ?
//     `,
//       [month]
//     );

//     const totalSoldItems = await connection.query(
//       `
//       SELECT COUNT(*) AS totalSoldItems
//       FROM defaultdb
//       WHERE MONTH(dateOfSale) = ? AND sold = true
//     `,
//       [month]
//     );
    

//     const totalNotSoldItems = await connection.query(
//       `
//       SELECT COUNT(*) AS totalNotSoldItems
//       FROM defaultdb
//       WHERE MONTH(dateOfSale) = ? AND sold = false
//     `,
//       [month]
//     );
    

//     res.status(200).json({
//       totalSaleAmount: totalSaleAmount || 0,
//       totalSoldItems: totalSoldItems || 0,
//       totalNotSoldItems: totalNotSoldItems || 0,
//     });
//   } catch (error) {
//     console.error("Error fetching statistics:", error);
//     res.status(500).json({ error: "Failed to fetch statistics." });
//   }
// });

// // Bar Chart API
// app.get("/bar-chart", async (req, res) => {
//   const { month } = req.query;

//   try {
//     const [results] = await connection.query(
//       `
//       SELECT
//         CASE
//           WHEN price BETWEEN 0 AND 100 THEN '0 - 100'
//           WHEN price BETWEEN 101 AND 200 THEN '101 - 200'
//           WHEN price BETWEEN 201 AND 300 THEN '201 - 300'
//           WHEN price BETWEEN 301 AND 400 THEN '301 - 400'
//           WHEN price BETWEEN 401 AND 500 THEN '401 - 500'
//           WHEN price BETWEEN 501 AND 600 THEN '501 - 600'
//           WHEN price BETWEEN 601 AND 700 THEN '601 - 700'
//           WHEN price BETWEEN 701 AND 800 THEN '701 - 800'
//           WHEN price BETWEEN 801 AND 900 THEN '801 - 900'
//           ELSE '901 - above'
//         END AS priceRange,
//         COUNT(*) AS itemCount
//       FROM defaultdb
//       WHERE MONTH(dateOfSale) = ? 
//       GROUP BY priceRange
//     `,
//       [month]
//     );

//     res.status(200).json(results);
//   } catch (error) {
//     console.error("Error fetching bar chart data:", error);
//     res.status(500).json({ error: "Failed to fetch bar chart data." });
//   }
// });


// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });







const express = require("express");
const { MongoClient } = require("mongodb");
const axios = require("axios");

const app = express();
const port = 3000;

const mongoUri =
  "mongodb+srv://pavanvasalaa:pavan123@cluster0.x9pufdk.mongodb.net/";
const client = new MongoClient(mongoUri);

async function connectToDatabase() {
  await client.connect();
  // console.log("Connected to MongoDB");
  return client.db("defaultdb");
}

app.get("/initialize-database", async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const data = response.data;

    const db = await connectToDatabase();
    const collection = db.collection("products");

    await collection.deleteMany({});
    await collection.insertMany(data);

    res.status(200).json({ message: "Database initialized with seed data." });
  } catch (error) {
    console.error("Error initializing database:", error);
    res.status(500).json({ error: "Database initialization failed." });
  }
});

app.get("/transactions", async (req, res) => {
  const { page = 1, perPage = 10, search, month } = req.query;
  const offset = (page - 1) * perPage;

  let query = {};

  if (search) {
    query.$or = [
      { title: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
      { price: new RegExp(search, "i") },
    ];
  }

  if (month) {
    query.dateOfSale = {
      $regex: `-${month.padStart(2, "0")}-`,
    };
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection("products");

    const results = await collection
      .find(query)
      .skip(offset)
      .limit(parseInt(perPage))
      .toArray();

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
});

// Statistics API
app.get("/statistics", async (req, res) => {
  const { month } = req.query;

  try {
    const db = await connectToDatabase();
    const collection = db.collection("products");

    const totalSaleAmount = await collection
      .aggregate([
        { $match: { dateOfSale: { $regex: `-${month.padStart(2, "0")}-` } } },
        { $group: { _id: null, totalSaleAmount: { $sum: "$price" } } },
      ])
      .toArray();

    const totalSoldItems = await collection.countDocuments({
      dateOfSale: { $regex: `-${month.padStart(2, "0")}-` },
      sold: true,
    });

    const totalNotSoldItems = await collection.countDocuments({
      dateOfSale: { $regex: `-${month.padStart(2, "0")}-` },
      sold: false,
    });

    res.status(200).json({
      totalSaleAmount: totalSaleAmount[0]?.totalSaleAmount || 0,
      totalSoldItems: totalSoldItems,
      totalNotSoldItems: totalNotSoldItems,
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
    const db = await connectToDatabase();
    const collection = db.collection("products");

    const results = await collection
      .aggregate([
        { $match: { dateOfSale: { $regex: `-${month.padStart(2, "0")}-` } } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  {
                    case: {
                      $and: [
                        { $gte: ["$price", 0] },
                        { $lte: ["$price", 100] },
                      ],
                    },
                    then: "0 - 100",
                  },
                  {
                    case: {
                      $and: [
                        { $gte: ["$price", 101] },
                        { $lte: ["$price", 200] },
                      ],
                    },
                    then: "101 - 200",
                  },
                  {
                    case: {
                      $and: [
                        { $gte: ["$price", 201] },
                        { $lte: ["$price", 300] },
                      ],
                    },
                    then: "201 - 300",
                  },
                  {
                    case: {
                      $and: [
                        { $gte: ["$price", 301] },
                        { $lte: ["$price", 400] },
                      ],
                    },
                    then: "301 - 400",
                  },
                  {
                    case: {
                      $and: [
                        { $gte: ["$price", 401] },
                        { $lte: ["$price", 500] },
                      ],
                    },
                    then: "401 - 500",
                  },
                  {
                    case: {
                      $and: [
                        { $gte: ["$price", 501] },
                        { $lte: ["$price", 600] },
                      ],
                    },
                    then: "501 - 600",
                  },
                  {
                    case: {
                      $and: [
                        { $gte: ["$price", 601] },
                        { $lte: ["$price", 700] },
                      ],
                    },
                    then: "601 - 700",
                  },
                  {
                    case: {
                      $and: [
                        { $gte: ["$price", 701] },
                        { $lte: ["$price", 800] },
                      ],
                    },
                    then: "701 - 800",
                  },
                  {
                    case: {
                      $and: [
                        { $gte: ["$price", 801] },
                        { $lte: ["$price", 900] },
                      ],
                    },
                    then: "801 - 900",
                  },
                ],
                default: "901 - above",
              },
            },
            itemCount: { $sum: 1 },
          },
        },
      ])
      .toArray();

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching bar chart data:", error);
    res.status(500).json({ error: "Failed to fetch bar chart data." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

