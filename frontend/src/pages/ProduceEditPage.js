/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Image } from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import api from '../api/axiosConfig';
import { toast } from 'react-toastify';

const ProduceEditPage = () => {
  const { id } = useParams();
  const isNewProduct = !id;
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNewProduct) {
      const fetchProduce = async () => {
        try {
          setLoading(true);
          const { data } = await api.get(`/produce/${id}`);
          setName(data.name);
          setDescription(data.description);
          setPrice(data.price);
          setQuantity(data.quantity);
          setImagePreview(data.image_url);
          setLoading(false);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch produce');
          setLoading(false);
        }
      };
      fetchProduce();
    }
  }, [id, isNewProduct]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file); // Store the file object
      setImagePreview(URL.createObjectURL(file)); // Create a local preview
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // We must use FormData because we are (potentially) sending a file
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('quantity', quantity);
    if (image) {
      // Only append the image if a new one was selected
      formData.append('image', image);
    }

    try {
      if (isNewProduct) {
        // --- CREATE NEW PRODUCE ---
        if (!image) {
          setError('An image is required for a new listing.');
          setLoading(false);
          return;
        }
        await api.post('/produce', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Produce listed successfully!');
      } else {
        // --- UPDATE EXISTING PRODUCE ---
        // We now use api.put with FormData
        await api.put(`/produce/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Produce updated successfully!');
      }
      setLoading(false);
      navigate('/farmer/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Operation failed';
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <Link to="/farmer/dashboard" className="btn btn-light my-3">
        Go Back
      </Link>
      <h1 className="text-green-dark">
        {isNewProduct ? 'Create Produce' : 'Edit Produce'}
      </h1>
      {loading && <Loader />}
      {error && <Message variant="danger">{error}</Message>}
      <Form onSubmit={submitHandler}>
        <Form.Group controlId="name" className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter produce name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="description" className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="price" className="mb-3">
          <Form.Label>Price (Ksh)</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="quantity" className="mb-3">
          <Form.Label>Quantity (e.g., "50 kgs", "10 crates")</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId="image" className="mb-3">
          <Form.Label>Image</Form.Label>
          <Form.Control
            type="file"
            onChange={handleImageChange}
            accept="image/*"
            // ** FIX: We removed the 'disabled' prop **
          ></Form.Control>
          {uploading && <Loader />}
        </Form.Group>

        {imagePreview && (
          <div className="mb-3">
            <p>{isNewProduct ? 'New Image Preview:' : 'Image Preview:'}</p>
            <Image
              src={imagePreview}
              alt="Produce preview"
              fluid
              rounded
              width={200}
            />
          </div>
        )}

        <Button type="submit" variant="primary" className="w-100">
          {isNewProduct ? 'Create' : 'Update Produce'}
        </Button>
      </Form>
    </div>
  );
};

export default ProduceEditPage;