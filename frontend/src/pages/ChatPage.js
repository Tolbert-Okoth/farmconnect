import React, { useState, useEffect } from 'react';
import { Row, Col, ListGroup, Form, Button, Card } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Loader from '../components/Loader';
import Message from '../components/Message';
import useAuth from '../hooks/useAuth';
import { toast } from 'react-toastify';

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activePartner, setActivePartner] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { userId } = useParams();
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  // Fetch conversation list
  useEffect(() => {
    if (!userInfo) navigate('/login');
    
    const fetchConversations = async () => {
      try {
        const { data } = await api.get('/inquiries');
        setConversations(data);
        
        if (userId) {
            // Check if this user is already in our list
            const partner = data.find(c => c.partner_id === userId);
            if(partner) {
                 setActivePartner(partner);
            } else {
                // This is a new conversation, create a temporary partner object
                // We'd need to fetch their username from a /api/users/:id route
                // For now, we'll just use the ID
                 setActivePartner({ partner_id: userId, partner_username: `User ${userId.substring(0, 6)}...`});
            }
        } else if (data.length > 0) {
            // Default to first conversation
            setActivePartner(data[0]);
        }
      } catch (err) {
        toast.error('Could not fetch conversations');
      }
    };
    fetchConversations();
  }, [userInfo, navigate, userId]);

  // Fetch messages for the active conversation
  useEffect(() => {
    if (activePartner) {
      const fetchMessages = async () => {
        setLoading(true);
        try {
          const { data } = await api.get(`/inquiries/${activePartner.partner_id}`);
          setMessages(data);
          setLoading(false);
        } catch (err) {
          toast.error('Could not fetch messages');
          setLoading(false);
        }
      };
      fetchMessages();
    }
  }, [activePartner]);

  const sendMessageHandler = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { data } = await api.post('/inquiries', {
        receiver_id: activePartner.partner_id,
        content: newMessage,
      });
      setMessages([...messages, data]);
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  return (
    <Row>
      <Col md={4}>
        <h2 className="text-green-dark">Conversations</h2>
        <ListGroup>
          {conversations.length === 0 && <Message>No conversations.</Message>}
          {conversations.map((convo) => (
            <ListGroup.Item
              key={convo.partner_id}
              action
              active={activePartner?.partner_id === convo.partner_id}
              onClick={() => setActivePartner(convo)}
            >
              <strong>{convo.partner_username}</strong>
              <p className="mb-0 text-muted text-truncate">{convo.last_message}</p>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Col>
      <Col md={8}>
        {activePartner ? (
          <Card className="chat-window" style={{ height: '70vh' }}>
            <Card.Header>
              <h4 className="text-green-dark mb-0">Chat with {activePartner.partner_username}</h4>
            </Card.Header>
            <Card.Body style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {loading ? <Loader /> : (
                    <div className="flex-grow-1">
                        {messages.map((msg) => (
                        <div 
                            key={msg.message_id} 
                            className={`d-flex ${msg.sender_id === userInfo._id ? 'justify-content-end' : ''}`}
                        >
                            <div 
                            className={`p-2 my-1 rounded ${
                                msg.sender_id === userInfo._id ? 'bg-primary text-white' : 'bg-light'
                            }`}
                            style={{ maxWidth: '70%' }}
                            >
                            {msg.content}
                            <div className="text-end" style={{ fontSize: '0.7rem' }}>
                                <small>{new Date(msg.created_at).toLocaleTimeString()}</small>
                            </div>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
            </Card.Body>
            <Card.Footer>
              <Form onSubmit={sendMessageHandler} className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="submit" variant="primary" className="ms-2">Send</Button>
              </Form>
            </Card.Footer>
          </Card>
        ) : (
          <Message>Select a conversation to start chatting.</Message>
        )}
      </Col>
    </Row>
  );
};

export default ChatPage;