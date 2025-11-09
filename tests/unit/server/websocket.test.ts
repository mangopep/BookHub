import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer } from 'http';
import { setupWebSocket, broadcastBookCreated, broadcastBookUpdated, broadcastBookDeleted, getSocketIO, closeWebSocket } from '../../../server/websocket';
import type { Book } from '../../../shared/schema';

describe('WebSocket Broadcasting', () => {
  let mockServer: ReturnType<typeof createServer>;
  let mockIo: any;

  beforeEach(() => {
    mockServer = createServer();
    mockIo = setupWebSocket(mockServer);
  });

  afterEach(() => {
    closeWebSocket();
    if (mockServer) {
      mockServer.close();
    }
  });

  const createMockBook = (overrides?: Partial<Book>): Book => ({
    id: '123',
    title: 'Test Book',
    author: 'Test Author',
    genre: 'Fiction',
    year: 2024,
    price: 299,
    isbn: '1234567890',
    coverUrl: null,
    description: 'A test book',
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  it('should setup WebSocket server successfully', () => {
    expect(mockIo).toBeDefined();
    expect(getSocketIO()).toBeDefined();
  });

  it('should broadcast book created event', () => {
    const emitSpy = vi.spyOn(mockIo, 'emit');
    const book = createMockBook();
    
    broadcastBookCreated(book);
    
    expect(emitSpy).toHaveBeenCalledWith('book:created', book);
  });

  it('should broadcast book updated event', () => {
    const emitSpy = vi.spyOn(mockIo, 'emit');
    const book = createMockBook({ title: 'Updated Book' });
    
    broadcastBookUpdated(book);
    
    expect(emitSpy).toHaveBeenCalledWith('book:updated', book);
  });

  it('should broadcast book deleted event', () => {
    const emitSpy = vi.spyOn(mockIo, 'emit');
    const bookId = '123';
    const bookTitle = 'Test Book';
    const bookAuthor = 'Test Author';
    
    broadcastBookDeleted(bookId, bookTitle, bookAuthor);
    
    expect(emitSpy).toHaveBeenCalledWith('book:deleted', {
      id: bookId,
      title: bookTitle,
      author: bookAuthor,
    });
  });

  it('should include complete book data in broadcasts', () => {
    const emitSpy = vi.spyOn(mockIo, 'emit');
    const book = createMockBook({
      title: 'Complete Book',
      description: 'A complete test book with all fields',
      coverUrl: 'https://example.com/cover.jpg',
    });
    
    broadcastBookCreated(book);
    
    const [[event, data]] = emitSpy.mock.calls;
    expect(event).toBe('book:created');
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('author');
    expect(data).toHaveProperty('description');
    expect(data).toHaveProperty('coverUrl');
    expect(data).toHaveProperty('price');
    expect(data).toHaveProperty('stock');
  });

  it('should handle broadcasts when WebSocket is not initialized', () => {
    closeWebSocket();
    
    const book = createMockBook();
    expect(() => broadcastBookCreated(book)).not.toThrow();
    expect(() => broadcastBookUpdated(book)).not.toThrow();
    expect(() => broadcastBookDeleted('123')).not.toThrow();
  });

  it('should return socket.io instance from getSocketIO', () => {
    const io = getSocketIO();
    expect(io).toBe(mockIo);
    expect(io).toHaveProperty('emit');
    expect(io).toHaveProperty('on');
  });

  it('should properly close WebSocket connection', () => {
    const closeSpy = vi.spyOn(mockIo, 'close');
    closeWebSocket();
    expect(closeSpy).toHaveBeenCalled();
  });
});

describe('WebSocket Event Handling', () => {
  let mockServer: ReturnType<typeof createServer>;
  let mockIo: any;

  beforeEach(() => {
    mockServer = createServer();
    mockIo = setupWebSocket(mockServer);
  });

  afterEach(() => {
    closeWebSocket();
    if (mockServer) {
      mockServer.close();
    }
  });

  it('should register connection handler', () => {
    // Verify that the 'connection' event listener is registered
    const listeners = mockIo.listeners('connection');
    expect(listeners.length).toBeGreaterThan(0);
    expect(typeof listeners[0]).toBe('function');
    
    // Verify the socket.io instance is properly initialized
    expect(mockIo).toBeDefined();
    expect(getSocketIO()).toBe(mockIo);
  });

  it('should have proper CORS configuration', () => {
    expect(mockIo.opts).toHaveProperty('cors');
    expect(mockIo.opts.cors).toHaveProperty('credentials', true);
    expect(mockIo.opts.cors).toHaveProperty('methods');
  });

  it('should support websocket and polling transports', () => {
    expect(mockIo.opts.transports).toContain('websocket');
    expect(mockIo.opts.transports).toContain('polling');
  });
});
