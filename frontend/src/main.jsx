import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Amplify } from 'aws-amplify'

// Retrieve Cognito variables from environment
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

// Configure Amplify if valid Cognito settings are provided
const isCognitoConfigured = 
  userPoolId && 
  clientId && 
  !userPoolId.includes("XXXXXXXXX") && 
  !clientId.includes("XXXXXX");

if (isCognitoConfigured) {
  try {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: userPoolId,
          userPoolClientId: clientId
        }
      }
    });
    console.log("AWS Amplify Cognito configured successfully.");
  } catch (error) {
    console.error("Failed to configure AWS Amplify:", error);
  }
} else {
  console.warn("Cognito is not configured. Running in local/unauthenticated mode.");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App isCognitoEnabled={isCognitoConfigured} />
  </React.StrictMode>,
)
