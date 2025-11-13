/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Table, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Loader from '../components/Loader';
import Message from '../components/Message';
import useAuth from '../hooks/useAuth';

const RefundsDashboardPage = () => {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { userInfo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'buyer') {
      navigate('/login');
    } else {
      const fetchMyRequests = async () => {
        try {
          setLoading(true);
          const { data } = await api.get('/refunds/myrequests');
          setMyRequests(data);
          setLoading(false);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch requests');
          setLoading(false);
        }
      };
      fetchMyRequests();
    }
  }, [userInfo, navigate]);

  return (
    <>
      <h1 className="text-green-dark">My Refund Requests</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : myRequests.length === 0 ? (
        <Message>
          You have not made any refund requests. You can request a refund from
          your <LinkContainer to="/buyer/dashboard"><a href="/buyer/dashboard">My Orders</a></LinkContainer> page.
        </Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm bg-white">
          <thead>
            <tr>
              <th>REQUEST ID</th>
              <th>PRODUCE</th>
              <th>AMOUNT</th>
              <th>REASON</th>
              <th>STATUS</th>
              <th>REQUESTED ON</th>
            </tr>
          </thead>
          <tbody>
            {myRequests.map((req) => (
              <tr key={req.request_id}>
                <td>{req.request_id.substring(0, 8)}...</td>
                <td>{req.produce_name}</td>
                <td>Ksh {req.total_price}</td>
                <td>{req.reason}</td>
                <td>
                  <span
                    className={`badge bg-${
                      req.status === 'approved'
                        ? 'success'
                        : req.status === 'pending'
                        ? 'warning'
                        : 'danger'
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td>{new Date(req.requested_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

export default RefundsDashboardPage;