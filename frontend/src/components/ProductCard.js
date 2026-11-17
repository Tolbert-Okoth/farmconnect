import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { formatKsh } from '../utils/format';

const ProductCard = ({ product }) => {
  return (
    <Card className="my-3 p-3">
      <Link to={`/product/${product.produce_id}`}>
        <Card.Img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          variant="top"
          className="product-card-img"
        />
      </Link>
      <Card.Body>
        <Link
          to={`/product/${product.produce_id}`}
          className="text-decoration-none"
        >
          <Card.Title as="div">
            <strong>{product.name}</strong>
          </Card.Title>
        </Link>
        <Card.Text as="div" className="my-2">
          <small className="text-muted">Sold by {product.farmer_name}</small>
        </Card.Text>
        <Card.Text as="h5" className="text-green-dark">
          {formatKsh(product.price)}
        </Card.Text>
        <Card.Text as="div">
          <span className={`stock-pill ${Number(product.quantity) > 0 ? '' : 'out'}`}>
            {Number(product.quantity) > 0 ? `${product.quantity} available` : 'Sold out'}
          </span>
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;