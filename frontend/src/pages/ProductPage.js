import React, { useState, useEffect } from 'react';
import {
  useParams,
  useNavigate,
  Link,
} from 'react-router-dom';
import {
  Row,
  Col,
  Image,
  ListGroup,
  Card,
  Button,
  Form,
} from 'react-bootstrap';
import api from '../api/axiosConfig';
import Loader from '../components/Loader';
import Message from '../components/Message';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';

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
        quantity_ordered: Number(quantity),
      };
      const { data } = await api.post('/orders', orderData);
      toast.success('Order placed successfully!');
      navigate(`/order/${data.order_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    }
  };

  return (
    <>
      <Link className="btn btn-light my-3" to="/">
        Go Back
      </Link>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Row>
          <Col md={6}>
            <Image src={product.image_url} alt={product.name} fluid rounded />
          </Col>
          <Col md={3}>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h3>{product.name}</h3>
              </ListGroup.Item>
              <ListGroup.Item>
                <h5 className="text-green-dark">Ksh {product.price}</h5>
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Quantity Available:</strong> {product.quantity}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Description:</strong> {product.description}
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col md={3}>
            <Card>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Row>
                    <Col>Price:</Col>
                    <Col>
                      <strong>Ksh {product.price}</strong>
                    </Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Status:</Col>
                    <Col>Available</Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Row>
                    <Col>Quantity:</Col>
                    <Col>
                      <Form.Control
                        as="input"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        max="100" // You can set this dynamically later
                      ></Form.Control>
                    </Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Button
                    onClick={orderHandler}
                    className="btn-primary w-100"
                    type="button"
                    disabled={userInfo?.role === 'farmer'}
                  >
                    Place Order
                  </Button>
                </ListGroup.Item>
                <ListGroup.Item>
                   <Link
                      className="btn btn-secondary w-100"
                      to={userInfo ? `/chat/${product.farmer_id}` : '/login'}
                    >
                      Contact Farmer
                    </Link>
                </ListGroup.Item>
              </ListGroup>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};

export default ProductPage;