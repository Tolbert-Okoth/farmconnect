import React from 'react';
import { Link } from 'react-router-dom';
import { formatKsh } from '../utils/format';

const ProductCard = ({ product }) => {
  const inStock = Number(product.quantity) > 0;
  return (
    <article className="produce-card">
      <div className="price-tag" aria-label={`Price ${formatKsh(product.price)}`}>
        <small>Today</small>
        {formatKsh(product.price)}
      </div>
      <div className="produce-card-media">
        <img src={product.image_url} alt={product.name} loading="lazy" />
      </div>
      <div className="produce-card-body">
        <h3>
          <Link to={`/product/${product.produce_id}`}>{product.name}</Link>
        </h3>
        <p className="produce-card-farmer">from {product.farmer_name}</p>
        <span className={`stock-pill ${inStock ? '' : 'out'}`}>
          {inStock ? `${product.quantity} in stock` : 'Sold out'}
        </span>
      </div>
    </article>
  );
};

export default ProductCard;
