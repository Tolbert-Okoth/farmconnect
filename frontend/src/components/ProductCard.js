import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <Card className="my-3 p-3">
      <Link to={`/product/${product.produce_id}`}>
        <Card.Img
          src={product.image_url}
          variant="top"
          style={{ height: '200px', objectFit: 'cover' }}
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
          Ksh {product.price}
        </Card.Text>
        <Card.Text as="div">
          <small>{product.quantity} available</small>
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;