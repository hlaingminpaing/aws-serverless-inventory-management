const crypto = require("crypto");

// Determine if we are running in offline mock mode
const IS_MOCK = process.env.MOCK_DB === "true";
const TABLE_NAME = process.env.TABLE_NAME || "Products";

// Common headers for CORS support
const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
};

// In-memory data store for local mock testing
let mockItems = [
  {
    id: "f3b3b24b-324c-4e89-8dcf-336e3c0c3e74",
    name: "Wireless Headphones",
    description: "Noise-cancelling over-ear headphones",
    price: 99.99,
    category: "Electronics",
    stock: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "a1a8c983-bc2a-436f-87d2-7fb71b1cbbe2",
    name: "Leather Journal",
    description: "Classic hand-crafted leather journal notebook",
    price: 24.90,
    category: "Stationery",
    stock: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initialize DynamoDB clients only if not in Mock Mode
let ddbDocClient;
if (!IS_MOCK) {
  try {
    const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
    const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
    const client = new DynamoDBClient({});
    ddbDocClient = DynamoDBDocumentClient.from(client);
  } catch (err) {
    console.warn("Could not load AWS SDK. Falling back to mock database.", err.message);
  }
}

/**
 * Database client wrapper to abstract DynamoDB vs Mock Mode
 */
const db = {
  async put(item) {
    if (IS_MOCK || !ddbDocClient) {
      const idx = mockItems.findIndex(i => i.id === item.id);
      if (idx > -1) mockItems[idx] = item;
      else mockItems.push(item);
      return item;
    }
    const { PutCommand } = require("@aws-sdk/lib-dynamodb");
    await ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));
    return item;
  },

  async scan() {
    if (IS_MOCK || !ddbDocClient) {
      return mockItems;
    }
    const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
    const result = await ddbDocClient.send(new ScanCommand({
      TableName: TABLE_NAME
    }));
    return result.Items || [];
  },

  async get(id) {
    if (IS_MOCK || !ddbDocClient) {
      return mockItems.find(i => i.id === id) || null;
    }
    const { GetCommand } = require("@aws-sdk/lib-dynamodb");
    const result = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { id }
    }));
    return result.Item || null;
  },

  async delete(id) {
    if (IS_MOCK || !ddbDocClient) {
      const idx = mockItems.findIndex(i => i.id === id);
      if (idx > -1) {
        mockItems.splice(idx, 1);
        return true;
      }
      return false;
    }
    const { DeleteCommand } = require("@aws-sdk/lib-dynamodb");
    await ddbDocClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id }
    }));
    return true;
  },

  async update(id, body) {
    if (IS_MOCK || !ddbDocClient) {
      const idx = mockItems.findIndex(i => i.id === id);
      if (idx === -1) return null;

      const current = mockItems[idx];
      const updated = {
        ...current,
        ...body,
        id, // Prevent ID override
        createdAt: current.createdAt, // Prevent createdAt override
        price: body.price !== undefined ? Number(body.price) : current.price,
        stock: body.stock !== undefined ? Number(body.stock) : current.stock,
        updatedAt: new Date().toISOString()
      };
      mockItems[idx] = updated;
      return updated;
    }

    const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
    const updateFields = Object.keys(body).filter(
      (key) => key !== "id" && key !== "createdAt"
    );

    if (updateFields.length === 0) {
      throw new Error("No updatable fields provided");
    }

    const expressionAttributeNames = {
      "#updatedAt": "updatedAt"
    };
    const expressionAttributeValues = {
      ":updatedAt": new Date().toISOString()
    };

    const updateExpressions = updateFields.map((field, index) => {
      const attributeName = `#field${index}`;
      const attributeValue = `:val${index}`;

      expressionAttributeNames[attributeName] = field;
      expressionAttributeValues[attributeValue] = 
        (field === "price" || field === "stock") ? Number(body[field]) : body[field];

      return `${attributeName} = ${attributeValue}`;
    });

    const updateExpression = `SET ${updateExpressions.join(", ")}, #updatedAt = :updatedAt`;

    const updateResult = await ddbDocClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW"
    }));

    return updateResult.Attributes;
  }
};

/**
 * Main Lambda Handler
 */
exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  const httpMethod = event.requestContext?.http?.method || event.httpMethod;
  if (httpMethod === "OPTIONS") {
    return formatResponse(200, { message: "CORS preflight successful" });
  }

  const pathParameters = event.pathParameters || {};
  const productId = pathParameters.id;

  try {
    switch (httpMethod) {
      case "GET":
        if (productId) {
          const item = await db.get(productId);
          if (!item) {
            return formatResponse(404, { error: `Product with ID ${productId} not found` });
          }
          return formatResponse(200, item);
        } else {
          const items = await db.scan();
          return formatResponse(200, items);
        }

      case "POST":
        return await handleCreate(event.body);

      case "PUT":
        if (!productId) {
          return formatResponse(400, { error: "Product ID is required in path parameters" });
        }
        return await handleUpdate(productId, event.body);

      case "DELETE":
        if (!productId) {
          return formatResponse(400, { error: "Product ID is required in path parameters" });
        }
        return await handleDelete(productId);

      default:
        return formatResponse(405, { error: `Unsupported method "${httpMethod}"` });
    }
  } catch (error) {
    console.error("Error executing database operation:", error);
    return formatResponse(500, { 
      error: "Internal Server Error", 
      message: error.message 
    });
  }
};

/**
 * Create Handlers
 */
async function handleCreate(bodyString) {
  if (!bodyString) {
    return formatResponse(400, { error: "Request body is empty" });
  }

  let body;
  try {
    body = typeof bodyString === "object" ? bodyString : JSON.parse(bodyString);
  } catch (e) {
    return formatResponse(400, { error: "Invalid JSON format in request body" });
  }

  const { name, description, price, category, stock } = body;
  if (!name || price === undefined) {
    return formatResponse(400, { error: "Name and Price are required fields" });
  }

  const productId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const newProduct = {
    id: productId,
    name,
    description: description || "",
    price: Number(price),
    category: category || "Uncategorized",
    stock: stock !== undefined ? Number(stock) : 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const savedItem = await db.put(newProduct);
  return formatResponse(201, savedItem);
}

/**
 * Update Handler
 */
async function handleUpdate(id, bodyString) {
  if (!bodyString) {
    return formatResponse(400, { error: "Request body is empty" });
  }

  let body;
  try {
    body = typeof bodyString === "object" ? bodyString : JSON.parse(bodyString);
  } catch (e) {
    return formatResponse(400, { error: "Invalid JSON format in request body" });
  }

  // Verify item exists
  const existingItem = await db.get(id);
  if (!existingItem) {
    return formatResponse(404, { error: `Product with ID ${id} not found` });
  }

  try {
    const updatedItem = await db.update(id, body);
    return formatResponse(200, updatedItem);
  } catch (err) {
    return formatResponse(400, { error: err.message });
  }
}

/**
 * Delete Handler
 */
async function handleDelete(id) {
  const existingItem = await db.get(id);
  if (!existingItem) {
    return formatResponse(404, { error: `Product with ID ${id} not found` });
  }

  await db.delete(id);
  return formatResponse(200, { 
    message: `Product with ID ${id} has been deleted successfully`,
    id 
  });
}

/**
 * Format API Gateway Response
 */
function formatResponse(statusCode, body) {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify(body)
  };
}
