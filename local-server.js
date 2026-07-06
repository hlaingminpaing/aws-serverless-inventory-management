require("dotenv").config();
const express = require("express");
const cors = require("cors");
// Default to mock database for local development unless specified otherwise
process.env.MOCK_DB = process.env.MOCK_DB !== undefined ? process.env.MOCK_DB : "true";
process.env.TABLE_NAME = process.env.TABLE_NAME || "Products";

const { handler } = require("./src/handlers/products");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Parse JSON and raw text bodies
app.use(express.json());
app.use(express.text({ type: "*/*" }));

// Helper to convert Express request to AWS Lambda event
function expressToLambdaEvent(req, method, hasIdParam = false) {
  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  
  return {
    body: body === "{}" && req.method !== "POST" && req.method !== "PUT" ? null : body,
    httpMethod: method,
    path: req.path,
    pathParameters: hasIdParam && req.params.id ? { id: req.params.id } : null,
    queryStringParameters: Object.keys(req.query).length > 0 ? req.query : null,
    headers: req.headers,
    requestContext: {
      http: {
        method: method,
        path: req.path
      }
    }
  };
}

// Router adapter
async function handleLambdaRequest(req, res, method, hasIdParam = false) {
  const event = expressToLambdaEvent(req, method, hasIdParam);
  
  try {
    const lambdaResponse = await handler(event);
    
    // Set headers
    if (lambdaResponse.headers) {
      Object.keys(lambdaResponse.headers).forEach(key => {
        res.setHeader(key, lambdaResponse.headers[key]);
      });
    }
    
    // Parse body if JSON, otherwise send as raw string
    let parsedBody;
    try {
      parsedBody = JSON.parse(lambdaResponse.body);
    } catch {
      parsedBody = lambdaResponse.body;
    }
    
    res.status(lambdaResponse.statusCode).send(parsedBody);
  } catch (error) {
    console.error("Local Server Error running handler:", error);
    res.status(500).json({ error: "Local Server Error", message: error.message });
  }
}

// API Routes
app.get("/products", (req, res) => handleLambdaRequest(req, res, "GET"));
app.get("/products/:id", (req, res) => handleLambdaRequest(req, res, "GET", true));
app.post("/products", (req, res) => handleLambdaRequest(req, res, "POST"));
app.put("/products/:id", (req, res) => handleLambdaRequest(req, res, "PUT", true));
app.delete("/products/:id", (req, res) => handleLambdaRequest(req, res, "DELETE", true));

// Root info route
app.get("/", (req, res) => {
  res.json({
    message: "Local server running e-commerce CRUD Lambda mock API",
    mode: process.env.MOCK_DB === "true" ? "Mock In-Memory DB" : "AWS DynamoDB Client",
    endpoints: {
      listProducts: "GET /products",
      getProduct: "GET /products/:id",
      createProduct: "POST /products",
      updateProduct: "PUT /products/:id",
      deleteProduct: "DELETE /products/:id"
    }
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Local Server running on http://localhost:${PORT}`);
  console.log(`📂 Environment Mode: ${process.env.MOCK_DB === "true" ? "OFFLINE MOCK DB" : "LIVE AWS DYNAMODB"}`);
  console.log(`==================================================`);
});
