import React, { useState, useEffect } from 'react';
import {
  useParams,
  useNavigate,
  Link,
} from 'react-router-dom';
import { Button } from 'react-bootstrap';
import api from '../api/axiosConfig';
import Loader from '../components/Loader';
import Message from '../components/Message';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { formatKsh } from '../utils/format';

const ProductPage = () => {
  const [product, setProduct] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/produce/${id}`);
        setProduct(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not fetch product');
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const orderHandler = async () => {
    if (!userInfo) {
      navigate('/login?redirect=/product/' + id);
      return;
    }
    
    if (userInfo.role !== 'buyer') {
      toast.error('Only buyers can place orders.');
      return;
    }

    try {
      const orderData = {
        produce_id: product.produce_id,
        quantity_ordered: Math.min(Math.max(1, Math.floor(Number(quantity)) || 1), Math.max(1, Number(product.quantity) || 1)),
      };
      const { data } = await api.post('/orders', orderData);
      toast.success('Order placed successfully!');
      navigate(`/order/${data.order_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    }
  };

  const maxQty = Math.max(1, Number(product.quantity) || 1);
  const qty = Math.min(Math.max(1, Number(quantity) || 1), maxQty);
  const inStock = Number(product.quantity) > 0;

  return (
    <>
      <Link className="soko-back" to="/">
        <span aria-hidden="true">←</span> Back to the market
      </Link>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <div className="product-layout">
          <div className="product-photo">
            <div className="price-tag"><small>per unit</small>{formatKsh(product.price)}</div>
            <img src={product.image_url} alt={product.name} />
          </div>

          <div className="product-info">
            <span className={`stock-pill ${inStock ? '' : 'out'}`}>
              {inStock ? `${product.quantity} in stock` : 'Sold out'}
            </span>
            <h1>{product.name}</h1>
            <p className="product-farmer">Grown and sold by <strong>{product.farmer_name}</strong></p>
            {product.description && <p className="product-desc">{product.description}</p>}

            <div className="market-slip">
              <div className="market-slip-row">
                <span>Price per unit</span>
                <strong>{formatKsh(product.price)}</strong>
              </div>
              <div className="market-slip-row">
                <label htmlFor="qty">Quantity</label>
                <div className="qty-stepper">
                  <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, qty - 1))}>−</button>
                  <input id="qty" type="number" min="1" max={maxQty} value={quantity}
                    onChange={(e) => setQuantity(e.target.value)} onBlur={() => setQuantity(qty)} />
                  <button type="button" aria-label="Increase quantity" onClick={() => setQuantity(Math.min(maxQty, qty + 1))}>+</button>
                </div>
              </div>
              <div className="market-slip-row">
                <span>Total</span>
                <span className="market-slip-total">{formatKsh(Number(product.price) * qty)}</span>
              </div>
              <Button
                onClick={orderHandler}
                className="btn-primary w-100 mt-2"
                type="button"
                disabled={!inStock || userInfo?.role === 'farmer'}
              >
                {inStock ? 'Place order' : 'Sold out'}
              </Button>
              <Link
                className="btn btn-light w-100 mt-2"
                to={userInfo ? `/chat/${product.farmer_id}` : '/login'}
              >
                Message the farmer
              </Link>
              {userInfo?.role === 'farmer' && (
                <p className="text-muted small mt-2 mb-0">Farmer accounts can&apos;t place orders.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductPage;