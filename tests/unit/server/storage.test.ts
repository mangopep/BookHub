import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../../../server/storage';
import type { InsertBook, InsertUser, InsertOrder } from '../../../shared/schema';

describe('MemStorage - Book Operations', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  it('should create a new book', async () => {
    const bookData: InsertBook = {
      title: 'Test Book',
      author: 'Test Author',
      genre: 'Fiction',
      year: 2024,
      price: 299,
      stock: 10,
      isbn: '1234567890',
      description: 'A test book',
      coverUrl: 'https://example.com/cover.jpg',
    };

    const book = await storage.createBook(bookData);

    expect(book).toBeDefined();
    expect(book.id).toBeDefined();
    expect(book.title).toBe('Test Book');
    expect(book.author).toBe('Test Author');
    expect(book.createdAt).toBeDefined();
    expect(book.updatedAt).toBeDefined();
  });

  it('should retrieve a book by ID', async () => {
    const bookData: InsertBook = {
      title: 'Find Me',
      author: 'Seeker',
      genre: 'Mystery',
      year: 2024,
      price: 399,
      stock: 5,
    };

    const created = await storage.createBook(bookData);
    const retrieved = await storage.getBook(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Find Me');
  });

  it('should update a book', async () => {
    const book = await storage.createBook({
      title: 'Old Title',
      author: 'Author',
      genre: 'Fiction',
      year: 2024,
      price: 299,
      stock: 10,
    });

    const updated = await storage.updateBook(book.id, { title: 'New Title' });

    expect(updated?.title).toBe('New Title');
    expect(updated?.author).toBe('Author');
  });

  it('should delete a book', async () => {
    const book = await storage.createBook({
      title: 'Delete Me',
      author: 'Author',
      genre: 'Fiction',
      year: 2024,
      price: 299,
      stock: 10,
    });

    const deleted = await storage.deleteBook(book.id);
    const retrieved = await storage.getBook(book.id);

    expect(deleted).toBe(true);
    expect(retrieved).toBeUndefined();
  });

  it('should return all books', async () => {
    const books = await storage.getAllBooks();
    expect(Array.isArray(books)).toBe(true);
    expect(books.length).toBeGreaterThan(0);
  });

  it('should handle non-existent book retrieval', async () => {
    const book = await storage.getBook('non-existent-id');
    expect(book).toBeUndefined();
  });

  it('should handle non-existent book update', async () => {
    const updated = await storage.updateBook('non-existent-id', { title: 'New Title' });
    expect(updated).toBeUndefined();
  });

  it('should handle non-existent book deletion', async () => {
    const deleted = await storage.deleteBook('non-existent-id');
    expect(deleted).toBe(false);
  });
});

describe('MemStorage - User Operations', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  it('should create a new user', async () => {
    const userData: InsertUser = {
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      role: 'user',
      cart: [],
    };

    const user = await storage.createUser(userData);

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.createdAt).toBeDefined();
  });

  it('should retrieve a user by ID', async () => {
    const userData: InsertUser = {
      name: 'Find Me User',
      email: 'findme@example.com',
      passwordHash: 'hashed_password',
    };

    const created = await storage.createUser(userData);
    const retrieved = await storage.getUser(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Find Me User');
  });

  it('should retrieve a user by email', async () => {
    const userData: InsertUser = {
      name: 'Email User',
      email: 'email@example.com',
      passwordHash: 'hashed_password',
    };

    await storage.createUser(userData);
    const retrieved = await storage.getUserByEmail('email@example.com');

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Email User');
  });

  it('should update a user', async () => {
    const user = await storage.createUser({
      name: 'Old Name',
      email: 'old@example.com',
      passwordHash: 'hashed_password',
    });

    const updated = await storage.updateUser(user.id, { name: 'New Name' });

    expect(updated?.name).toBe('New Name');
    expect(updated?.email).toBe('old@example.com');
  });

  it('should delete a user', async () => {
    const user = await storage.createUser({
      name: 'Delete Me',
      email: 'delete@example.com',
      passwordHash: 'hashed_password',
    });

    const deleted = await storage.deleteUser(user.id);
    const retrieved = await storage.getUser(user.id);

    expect(deleted).toBe(true);
    expect(retrieved).toBeUndefined();
  });

  it('should return all users', async () => {
    await storage.createUser({
      name: 'User 1',
      email: 'user1@example.com',
      passwordHash: 'hashed_password',
    });
    await storage.createUser({
      name: 'User 2',
      email: 'user2@example.com',
      passwordHash: 'hashed_password',
    });

    const users = await storage.getAllUsers();
    expect(users.length).toBeGreaterThanOrEqual(2);
  });
});

