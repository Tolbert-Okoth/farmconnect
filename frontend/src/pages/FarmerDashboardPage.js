import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { Table, Button, Row, Col } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Loader from '../components/Loader';
import Message from '../components/Message';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';

const FarmerDashboardPage = () => {
  const [myProduce, setMyProduce] = useState([]);
  const [farmOrders, setFarmOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('produce');

  const { userInfo } = useAuth();
  const navigate = useNavigate();

  // **THE FIX: Wrap fetchData in useCallback**
  const fetchData = useCallback(async () => {
    // 1. Check for userInfo *inside* the function.
    if (!userInfo || userInfo.role !== 'farmer') {
      return; // Do nothing if user is logged out
    }

    setLoading(true);
    try {
      // 2. We now know userInfo is safe to use
      const { data: produceData } = await api.get('/produce');
      const farmerProduce = produceData.filter(
        (p) => p.farmer_id === userInfo._id
      );
      setMyProduce(farmerProduce);

      const { data: ordersData } = await api.get('/orders/farmorders');
      setFarmOrders(ordersData);

      setLoading(false);
    } catch (err) {
      // Check if error is from user logging out mid-fetch
      if (err.message !== 'Cannot read properties of null') {
        setError(err.response?.data?.message || 'Failed to fetch data');
      }
      setLoading(false);
    }
  }, [userInfo]); // 3. Re-create this function *only* when userInfo changes

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'farmer') {
      navigate('/login');
    } else {
      fetchData();
    }
    // 4. Add fetchData to the dependency array
  }, [userInfo, navigate, fetchData]);

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.delete(`/produce/${id}`);
        toast.success('Produce deleted successfully');
        fetchData(); // This now safely calls the memoized function
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const createProduceHandler = () => {
    navigate('/farmer/produce/new/edit');
  };

  return (
    <Row>
      <Col md={3}>
        <h2 className="text-green-dark">Farmer Menu</h2>
        <Button
          variant={tab === 'produce' ? 'primary' : 'light'}
          className="w-100 mb-2"
          onClick={() => setTab('produce')}
        >
          My Produce Listings
        </Button>
        <Button
          variant={tab === 'orders' ? 'primary' : 'light'}
          className="w-100 mb-2"
          onClick={() => setTab('orders')}
        >
          My Farm Orders
        </Button>
        <LinkContainer to="/farmer/wallet">
          <Button variant="light" className="w-100 mb-2">
            <i className="fas fa-wallet"></i> My Wallet
          </Button>
        </LinkContainer>

        <Button
          variant="secondary"
          className="w-100 mt-4"
          onClick={createProduceHandler}
        >
          <i className="fas fa-plus"></i> Create New Listing
        </Button>
      </Col>
      <Col md={9}>
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : tab === 'produce' ? (
          <ProduceList produce={myProduce} deleteHandler={deleteHandler} />
        ) : (
          <OrderList orders={farmOrders} />
        )}
      </Col>
    </Row>
  );
};

// ... (ProduceList and OrderList sub-components remain the same) ...

// Sub-component for Produce List
const ProduceList = ({ produce, deleteHandler }) => (
  <>
    <h2 className="text-green-dark">My Produce Listings</h2>
    {produce.length === 0 ? (
      <Message>You have not listed any produce yet.</Message>
    ) : (
      <Table striped bordered hover responsive className="table-sm bg-white">
        <thead>
          <tr>
            <th>NAME</th>
            <th>PRICE</th>
            <th>QUANTITY</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {produce.map((p) => (
            <tr key={p.produce_id}>
              <td>{p.name}</td>
              <td>Ksh {p.price}</td>
              <td>{p.quantity}</td>
              <td>
                <LinkContainer to={`/farmer/produce/${p.produce_id}/edit`}>
                  <Button variant="light" className="btn-sm mx-1">
                    <i className="fas fa-edit"></i>
                  </Button>
                </LinkContainer>
                <Button
                  variant="danger"
                  className="btn-sm mx-1"
                  onClick={() => deleteHandler(p.produce_id)}
                >
                  <i className="fas fa-trash"></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    )}
  </>
);

// Sub-component for Order List
const OrderList = ({ orders }) => (
  <>
    <h2 className="text-green-dark">My Farm Orders</h2>
    {orders.length === 0 ? (
      <Message>You have no orders yet.</Message>
    ) : (
      <Table striped bordered hover responsive className="table-sm bg-white">
        <thead>
          <tr>
            <th>ORDER ID</th>
            <th>BUYER</th>
            <th>PRODUCE</th>
            <th>TOTAL</th>
            <th>STATUS</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.order_id}>
              <td>{order.order_id.substring(0, 8)}...</td>
              <td>{order.buyer_name}</td>
              <td>{order.produce_name}</td>
              <td>Ksh {order.total_price}</td>
              <td>
                <span
                  className={`badge bg-${
                    order.status === 'delivered'
                      ? 'success'
                      : order.status === 'paid'
                      ? 'info'
                      : order.status === 'pending'
                      ? 'warning'
                      : 'danger'
                  }`}
                >
                  {order.status}
                </span>
              </td>
              <td>
                <LinkContainer to={`/order/${order.order_id}`}>
                  <Button variant="light" className="btn-sm">
                    Details
                  </Button>
                </LinkContainer>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    )}
  </>
);

export default FarmerDashboardPage;