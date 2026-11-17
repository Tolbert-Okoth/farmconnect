import React, { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
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
        <section className="soko-hero">
          <div>
            <span className="soko-kicker">Market day, every day</span>
            <h1>
              Straight from the shamba, <em>to your door.</em>
            </h1>
            <p className="soko-hero-lede">
              Buy fresh produce directly from Kenyan farmers. No middlemen, fair prices for growers,
              and you pay securely with M-Pesa when you&apos;re ready.
            </p>
            <div className="soko-hero-actions">
              <a href="#market" className="btn btn-secondary">Browse the market</a>
              <Link to="/register" className="btn btn-light">Sell your harvest</Link>
            </div>
          </div>
          <aside className="soko-board" aria-label="How it works">
            <h2>How soko day works</h2>
            <ol>
              <li><div><strong>Pick from a farm</strong><span>Choose produce and how much you need.</span></div></li>
              <li><div><strong>Confirm delivery</strong><span>Tell the farmer where to bring it.</span></div></li>
              <li><div><strong>Pay with M-Pesa</strong><span>Approve the prompt on your phone.</span></div></li>
            </ol>
          </aside>
        </section>
      )}
      <div className="section-head" id="market">
        <h2>{keyword ? <>Results for &ldquo;{keyword}&rdquo;</> : 'Fresh on the stalls'}</h2>
        {!loading && !error && <p>{products.length} listing{products.length === 1 ? '' : 's'}</p>}
      </div>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Row>
          {products.length === 0 && (
            <Col xs={12}>
              <div className="soko-empty">
                <strong>The stalls are empty</strong>
                {keyword ? 'Nothing matches that search. Try another crop.' : 'Farmers are restocking. Check back soon.'}
              </div>
            </Col>
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