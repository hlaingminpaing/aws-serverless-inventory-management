import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function ProductModal({ isOpen, onClose, onSave, product }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "0"
  });

  const [errors, setErrors] = useState({});

  // Reset form or load selected product on open/change
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price !== undefined ? String(product.price) : "",
        category: product.category || "",
        stock: product.stock !== undefined ? String(product.stock) : "0"
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: "0"
      });
    }
    setErrors({});
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.price.trim()) {
      newErrors.price = "Price is required";
    } else if (isNaN(formData.price) || Number(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number";
    }
    if (formData.stock.trim() !== "" && (isNaN(formData.stock) || Number(formData.stock) < 0)) {
      newErrors.stock = "Stock must be a non-negative number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Convert numeric strings to actual numbers
    const payload = {
      ...formData,
      price: Number(formData.price),
      stock: formData.stock ? Number(formData.stock) : 0
    };

    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{product ? "Edit Product" : "Add New Product"}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Wireless Mouse"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <span style={{ color: "var(--danger)", fontSize: "0.75rem" }}>{errors.name}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-input form-textarea"
              placeholder="Enter product details..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Row for Price & Stock */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (USD) *</label>
              <input
                type="text"
                name="price"
                className="form-input"
                placeholder="29.99"
                value={formData.price}
                onChange={handleChange}
              />
              {errors.price && <span style={{ color: "var(--danger)", fontSize: "0.75rem" }}>{errors.price}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Stock Quantity</label>
              <input
                type="number"
                name="stock"
                className="form-input"
                placeholder="0"
                min="0"
                value={formData.stock}
                onChange={handleChange}
              />
              {errors.stock && <span style={{ color: "var(--danger)", fontSize: "0.75rem" }}>{errors.stock}</span>}
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              type="text"
              name="category"
              className="form-input"
              placeholder="e.g. Electronics, Clothing"
              value={formData.category}
              onChange={handleChange}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {product ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
