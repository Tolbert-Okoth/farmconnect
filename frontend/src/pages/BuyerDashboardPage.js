import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import api from '../api/axiosConfig';
import Loader from '../components/Loader';
import Message from '../components/Message';
import useAuth from '../hooks/useAuth';

const BuyerDashboardPage = () => {
  // ... (all state and functions remain the same) ...
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const fetchMyOrders = useCallback(async () => {
    if (!userInfo || userInfo.role !== 'buyer') {
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get('/orders/myorders');
      setMyOrders(data);
      setLoading(false);
    } catch (err) {
      if (err.message !== 'Cannot read properties of null') {
        setError(err.response?.data?.message || 'Failed to fetch orders');
      }
      setLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'buyer') {
      navigate('/login');
    } else {
      fetchMyOrders();
    }
  }, [userInfo, navigate, fetchMyOrders]);
  
  // ...

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h1 className="text-green-dark">My Orders</h1>
        {/* ADD THIS LINK */}
        <Link to="/buyer/refunds" className="btn btn-light">
          My Refund Requests
        </Link>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : myOrders.length === 0 ? (
        <Message>You have not placed any orders yet.</Message>
      ) : (
        <Table
          striped
          bordered
          hover
          responsive
          className="table-sm bg-white mt-3"
        >
          {/* ... (rest of the table) ... */}
           <thead>
            <tr>
              <th>ORDER ID</th>
              <th>PRODUCE</th>
              <th>FARMER</th>
              <th>TOTAL</th>
              <th>STATUS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {myOrders.map((order) => (
              <tr key={order.order_id}>
                <td>{order.order_id.substring(0, 8)}...</td>
                <td>{order.produce_name}</td>
                <td>{order.farmer_name}</td>
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
                      View Details
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
};

export default BuyerDashboardPage;