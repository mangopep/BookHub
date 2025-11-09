import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io, Socket } from 'socket.io-client';
import type { Server } from 'http';
import express, { type Express } from 'express';
import { registerRoutes } from '../../../server/routes';
import request from 'supertest';

describe('WebSocket Real-time Integration Tests', () => {
  let server: Server;
  let app: Express;
  let clientSocket: Socket;
  let authToken: string;

  beforeAll(async () => {
    app = express();
    server = await registerRoutes(app);

    const address = server.address();
    const port = typeof address === 'string' ? address : address?.port;

    // Login with the default admin account
    const loginResponse = await request(server)
      .post('/api/auth/login')
      .send({ email: 'admin@bookhub.com', password: 'admin123' });
    
    authToken = loginResponse.body.token;

    clientSocket = io(`http://localhost:${port}`, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: false,
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket connection timeout')), 5000);
      clientSocket.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      clientSocket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }, 30000);

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  it('should broadcast book:created event when book is added', () => {
    return new Promise<void>((resolve) => {
      const newBook = {
        title: 'WebSocket Test Book',
        author: 'Test Author',
        genre: 'Testing',
        year: 2024,
        price: 699,
        isbn: '9876543210',
        stock: 15,
      };

      clientSocket.once('book:created', (book) => {
        expect(book.title).toBe('WebSocket Test Book');
        expect(book.author).toBe('Test Author');
        expect(book.genre).toBe('Testing');
        expect(book.price).toBe(699);
        resolve();
      });

      request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newBook)
        .end(() => {});
    });
  });

  it('should broadcast book:updated event when book is updated', async () => {
    const createRes = await request(server)
      .post('/api/books')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Original Title',
        author: 'Author Name',
        genre: 'Fiction',
        year: 2024,
        price: 299,
        isbn: '1234567890',
        stock: 10,
      });

    const bookId = createRes.body.id;

    return new Promise<void>((resolve) => {
      clientSocket.once('book:updated', (book) => {
        expect(book.id).toBe(bookId);
        expect(book.title).toBe('Modified Title');
        resolve();
      });

      request(server)
        .put(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Modified Title' })
        .end(() => {});
    });
  });

  it('should broadcast book:deleted event when book is deleted', async () => {
    const createRes = await request(server)
      .post('/api/books')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Book to Delete',
        author: 'Author Name',
        genre: 'Fiction',
        year: 2024,
        price: 299,
        isbn: '0987654321',
        stock: 10,
      });

    const bookId = createRes.body.id;

    return new Promise<void>((resolve) => {
      clientSocket.once('book:deleted', (data) => {
        expect(data.id).toBe(bookId);
        expect(data.title).toBe('Book to Delete');
        resolve();
      });

      request(server)
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .end(() => {});
    });
  });

  it('should handle multiple clients receiving the same event', async () => {
    const address = server.address();
    const port = typeof address === 'string' ? address : address?.port;

    const clientSocket2 = io(`http://localhost:${port}`, {
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      clientSocket2.on('connect', () => resolve());
    });

    const eventReceived1 = new Promise<void>((resolve) => {
      clientSocket.once('book:created', () => resolve());
    });

    const eventReceived2 = new Promise<void>((resolve) => {
      clientSocket2.once('book:created', () => resolve());
    });

    await request(server)
      .post('/api/books')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Multi-Client Test',
        author: 'Test Author',
        genre: 'Testing',
        year: 2024,
        price: 399,
        isbn: '5555555555',
        stock: 20,
      });

    await Promise.all([eventReceived1, eventReceived2]);

    clientSocket2.disconnect();
  });

  it('should not broadcast events when creation fails', async () => {
    let eventReceived = false;

    const timeout = new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 500);
    });

    clientSocket.once('book:created', () => {
      eventReceived = true;
    });

    await request(server)
      .post('/api/books')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '',
        author: 'Test',
        genre: 'Fiction',
        year: 2024,
        price: 299,
        stock: 10,
      })
      .expect(400);

    await timeout;

    expect(eventReceived).toBe(false);
  });
});
