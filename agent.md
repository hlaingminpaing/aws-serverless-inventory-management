# Antigravity Workspace Agent & Skills Registry

This workspace is managed by **Antigravity**, your agentic AI coding partner. The workspace has been equipped with a complete serverless e-commerce product catalog capability. Below is the registry of custom skills, script controls, and integration configurations built into this project.

---

## 🛠️ Built-in Skills (Workspace Capabilities)

### 1. Zero-Dependency Lambda CRUD Controller
* **Location**: `src/handlers/products.js`
* **Description**: Fully self-contained CRUD controller for Node.js 18+ or 20+ Lambda runtimes.
* **Capabilities**:
  * Parses cross-version API Gateway events (`HTTP API v2.0` and `REST API v1.0`).
  * Intercepts CORS preflights (`OPTIONS` method).
  * Executes query operations (`Scan`, `Get`, `Put`, `Update`, `Delete`) against AWS DynamoDB.
  * Employs an offline, zero-setup, in-memory mock fallback when `MOCK_DB=true`.

### 2. Mock Gateway Event Adapter
* **Location**: `local-server.js`
* **Description**: Express-based local web server wrapper.
* **Capabilities**:
  * Emulates AWS API Gateway integration locally on port 3000.
  * Intercepts incoming Express HTTP calls and wraps them into proxy integration event formats (`event.requestContext.http`, `event.pathParameters`, etc.).
  * Executes the identical production Lambda handler, returning standard gateway responses.

### 3. Responsive Theme-Aware Product Dashboard
* **Location**: `frontend/`
* **Description**: Client Single Page App (SPA) built using React and Vite.
* **Capabilities**:
  * Displays inventory statistics (valuation, items, stock alerts).
  * Dynamic filtering (live Search bar + Category dropdown select).
  * CRUD interaction forms rendered in popups with client validation.
  * Uses CSS variables to toggle smoothly between **Dark Theme** and **Light Theme**.

### 4. Cognito Auth Shield Adapter
* **Location**: Integrates in `frontend/src/main.jsx` and `App.jsx`
* **Description**: Secure OAuth2 login wrapper powered by AWS Amplify.
* **Capabilities**:
  * Displays sign-in/registration wall over the dashboard.
  * Automates Cognito user pool signups, validations, and confirm codes.
  * Resolves active user sessions and attaches raw JWT ID Tokens as `Authorization: Bearer <ID_TOKEN>` headers.

---

## 🕹️ Controls (Script Registry)

Run these command shortcuts in your terminal to execute the built-in skills:

| Capability | Command | Location | Description |
| :--- | :--- | :--- | :--- |
| **Start Mock API** | `npm start` | Root folder | Starts the Express server simulating API Gateway on `http://localhost:3000` |
| **Run Client Dev** | `npm run dev` | `frontend/` folder | Launches the React hot-reload Vite server on `http://localhost:5173` |
| **Build for S3** | `npm run build` | `frontend/` folder | Compiles the React project into highly optimized static assets in `/dist` |

---

## 🔒 Configuration Sync

* **Root Settings**: `.env` (ignored by Git, sets local AWS SDK table overrides).
* **Frontend Settings**: `frontend/.env` (pre-loaded with your active endpoints):
  * `VITE_API_URL=https://nbr5r6bjg1.execute-api.ap-southeast-1.amazonaws.com`
  * `VITE_COGNITO_USER_POOL_ID=ap-southeast-1_EL02R0xgw`
  * `VITE_COGNITO_CLIENT_ID=1vl9sv6k0r5a6ng1bvjt3ej4oe`