describe('MemStorage - Order Operations', () => {
  let storage: MemStorage;
  let testUserId: string;
  let testBookId: string;

  beforeEach(async () => {
    storage = new MemStorage();
    
    const user = await storage.createUser({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
    });
    testUserId = user.id;

    const book = await storage.createBook({
      title: 'Test Book',
      author: 'Test Author',
      genre: 'Fiction',
      year: 2024,
      price: 299,
      stock: 10,
    });
    testBookId = book.id;
  });

  it('should create a new order', async () => {
    const orderData: InsertOrder = {
      userId: testUserId,
      orderNumber: '#TEST123',
      customerName: 'Test Customer',
      bookId: testBookId,
      bookTitle: 'Test Book',
      amount: 299,
      status: 'Pending',
    };

    const order = await storage.createOrder(orderData);

    expect(order).toBeDefined();
    expect(order.id).toBeDefined();
    expect(order.orderNumber).toBe('#TEST123');
    expect(order.createdAt).toBeDefined();
  });

  it('should retrieve an order by ID', async () => {
    const orderData: InsertOrder = {
      userId: testUserId,
      orderNumber: '#FIND123',
      customerName: 'Find Me',
      bookId: testBookId,
      bookTitle: 'Test Book',
      amount: 299,
      status: 'Pending',
    };

    const created = await storage.createOrder(orderData);
    const retrieved = await storage.getOrder(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.orderNumber).toBe('#FIND123');
  });

  it('should retrieve orders by user ID', async () => {
    await storage.createOrder({
      userId: testUserId,
      orderNumber: '#USER123',
      customerName: 'User Order',
      bookId: testBookId,
      bookTitle: 'Test Book',
      amount: 299,
      status: 'Pending',
    });

    const orders = await storage.getOrdersByUserId(testUserId);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders.some(o => o.orderNumber === '#USER123')).toBe(true);
  });

  it('should update order status', async () => {
    const order = await storage.createOrder({
      userId: testUserId,
      orderNumber: '#UPDATE123',
      customerName: 'Update Me',
      bookId: testBookId,
      bookTitle: 'Test Book',
      amount: 299,
      status: 'Pending',
    });

    const updated = await storage.updateOrderStatus(order.id, 'Completed');

    expect(updated?.status).toBe('Completed');
  });

  it('should delete an order', async () => {
    const order = await storage.createOrder({
      userId: testUserId,
      orderNumber: '#DELETE123',
      customerName: 'Delete Me',
      bookId: testBookId,
      bookTitle: 'Test Book',
      amount: 299,
      status: 'Pending',
    });

    const deleted = await storage.deleteOrder(order.id);
    const retrieved = await storage.getOrder(order.id);

    expect(deleted).toBe(true);
    expect(retrieved).toBeUndefined();
  });

  it('should get recent orders', async () => {
    const orders = await storage.getRecentOrders(5);
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeLessThanOrEqual(5);
  });

  it('should get all orders', async () => {
    const orders = await storage.getAllOrders();
    expect(Array.isArray(orders)).toBe(true);
  });
});

describe('MemStorage - Settings Operations', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  it('should retrieve settings', async () => {
    const settings = await storage.getSettings();
    expect(settings).toBeDefined();
    expect(settings.id).toBeDefined();
  });

  it('should update settings', async () => {
    const updated = await storage.updateSettings({
      newArrivalDuration: 14,
      newArrivalUnit: 'days',
    });

    expect(updated.newArrivalDuration).toBe(14);
    expect(updated.newArrivalUnit).toBe('days');
  });
});
