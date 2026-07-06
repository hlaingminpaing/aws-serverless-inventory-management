import React from "react";
import { Edit2, Trash2, ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";

export default function ProductCard({ product, onEdit, onDelete }) {
  const { id, name, description, price, category, stock } = product;
  const numStock = Number(stock) || 0;

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(val);
  };

  // Determine stock badge attributes
  const getStockStatus = () => {
    if (numStock === 0) {
      return {
        className: "stock-out",
        text: "Out of Stock",
        icon: <ShieldAlert size={12} />
      };
    } else if (numStock < 10) {
      return {
        className: "stock-low",
        text: `${numStock} Low Stock`,
        icon: <AlertTriangle size={12} />
      };
    } else {
      return {
        className: "stock-instock",
        text: `${numStock} in stock`,
        icon: <CheckCircle size={12} />
      };
    }
  };

  const status = getStockStatus();

  return (
    <div className="product-card">
      <div className="product-body">
        {category && <span className="product-tag">{category}</span>}
        <h3 className="product-title">{name}</h3>
        <p className="product-description" title={description}>
          {description || "No description provided."}
        </p>
        
        <div className="product-meta">
          <span className="product-price">{formatCurrency(price)}</span>
          <span className={`product-stock ${status.className}`}>
            {status.icon}
            {status.text}
          </span>
        </div>
      </div>
      
      <div className="product-actions">
        <button 
          className="btn btn-secondary btn-icon" 
          onClick={() => onEdit(product)}
          title="Edit Product"
        >
          <Edit2 size={14} />
        </button>
        <button 
          className="btn btn-danger btn-icon" 
          onClick={() => onDelete(id)}
          title="Delete Product"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
