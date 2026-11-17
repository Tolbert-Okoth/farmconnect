import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import Message from '../components/Message';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { keyword } = useParams();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = keyword ? { search: keyword } : {};
        const { data } = await api.get('/produce', { params });
        setProducts(data);
        setLoading(false);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Could not fetch produce listings'
        );
        setLoading(false);
      }
    };
    fetchProducts();
  }, [keyword]);

  return (
    <>
      {!keyword && (
        <section className="home-hero">
          <div>
            <p className="home-hero-eyebrow">Farm to buyer, no middlemen</p>
            <h1>Buy fresh produce straight from Kenyan farmers.</h1>
            <p className="home-hero-lede">
              Order from local farms, confirm your delivery address, and pay securely with M-Pesa.
              Farmers see every order and get paid out from their wallet.
            </p>
          </div>
          <ul className="home-hero-steps">
            <li><span>1</span>Pick produce and quantity</li>
            <li><span>2</span>Confirm where to deliver</li>
            <li><span>3</span>Pay with M-Pesa on your phone</li>
          </ul>
        </section>
      )}
      <h2 className="text-green-dark section-title">
        {keyword ? `Results for “${keyword}”` : 'Latest produce'}
      </h2>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Row>
          {products.length === 0 && (
            <Message>No produce found. Check back later!</Message>
          )}
          {products.map((product) => (
            <Col key={product.produce_id} sm={12} md={6} lg={4} xl={3}>
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      )}
    </>
  );
};

export default HomePage;