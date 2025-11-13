import React, { useState, useEffect, useRef } from 'react';
import {
  useParams,
  useNavigate,
  Link,
} from 'react-router-dom';
import {
  Row,
  Col,
  ListGroup,
  Image,
  Card,
  Button,
  Form,
  Modal,
  Spinner, // <-- THIS IS THE FIX
} from 'react-bootstrap';
import api from '../api/axiosConfig';
import Loader from '../components/Loader';
import Message from '../components/Message';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';

const OrderPage = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [phone, setPhone] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [address, setAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef(null);

  const { id: orderId } = useParams();
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const fetchOrder = React.useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data);
      setAddress(data.delivery_address || ''); 
      setLoading(false);

      if (data.status !== 'pending') {
        setIsPolling(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch order');
      setLoading(false);
      setIsPolling(false);
    }
  }, [orderId]);


  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return; 
    }
    setLoading(true);
    fetchOrder();
  }, [orderId, userInfo, navigate, fetchOrder]);


  useEffect(() => {
    if (isPolling && order?.status === 'pending') {
      pollingIntervalRef.current = setInterval(() => {
        console.log('Polling for order status...');
        fetchOrder(); 
      }, 5000); 
    }

    return () => {
      if (pollingIntervalRef.current) {
        console.log('Clearing polling interval.');
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isPolling, order, fetchOrder]); 


  const handlePayment = async (e) => {
    e.preventDefault();
    if (!phone) {
      toast.error('Please enter your Mpesa phone number');
      return;
    }
    setPaymentLoading(true);
    try {
      const { data } = await api.post('/payments/stkpush', {
        order_id: orderId,
        phone: phone,
      });

      if (data.ResponseCode === '0') {
         toast.success('STK Push sent! Check your phone to enter your PIN. This page will update automatically.');
         setIsPolling(true);
      } else {
         toast.error(data.ResponseDescription || 'Payment initiation failed.');
      }
      setPaymentLoading(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
      setPaymentLoading(false);
    }
  };
  
  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    setLocationLoading(true);
    try {
      const { data } = await api.put(`/orders/${orderId}/location`, { address });
      setOrder(data); 
      toast.success('Location confirmed!');
      setLocationLoading(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm location');
      setLocationLoading(false);
    }
  };
  
  const handleStatusUpdate = async (newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      setOrder({ ...order, status: newStatus });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    setRefundLoading(true);
    try {
      await api.post('/refunds/request', {
        order_id: orderId,
        reason: refundReason,
      });
      toast.success('Refund request submitted successfully!');
      setShowRefundModal(false);
      setRefundLoading(false);
      navigate('/buyer/refunds');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
      setRefundLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      setDeleteLoading(true);
      try {
        await api.delete(`/orders/${orderId}`);
        toast.success('Order cancelled successfully.');
        navigate('/buyer/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to cancel order');
        setDeleteLoading(false);
      }
    }
  };


  return loading ? (
    <Loader />
  ) : error ? (
    <Message variant="danger">{error}</Message>
  ) : !order ? (
    <Message variant="danger">Order not found.</Message>
  ) : (
    <>
      <Row>
        <Col md={8}>
           <ListGroup variant="flush">
            <ListGroup.Item>
                <h2 className="text-green-dark">Order {order.order_id.substring(0, 8)}...</h2>
                 {userInfo.role === 'farmer' ? (
                  <p><strong>Buyer: </strong> {order.buyer_name} ({order.buyer_email})</p>
                ) : (
                  <p><strong>Farmer: </strong> {order.farmer_name}</p>
                )}
                 <Message variant={
                    order.status === 'delivered' ? 'success' :
                    order.status === 'paid' ? 'info' :
                    order.status === 'pending' ? 'warning' : 'danger'
                 }>
                    Status: {order.status}
                    {isPolling && order.status === 'pending' && (
                      <Spinner animation="border" size="sm" className="ms-2" />
                    )}
                 </Message>
            </ListGroup.Item>
            
            <ListGroup.Item>
              <h2 className="text-green-dark">Delivery Address</h2>
              {order.location_confirmed ? (
                <p>{order.delivery_address}</p>
              ) : (
                <p>
                  <Message variant="warning">Please confirm your delivery address to proceed to payment.</Message>
                </p>
              )}
            </ListGroup.Item>
            
            <ListGroup.Item>
              <h2 className="text-green-dark">Order Items</h2>
                <Row>
                  <Col md={2}><Image src={order.image_url} alt={order.produce_name} fluid rounded /></Col>
                  <Col><Link to={`/product/${order.produce_id}`}>{order.produce_name}</Link></Col>
                  <Col md={4}>{order.quantity_ordered} x Ksh {order.total_price / order.quantity_ordered} ={' '}<strong>Ksh {order.total_price}</strong></Col>
                </Row>
            </ListGroup.Item>
          </ListGroup>
        </Col>

        <Col md={4}>
          <Card>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h2 className="text-green-dark">Order Summary</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row><Col>Total</Col><Col>Ksh {order.total_price}</Col></Row>
              </ListGroup.Item>

              {userInfo.role === 'buyer' && order.status === 'pending' && (
                <>
                  <ListGroup.Item>
                    <Button
                      type="button"
                      variant="outline-danger"
                      className="w-100"
                      onClick={handleDeleteOrder}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'Cancelling...' : 'Cancel Order'}
                    </Button>
                  </ListGroup.Item>
                  
                  <ListGroup.Item>
                    {!order.location_confirmed ? (
                      <>
                        <h5 className="text-green-dark">Confirm Location</h5>
                        <Form onSubmit={handleLocationSubmit}>
                          <Form.Group controlId="address" className="mb-3">
                            <Form.Label>Delivery Address</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              placeholder="Enter your full delivery address"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              required
                            ></Form.Control>
                          </Form.Group>
                          <Button
                            type="submit"
                            className="w-100"
                            disabled={locationLoading}
                          >
                            {locationLoading ? 'Saving...' : 'Confirm Address'}
                          </Button>
                        </Form>
                      </>
                    ) : (
                      <>
                        <h5 className="text-green-dark">Pay with Mpesa</h5>
                        <Form onSubmit={handlePayment}>
                           <Form.Group controlId="phone" className="mb-3">
                            <Form.Label>Mpesa Phone Number</Form.Label>
                            <Form.Control
                              type="tel"
                              placeholder="e.g., 2547XXXXXXXX"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              required
                            ></Form.Control>
                          </Form.Group>
                          <Button
                            type="submit"
                            className="w-100"
                            disabled={paymentLoading || isPolling} // Disable button while polling
                          >
                            {isPolling ? 'Confirming...' : (paymentLoading ? <Loader /> : 'Pay Now')}
                          </Button>
                        </Form>
                      </>
                    )}
                  </ListGroup.Item>
                </>
              )}
              
              {userInfo.role === 'buyer' &&
                (order.status === 'paid' || order.status === 'delivered') && (
                  <ListGroup.Item>
                    <Button
                      type="button"
                      variant="outline-danger"
                      className="w-100"
                      onClick={() => setShowRefundModal(true)}
                    >
                      Request Refund
                    </Button>
                  </ListGroup.Item>
                )}
                
              {userInfo.role === 'farmer' && (
                <ListGroup.Item>
                  <h5 className="text-green-dark">Update Status</h5>
                  {order.status === 'paid' && (
                    <Button
                      type="button"
                      className="w-100"
                      onClick={() => handleStatusUpdate('delivered')}
                    >
                      Mark as Delivered
                    </Button>
                  )}
                  {order.status === 'pending' && (
                    <Button
                      type="button"
                      variant="danger"
                      className="w-100"
                      onClick={() => handleStatusUpdate('cancelled')}
                    >
                      Cancel Order
                    </Button>
                  )}
                  {order.status === 'delivered' && (
                    <Message variant="success">Order Completed</Message>
                  )}
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-green-dark">Request Refund</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRefundSubmit}>
          <Modal.Body>
            <p>You are requesting a refund for:</p>
            <p>
              <strong>{order.produce_name}</strong> (Ksh {order.total_price})
            </p>
            <Form.Group controlId="refundReason">
              <Form.Label>
                Please provide a reason for your request (e.g., "product was
                spoiled", "wrong item delivered").
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowRefundModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={refundLoading}>
              {refundLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default OrderPage;