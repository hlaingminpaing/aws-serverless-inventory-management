# StockFlow Backend (Node.js CRUD Lambda & API Gateway)

This repository contains the backend code for the StockFlow inventory manager, comprising a Node.js Lambda function, integration endpoints for API Gateway, and configuration steps for AWS DynamoDB and Cognito Authorization.

---

## 📂 Project Structure

```text
├── src/
│   └── handlers/
│       └── products.js     # Production-ready Lambda CRUD function (Zero-dependency)
├── local-server.js         # Local Express server wrapper for offline verification
├── package.json            # Node.js configuration and local dependencies
└── README.md               # Backend deployment and API routing documentation
```

---

## 💻 Local Testing & Offline Verification

To run and test the API on your machine:

### 1. Install Dependencies
Run this in the root directory to install the local test server packages:
```bash
npm install
```

### 2. Start the Local Server
```bash
npm start
```
This runs the local server on `http://localhost:3000`. By default, it operates in **OFFLINE MOCK DB** mode, storing items in-memory.

*If you want to test against your actual AWS DynamoDB table locally, create a `.env` file in the root folder with your AWS Access Keys and set `MOCK_DB=false`.*

---

## ☁️ AWS Console Step-by-Step Deployment Guide

Since you are deploying directly via the AWS Console, here is the sequence of actions:

### Step 1: Create the DynamoDB Table
1. Open the **Amazon DynamoDB Console**.
2. Click **Create table**:
   - **Table name**: `Products`
   - **Partition key**: `id` (Type: `String`)
3. Leave other settings as default and click **Create table**.

---

### Step 2: Create the Lambda Function
1. Open the **AWS Lambda Console**.
2. Click **Create function** -> choose **Author from scratch**:
   - **Function name**: `EcommerceProductsCRUD`
   - **Runtime**: `Node.js 20.x` or `Node.js 18.x`
3. Expand **Permissions** -> ensure **Create a new role with basic Lambda permissions** is checked. Click **Create**.
4. In the **Code source** editor, delete the default placeholder.
5. Copy the entire contents of [src/handlers/products.js](file:///d:/Code/apigw-lambda-cognito/src/handlers/products.js) and paste it into the editor. Click **Deploy**.
6. **Add permissions to read/write DynamoDB**:
   - Go to the **Configuration** tab -> select **Permissions** -> click on the **Role name** link (opens IAM).
   - Click **Add permissions** -> **Attach policies**.
   - Search for **`AmazonDynamoDBFullAccess`**, check the box, and click **Add permissions**. Close the IAM tab.
7. **Set environment variables**:
   - In the Lambda Console under **Configuration** -> select **Environment variables**.
   - Click **Edit** -> **Add environment variable**:
     * Key: `TABLE_NAME`, Value: `Products`
   - Click **Save**.

9. **Important Values to Copy**:
   - **User Pool ID**: Displayed directly at the top of your User Pool's dashboard page under the pool name (e.g., `ap-southeast-1_EL02R0xgw`).
   - **App Client ID**: Click on the **App integration** tab in your User Pool settings, scroll down to the **App clients and analytics** section at the bottom, and copy the **Client ID** string (e.g., `1vl9sv6k0r5a6ng1bvjt3ej4oe`).

---

### Step 3: Configure API Gateway (HTTP API)
1. Open the **Amazon API Gateway Console**.
2. Click **Create API** -> choose **HTTP API** (click **Build**).
3. **Integrations**: Add an integration. Select **Lambda**, then choose `EcommerceProductsCRUD`.
4. **API name**: `EcommerceAPI`. Click **Next**.
5. **Configure routes**: Create these five routes linked to your Lambda integration:
   - `GET /products`
   - `GET /products/{id}`
   - `POST /products`
   - `PUT /products/{id}`
   - `DELETE /products/{id}`
6. **Define stages**: Keep stage name as `$default` (this enables auto-deploy on saving). Click **Next**.
7. Click **Create**. Copy the **Invoke URL** (e.g. `https://xxxxxx.execute-api.ap-southeast-1.amazonaws.com`).

---

### Step 4: Secure Write Routes with Cognito Authorizer
1. In the API Gateway Console, select your `EcommerceAPI`.
2. Under the left menu, select **Authorization**.
3. Under the **Routes** tree, select `POST /products`.
4. Click **Create and attach authorizer** -> choose **JWT**:
   - **Name**: `CognitoAuthorizer`
   - **Identity source**: `$request.header.Authorization`
   - **Issuer URL**: Enter `https://cognito-idp.ap-southeast-1.amazonaws.com/<USER-POOL-ID>`
   - **Audience**: Enter your Cognito **App client ID**.
5. Click **Create and attach**.
6. **Attach to other routes**: Go to `PUT /products/{id}` and `DELETE /products/{id}`, select the `CognitoAuthorizer` from the dropdown list, and click **Attach authorizer**.
   *(Keep `GET /products` and `GET /products/{id}` open with no authorizer so users can browse products without logging in)*.
