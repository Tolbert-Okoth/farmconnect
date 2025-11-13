import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { Row, Col, Card, ListGroup, Form, Button, Table } from 'react-bootstrap';
import api from '../api/axiosConfig';
import Loader from '../components/Loader';
import Message from '../components/Message';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const FarmerWalletPage = () => {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  const { userInfo } = useAuth();

  // **THE FIX: Wrap fetch in useCallback**
  const fetchData = useCallback(async () => {
    // 1. Check for userInfo
    if (!userInfo) {
      return;
    }

    try {
      setLoading(true);
      const { data: summaryData } = await api.get('/payouts/summary');
      const { data: historyData } = await api.get('/payouts/history');
      setSummary(summaryData);
      setHistory(historyData);
      setPhone(userInfo.phone_number || '');
      setLoading(false);
    } catch (err) {
      if (err.message !== 'Cannot read properties of null') {
        setError(err.response?.data?.message || 'Failed to load wallet data');
      }
      setLoading(false);
    }
  }, [userInfo]); // 2. Depends on userInfo

  useEffect(() => {
    // 3. We only need to call fetchData, it has the check inside it
    fetchData();
  }, [fetchData]); // 4. Add to dependency array

  const requestPayoutHandler = async (e) => {
    e.preventDefault();
    setPayoutLoading(true);
    try {
      await api.post('/payouts/request', {
        amount: parseFloat(amount),
        phone,
      });
      toast.success('Payout request submitted successfully!');
      setAmount('');
      fetchData(); // Refresh summary and history
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payout request failed');
    }
    setPayoutLoading(false);
  };

  return (
    <>
      <Link to="/farmer/dashboard" className="btn btn-light my-3">
        Go Back
      </Link>
      <h1 className="text-green-dark">My Wallet</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        summary && (
          <Row>
            <Col md={8}>
              <Card className="mb-3">
                <Card.Header>Request Payout</Card.Header>
                <Card.Body>
                  <Card.Title>
                    Available for Payout:{' '}
                    <span className="text-green-dark">
                      Ksh {summary.availableBalance}
                    </span>
                  </Card.Title>
                  <Form onSubmit={requestPayoutHandler}>
                    <Form.Group controlId="phone" className="mb-3">
                      <Form.Label>M-Pesa Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        placeholder="e.g., 2547XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </Form.Group>
                    <Form.Group controlId="amount" className="mb-3">
                      <Form.Label>Amount (Ksh)</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        min="1"
                        max={summary.availableBalance}
                      />
                    </Form.Group>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={payoutLoading}
                    >
                      {payoutLoading ? 'Requesting...' : 'Request Payout'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>

              <h3 className="text-green-dark mt-4">Payout History</h3>
              <Table
                striped
                bordered
                hover
                responsive
                className="table-sm bg-white"
              >
                <thead>
                  <tr>
                    <th>REQUEST ID</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th>REQUESTED ON</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((payout) => (
                    <tr key={payout.payout_id}>
                      <td>{payout.payout_id.substring(0, 8)}...</td>
                      <td>Ksh {payout.amount}</td>
                      <td>
                        <span
                          className={`badge bg-${
                            payout.status === 'completed' ? 'success' : 'warning'
                          }`}
                        >
                          {payout.status}
                        </span>
                      </td>
                      <td>
                        {new Date(payout.requested_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
            <Col md={4}>
              <Card>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <h4 className="text-green-dark">Earnings Summary</h4>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    Total Value of Sales:{' '}
                    <span className="float-end">
                      Ksh {summary.totalEarned}
                    </span>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    Platform Fee (10%):{' '}
                    <span className="float-end">
                      -Ksh {(summary.totalEarned * 0.1).toFixed(2)}
                    </span>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Net Earnings:</strong>{' '}
                    <strong className="float-end">
                      Ksh {summary.netEarned}
                    </strong>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    Total Withdrawn:{' '}
                    <span className="float-end text-danger">
                      -Ksh {summary.totalWithdrawn}
                    </span>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    Pending Payout:{' '}
                    <span className="float-end text-warning">
                      -Ksh {summary.pendingWithdrawal}
                    </span>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <h5 className="text-success">Available Balance:</h5>{' '}
                    <h5 className="float-end text-success">
                      Ksh {summary.availableBalance}
                    </h5>
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            </Col>
          </Row>
        )
      )}
    </>
  );
};

export default FarmerWalletPage;