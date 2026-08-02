import React, { useState, useEffect } from "react";
import { Plus, Search, AlertCircle, RefreshCw, Layers, Sun, Moon, LogOut } from "lucide-react";
import { Authenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import "@aws-amplify/ui-react/styles.css";
import StatsPanel from "./components/StatsPanel";
import ProductCard from "./components/ProductCard";
import ProductModal from "./components/ProductModal";

// Load default API URL from dotenv config
const API_URL = import.meta.env.VITE_API_URL || "";

export default function App({ isCognitoEnabled }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Toast System
  const [toasts, setToasts] = useState([]);

  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("theme-light");
    } else {
      document.body.classList.remove("theme-light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const showToast = (text, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Helper to fetch JWT ID Token from active Amplify Cognito session
  const getAuthHeaders = async () => {
    if (!isCognitoEnabled) return {};
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      return idToken ? { "Authorization": `Bearer ${idToken}` } : {};
    } catch (err) {
      console.warn("Could not retrieve active authentication token:", err);
      return {};
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!API_URL) {
        throw new Error("API Gateway endpoint is not configured in .env file.");
      }

      // Attach token if enabled
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_URL}/products`, {
        headers: {
          ...authHeaders
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message || "Failed to load products from API.");
      showToast(err.message || "Failed to fetch products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Save Product (Handle Create & Update)
  const handleSaveProduct = async (formData) => {
    setIsModalOpen(false);
    setLoading(true);
    
    try {
      const isEditing = !!editingProduct;
      const url = isEditing 
        ? `${API_URL}/products/${editingProduct.id}` 
        : `${API_URL}/products`;
      
      const method = isEditing ? "PUT" : "POST";
      const authHeaders = await getAuthHeaders();

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save product (Status ${response.status})`);
      }

      const savedProduct = await response.json();

      if (isEditing) {
        setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
        showToast(`Product "${savedProduct.name}" updated successfully.`);
      } else {
        setProducts(prev => [savedProduct, ...prev]);
        showToast(`Product "${savedProduct.name}" added successfully.`);
      }
    } catch (err) {
      console.error("Error saving product:", err);
      showToast(err.message || "Failed to save product", "error");
    } finally {
      setLoading(false);
      setEditingProduct(null);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    setLoading(true);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: {
          ...authHeaders
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete product (Status ${response.status})`);
      }

      setProducts(prev => prev.filter(p => p.id !== id));
      showToast("Product deleted successfully.");
    } catch (err) {
      console.error("Error deleting product:", err);
      showToast(err.message || "Failed to delete product", "error");
    } finally {
      setLoading(false);
    }
  };

  // Open modal for adding
  const handleAddClick = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditClick = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Get unique categories list for filtering
  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filtered Products list
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "All" || 
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Render Dashboard Contents
  const renderDashboard = (signOut = null, user = null) => {
    return (
      <div className="app-container">
        {/* Header */}
        <header className="header-section">
          <div className="logo-area">
            <div className="logo-icon">
              <Layers size={22} />
            </div>
            <div>
              <h1 className="logo-title">StockFlow</h1>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                E-COMMERCE INVENTORY DASHBOARD
              </span>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            {/* Theme Toggle */}
            <button 
              className="btn btn-secondary btn-icon" 
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              style={{ borderRadius: "var(--radius-md)" }}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            
            {/* Sign Out Button (Only if Cognito is configured) */}
            {signOut && user && (
              <button 
                className="btn btn-secondary" 
                onClick={signOut}
                title={`Logged in as ${user.username || user.signInDetails?.loginId}`}
                style={{ fontSize: "0.825rem", gap: "0.35rem" }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            )}

            <button className="btn btn-primary" onClick={handleAddClick}>
              <Plus size={16} />
              Add Product
            </button>
          </div>
        </header>

        {/* API Connection Indicator */}
        <div className="config-banner" style={{ borderLeft: isCognitoEnabled ? "4px solid var(--success)" : "4px solid var(--warning)" }}>
          <div className="config-info">
            <div className={`pulse-dot ${error ? "error" : ""}`} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="config-url-text">
                API Endpoint: <strong>{API_URL || "NOT CONFIGURED"}</strong>
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Auth Status: {isCognitoEnabled ? "Secure Cognito Authorization Active" : "Cognito Inactive (Running in Unauthenticated Mode)"}
              </span>
            </div>
          </div>
          
          <button className="btn btn-secondary btn-icon" onClick={fetchProducts} title="Refresh Inventory" disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Stats Panel */}
        <StatsPanel products={products} />

        {/* Filtering and Search Controls */}
        <div className="control-section">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search products by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select 
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Products Display */}
        {error && !products.length ? (
          <div className="empty-state" style={{ border: "2px solid rgba(244, 63, 94, 0.15)" }}>
            <div className="empty-icon" style={{ color: "var(--danger)" }}>
              <AlertCircle size={32} />
            </div>
            <h3>API Connection Issue</h3>
            <p>
              We encountered an issue communicating with your API Gateway. Make sure the API is deployed, 
              publicly accessible, and CORS integration is enabled in your AWS settings.
            </p>
            <button className="btn btn-primary" onClick={fetchProducts}>
              Retry Connection
            </button>
          </div>
        ) : loading && !products.length ? (
          // Loading skeletons
          <div className="products-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-animate" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          // Empty catalog / no search results
          <div className="empty-state">
            <div className="empty-icon">
              <Layers size={32} />
            </div>
            <h3>No Products Found</h3>
            <p>
              {products.length === 0 
                ? "Your inventory database is currently empty. Get started by adding your first e-commerce product."
                : "No products match your active search terms or category filter settings."}
            </p>
            {products.length === 0 && (
              <button className="btn btn-primary" onClick={handleAddClick}>
                <Plus size={16} />
                Create Product
              </button>
            )}
          </div>
        ) : (
          // Product Grid Layout
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditClick}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        )}

        {/* Modals & Overlay forms */}
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
          product={editingProduct}
        />

        {/* Toast Notifications */}
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast ${toast.type === "error" ? "error" : "success"}`}>
              <span className="toast-content">{toast.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Main wrapper with Authenticator overlay conditional logic
  if (isCognitoEnabled) {
    return (
      <Authenticator signUpAttributes={["email", "name"]}>
        {({ signOut, user }) => renderDashboard(signOut, user)}
      </Authenticator>
    );
  }

  // Render directly without Cognito Auth wrappers
  return renderDashboard();
}
