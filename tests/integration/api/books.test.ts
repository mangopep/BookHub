import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import express from 'express';
import { registerRoutes } from '../../../server/routes';
import type { Server } from 'http';

describe('Books API Integration Tests', () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server && server.close) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe('GET /api/books', () => {
    it('should return list of books', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return books with correct structure', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      if (response.body.length > 0) {
        const book = response.body[0];
        expect(book).toHaveProperty('id');
        expect(book).toHaveProperty('title');
        expect(book).toHaveProperty('author');
        expect(book).toHaveProperty('genre');
        expect(book).toHaveProperty('price');
      }
    });
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user account', async () => {
      const uniqueEmail = `test-${Date.now()}@example.com`;
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: uniqueEmail,
          password: 'test123456',
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(uniqueEmail);
    });

    it('should reject duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      
      await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'User One',
          email,
          password: 'test123456',
        })
        .expect(201);

      await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'User Two',
          email,
          password: 'test123456',
        })
        .expect(400);
    });

    it('should reject invalid email', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'test123456',
        })
        .expect(400);
    });

    it('should reject short password', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: '123',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const testEmail = `login-test-${Date.now()}@example.com`;
    const testPassword = 'test123456';

    beforeAll(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Login Test User',
          email: testEmail,
          password: testPassword,
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testEmail);
    });

    it('should reject incorrect password', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject non-existent email', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken: string;

    beforeAll(async () => {
      const email = `profile-test-${Date.now()}@example.com`;
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Profile Test User',
          email,
          password: 'test123456',
        });
      
      authToken = response.body.token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(200);
    });
  });

  describe('GET /api/books/search', () => {
    it('should search books with query parameter', async () => {
      const response = await request(app)
        .get('/api/books/search')
        .query({ q: 'Harry Potter' })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should reject search without query', async () => {
      await request(app)
        .get('/api/books/search')
        .expect(400);
    });
  });
});

describe('Admin Books API Tests', () => {
  let app: Express;
  let server: Server;
  let adminToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
    
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Login with the default admin account that exists in the seeded database
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@bookhub.com',
        password: 'admin123',
      });

    adminToken = loginResponse.body.token;
  });

  afterAll(async () => {
    if (server && server.close) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe('POST /api/books (Admin Only)', () => {
    it('should create a new book with admin auth', async () => {
      const newBook = {
        title: 'Integration Test Book',
        author: 'Test Author',
        genre: 'Testing',
        year: 2024,
        price: 599,
        stock: 20,
        isbn: '9999999999',
        description: 'A book for testing',
      };

      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newBook)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Integration Test Book');
    });

    it('should reject book creation without auth', async () => {
      const newBook = {
        title: 'Unauthorized Book',
        author: 'Test Author',
        genre: 'Testing',
        year: 2024,
        price: 599,
        stock: 20,
      };

      await request(app)
        .post('/api/books')
        .send(newBook)
        .expect(401);
    });

    it('should reject book with invalid data', async () => {
      const invalidBook = {
        title: '',
        author: 'Test Author',
        price: -100,
      };

      await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidBook)
        .expect(400);
    });
  });
});
