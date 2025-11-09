import type { Express } from "express";
import { createServer, type Server } from "http";
import { initializeStorage, getStorage } from "./storage";
import { insertBookSchema, signupSchema, loginSchema, insertSettingsSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateToken, requireRole, type AuthRequest } from "./middleware/auth";
import { setupWebSocket, broadcastBookCreated, broadcastBookUpdated, broadcastBookDeleted } from "./websocket";
import { setupSwagger } from "./swagger";
import { metricsHandler, incrementBookOperation, incrementUserOperation, incrementAuthAttempt, incrementOrder } from "./metrics";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set');
}

export async function registerRoutes(app: Express): Promise<Server> {
  await initializeStorage();
  const storage = getStorage();

  setupSwagger(app);

  /**
   * @swagger
   * /api/auth/signup:
   *   post:
   *     summary: Register a new user account
   *     description: Create a new user account with name, email, and password. Returns user data and sets authentication cookie.
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - password
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 2
   *                 example: John Doe
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *               password:
   *                 type: string
   *                 minLength: 6
   *                 example: securePassword123
   *     responses:
   *       201:
   *         description: Account created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *                 token:
   *                   type: string
   *                   description: JWT token for API authentication (also set in httpOnly cookie)
   *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *       400:
   *         description: Validation error or email already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const result = signupSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }

      const { name, email, password } = result.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ name, email, passwordHash, role: 'user' });

      incrementUserOperation('signup');
      incrementAuthAttempt('success', 'user');

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET!,
        { expiresIn: '90d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 90 * 24 * 60 * 60 * 1000
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login to an existing account
   *     description: Authenticate with email and password. Returns user data and sets authentication cookie.
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *               password:
   *                 type: string
   *                 example: securePassword123
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *                 token:
   *                   type: string
   *                   description: JWT token for API authentication (also set in httpOnly cookie)
   *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }

      const { email, password } = result.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        incrementAuthAttempt('failure', 'user');
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        incrementAuthAttempt('failure', 'user');
        return res.status(401).json({ error: "Invalid email or password" });
      }

      incrementUserOperation('login');
      incrementAuthAttempt('success', user.role as 'user' | 'admin');

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET!,
        { expiresIn: '90d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 90 * 24 * 60 * 60 * 1000
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout from current session
   *     description: Clear authentication cookie and end user session.
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Success'
   */
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     summary: Get current user profile
   *     description: Retrieve the authenticated user's profile information.
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/auth/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  /**
   * @swagger
   * /api/cart:
   *   put:
   *     summary: Update shopping cart
   *     description: Update the current user's shopping cart with new items.
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - cart
   *             properties:
   *               cart:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/CartItem'
   *     responses:
   *       200:
   *         description: Cart updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 cart:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/CartItem'
   *       400:
   *         description: Invalid cart data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.put("/api/cart", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { cart } = req.body;
      if (!Array.isArray(cart)) {
        return res.status(400).json({ error: "Cart must be an array" });
      }

      const updatedUser = await storage.updateUser(req.user.id, { cart });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ cart: updatedUser.cart || [] });
    } catch (error) {
      console.error('Update cart error:', error);
      res.status(500).json({ error: "Failed to update cart" });
    }
  });

  /**
   * @swagger
   * /api/books/search:
   *   get:
   *     summary: Search books via Google Books API
   *     description: Search for books using Google Books API. Returns up to 20 results.
   *     tags: [Books]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query (book title, author, ISBN, etc.)
   *         example: The Great Gatsby
   *     responses:
   *       200:
   *         description: Search results from Google Books API
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *       400:
   *         description: Missing search query
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Failed to search books
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/books/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&printType=books`
      );

      if (!response.ok) {
        throw new Error("Google Books API request failed");
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Failed to search books:", error);
      res.status(500).json({ error: "Failed to search books from API" });
    }
  });

  /**
   * @swagger
   * /api/books/import:
   *   post:
   *     summary: Import a book from Google Books API
   *     description: Import a book from Google Books API into the catalog. Admin only. Checks for duplicates by ISBN or title+author+year.
   *     tags: [Books]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - volumeInfo
   *             properties:
   *               volumeInfo:
   *                 type: object
   *                 description: Book volume information from Google Books API
   *               saleInfo:
   *                 type: object
   *                 description: Sale information from Google Books API
   *     responses:
   *       201:
   *         description: Book imported successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Book'
   *       400:
   *         description: Invalid book data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: Book already exists
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                 existingBook:
   *                   $ref: '#/components/schemas/Book'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/books/import", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { volumeInfo, saleInfo } = req.body;

      if (!volumeInfo) {
        return res.status(400).json({ error: "Book data is required" });
      }

      const isbn13 = volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13');
      const isbn10 = volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10');
      const isbn = isbn13?.identifier || isbn10?.identifier || '';

      const year = volumeInfo.publishedDate 
        ? new Date(volumeInfo.publishedDate).getFullYear() 
        : new Date().getFullYear();

      const existingBooks = await storage.getAllBooks();
      const duplicate = existingBooks.find(b => {
        if (isbn && b.isbn && isbn === b.isbn) {
          return true;
        }
        
        const incomingTitle = volumeInfo.title?.toLowerCase()?.trim() || '';
        const incomingAuthor = volumeInfo.authors?.[0]?.toLowerCase()?.trim() || '';
        
        if (!incomingTitle || !incomingAuthor) {
          return false;
        }
        
        const existingTitle = b.title?.toLowerCase()?.trim() || '';
        const existingAuthor = b.author?.toLowerCase()?.trim() || '';
        
        const titleMatch = existingTitle === incomingTitle;
        const authorMatch = existingAuthor === incomingAuthor;
        const yearMatch = b.year === year;
        
        return titleMatch && authorMatch && yearMatch;
      });

      if (duplicate) {
        return res.status(409).json({ 
          error: "Book already exists in catalog",
          existingBook: duplicate 
        });
      }

      let price = 399;
      if (saleInfo?.listPrice?.amount) {
        if (saleInfo.listPrice.currencyCode === 'INR') {
          price = Math.round(saleInfo.listPrice.amount);
        } else if (saleInfo.listPrice.currencyCode === 'USD') {
          price = Math.round(saleInfo.listPrice.amount * 83);
        }
      }

      const bookData = {
        title: volumeInfo.title || 'Untitled',
        author: volumeInfo.authors?.[0] || 'Unknown Author',
        genre: volumeInfo.categories?.[0] || 'General',
        year,
        price,
        isbn,
        stock: 25,
        description: volumeInfo.description || '',
        coverUrl: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
      };

      const validatedData = insertBookSchema.parse(bookData);
      const book = await storage.createBook(validatedData);
      
      broadcastBookCreated(book);
      
      res.status(201).json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ error: "Invalid book data", details: error.errors });
      }
      console.error("Failed to import book:", error);
      res.status(500).json({ error: "Failed to import book" });
    }
  });

  /**
   * @swagger
   * /api/books:
   *   get:
   *     summary: Get all books
   *     description: Retrieve a list of all books in the catalog.
   *     tags: [Books]
   *     responses:
   *       200:
   *         description: List of all books
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Book'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/books", async (req, res) => {
    try {
      const books = await storage.getAllBooks();
      res.json(books);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch books" });
    }
  });

  /**
   * @swagger
   * /api/books/{id}:
   *   get:
   *     summary: Get a specific book by ID
   *     description: Retrieve detailed information about a specific book.
   *     tags: [Books]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Book ID
   *     responses:
   *       200:
   *         description: Book details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Book'
   *       404:
   *         description: Book not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/books/:id", async (req, res) => {
    try {
      const book = await storage.getBook(req.params.id);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch book" });
    }
  });

  /**
   * @swagger
   * /api/books:
   *   post:
   *     summary: Create a new book
   *     description: Add a new book to the catalog. Admin only. Broadcasts creation via WebSocket.
   *     tags: [Books]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - author
   *               - genre
   *               - year
   *               - price
   *             properties:
   *               title:
   *                 type: string
   *                 example: The Great Gatsby
   *               author:
   *                 type: string
   *                 example: F. Scott Fitzgerald
   *               genre:
   *                 type: string
   *                 example: Fiction
   *               year:
   *                 type: integer
   *                 example: 1925
   *               price:
   *                 type: integer
   *                 description: Price in paise/cents
   *                 example: 1599
   *               isbn:
   *                 type: string
   *                 example: 978-0-7432-7356-5
   *               coverUrl:
   *                 type: string
   *                 format: uri
   *               description:
   *                 type: string
   *               stock:
   *                 type: integer
   *                 minimum: 0
   *                 default: 0
   *     responses:
   *       201:
   *         description: Book created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Book'
   *       400:
   *         description: Invalid book data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/books", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertBookSchema.parse(req.body);
      const book = await storage.createBook(validatedData);
      
      incrementBookOperation('create');
      broadcastBookCreated(book);
      
      res.status(201).json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid book data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create book" });
    }
  });

  /**
   * @swagger
   * /api/books/{id}:
   *   put:
   *     summary: Update an existing book
   *     description: Update book details. Admin only. Broadcasts update via WebSocket.
   *     tags: [Books]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Book ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               author:
   *                 type: string
   *               genre:
   *                 type: string
   *               year:
   *                 type: integer
   *               price:
   *                 type: integer
   *               isbn:
   *                 type: string
   *               coverUrl:
   *                 type: string
   *               description:
   *                 type: string
   *               stock:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Book updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Book'
   *       400:
   *         description: Invalid book data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Book not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.put("/api/books/:id", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const partialSchema = insertBookSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const book = await storage.updateBook(req.params.id, validatedData);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      incrementBookOperation('update');
      broadcastBookUpdated(book);
      
      res.json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid book data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update book" });
    }
  });

  /**
   * @swagger
   * /api/books/{id}:
   *   delete:
   *     summary: Delete a book
   *     description: Remove a book from the catalog. Admin only. Broadcasts deletion via WebSocket.
   *     tags: [Books]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Book ID
   *     responses:
   *       200:
   *         description: Book deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Success'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Book not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.delete("/api/books/:id", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const book = await storage.getBook(req.params.id);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      const success = await storage.deleteBook(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      incrementBookOperation('delete');
      broadcastBookDeleted(req.params.id, book.title, book.author);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete book" });
    }
  });

  /**
   * @swagger
   * /api/dashboard/stats:
   *   get:
   *     summary: Get dashboard statistics
   *     description: Retrieve key metrics for the admin dashboard. Admin only.
   *     tags: [Dashboard]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           default: 30d
   *         description: Time period for stats (e.g., 7d, 30d, 90d)
   *     responses:
   *       200:
   *         description: Dashboard statistics
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DashboardStats'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/dashboard/stats", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const period = req.query.period as string || '30d';
      const stats = await storage.getDashboardStats(period);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  /**
   * @swagger
   * /api/dashboard/revenue-chart:
   *   get:
   *     summary: Get revenue chart data
   *     description: Retrieve revenue data for charts and graphs. Admin only.
   *     tags: [Dashboard]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           default: 30d
   *         description: Time period for chart data
   *     responses:
   *       200:
   *         description: Revenue chart data
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/dashboard/revenue-chart", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const period = req.query.period as string || '30d';
      const chartData = await storage.getRevenueChartData(period);
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue chart data" });
    }
  });

  /**
   * @swagger
   * /api/dashboard/top-books:
   *   get:
   *     summary: Get top-selling books
   *     description: Retrieve the best-selling books. Admin only.
   *     tags: [Dashboard]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 5
   *         description: Number of top books to return
   *     responses:
   *       200:
   *         description: List of top-selling books
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/dashboard/top-books", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const topBooks = await storage.getTopBooks(limit);
      res.json(topBooks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top books" });
    }
  });

  /**
   * @swagger
   * /api/orders/me:
   *   get:
   *     summary: Get current user's orders
   *     description: Retrieve all orders for the authenticated user.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: User's orders
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Order'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/orders/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const orders = await storage.getOrdersByUserId(req.user.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your orders" });
    }
  });

  /**
   * @swagger
   * /api/orders/recent:
   *   get:
   *     summary: Get recent orders
   *     description: Retrieve the most recent orders. Admin only.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of recent orders to return
   *     responses:
   *       200:
   *         description: Recent orders
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Order'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/orders/recent", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const orders = await storage.getRecentOrders(limit);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent orders" });
    }
  });

  /**
   * @swagger
   * /api/orders:
   *   get:
   *     summary: Get all orders
   *     description: Retrieve all orders in the system. Admin only.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: All orders
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Order'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/orders", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  /**
   * @swagger
   * /api/orders/{id}:
   *   get:
   *     summary: Get a specific order
   *     description: Retrieve order details. Users can only access their own orders unless they are admin.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Order ID
   *     responses:
   *       200:
   *         description: Order details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Order'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Access denied - not your order
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Order not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/orders/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      if (order.userId !== req.user?.id && req.user?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  /**
   * @swagger
   * /api/orders/create:
   *   post:
   *     summary: Create a new order
   *     description: Create an order from cart items with shipping information.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - items
   *               - shippingInfo
   *               - amount
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/CartItem'
   *               shippingInfo:
   *                 type: object
   *                 properties:
   *                   name:
   *                     type: string
   *               amount:
   *                 type: integer
   *                 description: Total order amount in paise/cents
   *     responses:
   *       201:
   *         description: Order created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Order'
   *       400:
   *         description: Invalid order data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/orders/create", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const { items, shippingInfo, amount } = req.body;
      
      if (!items || !items.length || !shippingInfo || !amount) {
        return res.status(400).json({ error: "Invalid order data" });
      }

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const firstItem = items[0];
      
      const orderData = {
        userId: req.user.id,
        orderNumber,
        customerName: shippingInfo.name,
        bookId: firstItem.id,
        bookTitle: firstItem.title,
        amount: Math.round(amount),
        status: "pending",
      };
      
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.post("/api/orders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const orderData = {
        ...req.body,
        userId: req.user.id
      };
      
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  /**
   * @swagger
   * /api/orders/{id}/status:
   *   put:
   *     summary: Update order status
   *     description: Update the status of an order. Admin only.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Order ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pending, processing, shipped, delivered, cancelled]
   *     responses:
   *       200:
   *         description: Order status updated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Order'
   *       400:
   *         description: Invalid status
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Order not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.put("/api/orders/:id/status", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.delete("/api/orders/:id", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Get all users
   *     description: Retrieve all users in the system. Admin only.
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: List of all users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/users", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email and password are required" });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ name, email, passwordHash, role: role || 'user' });
      
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { name, email, password } = req.body;
      const updateData: any = {};
      
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }
      
      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  /**
   * @swagger
   * /api/settings:
   *   get:
   *     summary: Get store settings
   *     description: Retrieve application settings. Admin only.
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Store settings
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Settings'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/settings", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  /**
   * @swagger
   * /api/settings:
   *   put:
   *     summary: Update store settings
   *     description: Update application settings. Admin only.
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Settings'
   *     responses:
   *       200:
   *         description: Settings updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Settings'
   *       400:
   *         description: Invalid settings data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.put("/api/settings", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const validatedSettings = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(validatedSettings);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
        return;
      }
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  /**
   * @swagger
   * /api/admin/reseed-books:
   *   post:
   *     summary: Reseed books database
   *     description: Delete all books from the catalog. Admin only. Requires server restart to reseed with fresh data.
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Books deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Admin only
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.post("/api/admin/reseed-books", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const books = await storage.getAllBooks();
      for (const book of books) {
        await storage.deleteBook(book.id);
      }
      res.json({ success: true, message: 'All books deleted. Restart the server to reseed with correct timestamps.' });
    } catch (error) {
      console.error('Error reseeding books:', error);
      res.status(500).json({ error: "Failed to reseed books" });
    }
  });

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     description: Check if the API is running and responsive. Returns server status and uptime.
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Server is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: healthy
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 uptime:
   *                   type: number
   *                   description: Server uptime in seconds
   *                 environment:
   *                   type: string
   *                   example: development
   *                 database:
   *                   type: string
   *                   enum: [connected, disconnected]
   */
  app.get("/health", (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: storage ? 'connected' : 'disconnected',
    });
  });

  /**
   * @swagger
   * /metrics:
   *   get:
   *     summary: Prometheus metrics endpoint
   *     description: Exposes application metrics in Prometheus format for monitoring and alerting. This endpoint should be scraped by Prometheus server.
   *     tags: [Monitoring]
   *     responses:
   *       200:
   *         description: Prometheus metrics in text format
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   *               example: |
   *                 # HELP http_requests_total Total number of HTTP requests
   *                 # TYPE http_requests_total counter
   *                 http_requests_total{method="GET",route="/api/books",status_code="200"} 152
   *                 
   *                 # HELP http_request_duration_seconds Duration of HTTP requests in seconds
   *                 # TYPE http_request_duration_seconds histogram
   *                 http_request_duration_seconds_bucket{le="0.005",method="GET",route="/api/books",status_code="200"} 120
   *       500:
   *         description: Error retrieving metrics
   */
  app.get("/metrics", metricsHandler);

  const httpServer = createServer(app);
  
  setupWebSocket(httpServer);

  return httpServer;
}
