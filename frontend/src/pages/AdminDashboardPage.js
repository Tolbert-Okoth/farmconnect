/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Table, Tab, Nav } from 'react-bootstrap';
import api from '../api/axiosConfig';
import Loader from '../components/Loader';
import Message from '../components/Message';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AdminDashboardPage = () => {
  const [payouts, setPayouts] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { userInfo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo || !userInfo.is_admin) {
      navigate('/login');
    } else {
      fetchData();
    }
  }, [userInfo, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: payoutsData } = await api.get('/admin/payouts');
      setPayouts(payoutsData);

      const { data: refundsData } = await api.get('/admin/refunds');
      setRefunds(refundsData);

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
      setLoading(false);
    }
  };

  const handlePayoutComplete = async (id) => {
    if (window.confirm('Have you manually sent this M-Pesa payment? This action cannot be undone.')) {
      try {
        await api.put(`/admin/payouts/${id}/complete`);
        toast.success('Payout marked as complete');
        fetchData(); // Refresh lists
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update');
      }
    }
  };

  const handleRefundProcess = async (id, status) => {
    const action = status === 'approved' ? 'approve' : 'reject';
    if (window.confirm(`Are you sure you want to ${action} this refund request?`)) {
      try {
        await api.put(`/admin/refunds/${id}`, { status });
        toast.success(`Refund ${status}!`);
        fetchData(); // Refresh lists
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update');
      }
    }
  };

  return (
    <>
      <h1 className="text-green-dark">Admin Dashboard</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Tab.Container defaultActiveKey="payouts">
          <Nav variant="pills" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="payouts">
                Pending Payouts <span className="badge bg-warning">{payouts.length}</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="refunds">
                Pending Refunds <span className="badge bg-warning">{refunds.length}</span>
              </Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content>
            <Tab.Pane eventKey="payouts">
              <PendingPayouts payouts={payouts} onComplete={handlePayoutComplete} />
            </Tab.Pane>
            <Tab.Pane eventKey="refunds">
              <PendingRefunds refunds={refunds} onProcess={handleRefundProcess} />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      )}
    </>
  );
};

// Sub-component for Payouts
const PendingPayouts = ({ payouts, onComplete }) => (
  <Table striped bordered hover responsive className="table-sm bg-white">
    <thead>
      <tr>
        <th>FARMER</th>
        <th>PHONE</th>
        <th>AMOUNT</th>
        <th>REQUESTED ON</th>
        <th>ACTION</th>
      </tr>
    </thead>
    <tbody>
      {payouts.length === 0 && (
        <tr>
          <td colSpan="5" className="text-center">No pending payouts.</td>
        </tr>
      )}
      {payouts.map((payout) => (
        <tr key={payout.payout_id}>
          <td>{payout.farmer_name}</td>
          <td>{payout.phone_number}</td>
          <td>Ksh {payout.amount}</td>
          <td>{new Date(payout.requested_at).toLocaleString()}</td>
          <td>
            <Button
              variant="success"
              className="btn-sm"
              onClick={() => onComplete(payout.payout_id)}
            >
              Mark as Completed
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
);

// Sub-component for Refunds
const PendingRefunds = ({ refunds, onProcess }) => (
  <Table striped bordered hover responsive className="table-sm bg-white">
    <thead>
      <tr>
        <th>BUYER</th>
        <th>PRODUCE</th>
        <th>AMOUNT</th>
        <th>RECEIPT</th>
        <th>REASON</th>
        <th>ACTION</th>
      </tr>
    </thead>
    <tbody>
      {refunds.length === 0 && (
        <tr>
          <td colSpan="6" className="text-center">No pending refunds.</td>
        </tr>
      )}
      {refunds.map((refund) => (
        <tr key={refund.request_id}>
          <td>{refund.buyer_name}</td>
          <td>{refund.produce_name}</td>
          <td>Ksh {refund.total_price}</td>
          <td>{refund.mpesa_receipt}</td>
          <td>{refund.reason}</td>
          <td>
            <Button
              variant="success"
              className="btn-sm me-2"
              onClick={() => onProcess(refund.request_id, 'approved')}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              className="btn-sm"
              onClick={() => onProcess(refund.request_id, 'rejected')}
            >
              Reject
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
);

export default AdminDashboardPage;