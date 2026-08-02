# StockFlow React Frontend (S3 Static Hosting)

This directory contains the Vite-based React Single Page Application (SPA) for the StockFlow e-commerce inventory dashboard. It interfaces with your API Gateway backend, integrates with Cognito user authentication, and compiles into static files optimized for S3 hosting.

---

## 🎨 Features & Aesthetics

* **Curated Dark/Light Themes**: Supports real-time theme toggling with native CSS variable tokens. The selection is persistent and saved in `localStorage`.
* **Cognito Authentication**: Uses the AWS Amplify SDK to render user login, registration, and confirmation screens.
* **Auto-attached Tokens**: Every API database call automatically fetches the Cognito user session and passes the JWT ID Token in the `Authorization: Bearer <ID_TOKEN>` header.
* **Overview Statistics**: Live calculations showing product counts, inventory valuation, and out-of-stock metrics.
* **Inventory Control Modals**: Modern overlays to easily add, edit, and delete products.

---

## 🔐 AWS Cognito Setup Requirements

When creating your Amazon Cognito User Pool for this application, ensure you configure the following options in the setup wizard so it matches the frontend authentication flow:

* **Configure options > Options for sign-in identifiers**: Check both **Email** and **Username**. This allows the Authenticator component to process both types of logins.
* **Configure options > Self-registration**: Check **Enable self-registration** so users can sign up.
* **Configure options > Required attributes for sign-up**: Select **email** and **name**. The `name` attribute is strictly required by the frontend `<Authenticator signUpAttributes={["name"]}>` component.

---

## 💻 Local Quickstart

### 1. Install Dependencies
Run the command below inside the `frontend` folder:
```bash
npm install
```

### 2. Configure Environment Variables
Create or open the `.env` file in this directory and fill in your AWS credentials and API Gateway URL:

* **VITE_API_URL**: The base URL of your deployed API Gateway.
* **VITE_COGNITO_USER_POOL_ID**: The unique identifier of your User Pool. Found directly at the top of your User Pool's dashboard overview page in the AWS Console (e.g., `ap-southeast-1_EL02R0xgw`).
* **VITE_COGNITO_CLIENT_ID**: The App Client ID. Found in the AWS Console by clicking on the **App integration** tab of your User Pool, scrolling down to the **App clients and analytics** section at the bottom, and copying the **Client ID** (e.g., `1vl9sv6k0r5a6ng1bvjt3ej4oe`). Ensure this App Client is configured as a **Public Client** with *no Client Secret*.

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ☁️ Building & S3 Deployment

To compile the application into static files and deploy it to Amazon S3:

### Step 1: Compile the build
Run this inside the `frontend` folder:
```bash
npm run build
```
This will compile your Javascript, HTML, and CSS assets and output them to the **`dist/`** directory.

### Step 2: Set up S3 Website hosting in AWS Console
1. Go to the **Amazon S3 Console** -> click **Create bucket** (e.g. `my-ecommerce-inventory-bucket`).
2. Uncheck **Block all public access** (public access is required for static website hosting). Acknowledge the warning and click create.
3. Open your bucket -> Go to the **Properties** tab.
4. Scroll to the bottom to **Static website hosting** -> click **Edit** -> choose **Enable**:
   - **Index document**: `index.html`
   - **Error document**: `index.html` (for single-page routing support)
   - Click **Save changes**. Copy the website endpoint URL.
5. Go to the **Permissions** tab -> scroll to **Bucket policy** -> click **Edit** -> Paste the policy:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "PublicReadGetObject",
               "Effect": "Allow",
               "Principal": "*",
               "Action": "s3:GetObject",
               "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
           }
       ]
   }
   ```
   *(Replace `YOUR_BUCKET_NAME` with your actual bucket name)*. Click save.

### Step 3: Upload files
1. Go to the **Objects** tab of your bucket.
2. Click **Upload**.
3. Drag and drop **all the contents inside the `frontend/dist` directory** (the `assets/` folder and `index.html` file) into the bucket.
4. Click **Upload**.

Open your S3 website URL in your browser to view your deployed client dashboard!
