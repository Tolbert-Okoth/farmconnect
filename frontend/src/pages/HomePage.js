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
      <h1 className="text-green-dark">Latest Produce</h1>
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