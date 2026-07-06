import React from "react";
import { Package, DollarSign, AlertTriangle } from "lucide-react";

export default function StatsPanel({ products }) {
  // Calculations
  const totalProducts = products.length;
  
  const totalValue = products.reduce((acc, curr) => {
    const price = Number(curr.price) || 0;
    const stock = Number(curr.stock) || 0;
    return acc + (price * stock);
  }, 0);

  const outOfStock = products.filter(p => (Number(p.stock) || 0) === 0).length;

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(val);
  };

  return (
    <div className="stats-grid">
      {/* Total Products */}
      <div className="stat-card">
        <div className="stat-label">
          <span>Total Products</span>
          <div className="stat-icon-wrapper">
            <Package size={20} />
          </div>
        </div>
        <div className="stat-value">{totalProducts}</div>
      </div>

      {/* Inventory Value */}
      <div className="stat-card">
        <div className="stat-label">
          <span>Inventory Value</span>
          <div className="stat-icon-wrapper">
            <DollarSign size={20} />
          </div>
        </div>
        <div className="stat-value">{formatCurrency(totalValue)}</div>
      </div>

      {/* Out of Stock */}
      <div className="stat-card">
        <div className="stat-label">
          <span>Out of Stock</span>
          <div className="stat-icon-wrapper" style={{ color: outOfStock > 0 ? "var(--danger)" : "var(--primary-light)" }}>
            <AlertTriangle size={20} />
          </div>
        </div>
        <div className="stat-value" style={{ color: outOfStock > 0 ? "var(--danger)" : "inherit" }}>
          {outOfStock}
        </div>
      </div>
    </div>
  );
}
