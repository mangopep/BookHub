import { type User, type InsertUser, type Book, type InsertBook, type Order, type InsertOrder, type Settings, type InsertSettings } from "@shared/schema";
import { randomUUID } from "crypto";
import { MongoClient, Db, Collection, ObjectId } from "mongodb";

export interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  booksTrend: number;
  usersTrend: number;
  ordersTrend: number;
  revenueTrend: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
}

async function fetchBookCoverFromOpenLibrary(isbn: string): Promise<string | null> {
  try {
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    const data = await response.json();
    const bookData = data[`ISBN:${isbn}`];
    if (bookData?.cover?.large) {
      return bookData.cover.large;
    }
    if (bookData?.cover?.medium) {
      return bookData.cover.medium;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch cover for ISBN ${isbn}:`, error);
    return null;
  }
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  getAllBooks(): Promise<Book[]>;
  getBook(id: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: string, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: string): Promise<boolean>;
  
  getAllOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByUserId(userId: string): Promise<Order[]>;
  getRecentOrders(limit: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  
  getDashboardStats(period?: string): Promise<DashboardStats>;
  getRevenueChartData(period: string): Promise<RevenueChartData[]>;
  getTopBooks(limit: number): Promise<Array<{ title: string; sales: number; revenue: number }>>;
  
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private books: Map<string, Book>;
  private orders: Map<string, Order>;

  constructor() {
    this.users = new Map();
    this.books = new Map();
    this.orders = new Map();
    
    this.seedData();
  }

  private seedData() {
    const sampleBooks: InsertBook[] = [
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        genre: "Fiction",
        year: 1960,
        price: 499,
        isbn: "978-0061120084",
        stock: 45,
        description: "A classic novel of modern American literature"
      },
      {
        title: "1984",
        author: "George Orwell",
        genre: "Science Fiction",
        year: 1949,
        price: 399,
        isbn: "978-0451524935",
        stock: 62,
        description: "A dystopian social science fiction novel"
      },
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        genre: "Fiction",
        year: 1925,
        price: 349,
        isbn: "978-0743273565",
        stock: 38,
        description: "A tragic love story on Long Island"
      },
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        genre: "Romance",
        year: 1813,
        price: 299,
        isbn: "978-0141439518",
        stock: 52,
        description: "A romantic novel of manners"
      },
      {
        title: "Harry Potter and the Philosopher's Stone",
        author: "J.K. Rowling",
        genre: "Fantasy",
        year: 1997,
        price: 599,
        isbn: "978-0439708180",
        stock: 78,
        description: "The first book in the Harry Potter series"
      }
    ];

    sampleBooks.forEach((book, index) => {
      const id = randomUUID();
      const now = new Date();
      const daysAgoMap = [1, 5, 15, 25, 45, 60, 90, 120];
      const daysAgo = daysAgoMap[index] || 30;
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const updatedAt = index === 1 ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : createdAt;
      const newBook: Book = {
        ...book,
        id,
        isbn: book.isbn ?? null,
        coverUrl: book.coverUrl ?? null,
        description: book.description ?? null,
        stock: book.stock ?? 0,
        createdAt,
        updatedAt
      };
      this.books.set(id, newBook);
    });

    const adminUserId = randomUUID();
    const sampleOrders: Array<Omit<Order, "id">> = [
      {
        userId: adminUserId,
        orderNumber: "#1234",
        customerName: "Rajesh Kumar",
        bookId: Array.from(this.books.keys())[0],
        bookTitle: "To Kill a Mockingbird",
        amount: 499,
        status: "Completed",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId: adminUserId,
        orderNumber: "#1235",
        customerName: "Priya Sharma",
        bookId: Array.from(this.books.keys())[1],
        bookTitle: "1984",
        amount: 399,
        status: "Processing",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        userId: adminUserId,
        orderNumber: "#1236",
        customerName: "Amit Patel",
        bookId: Array.from(this.books.keys())[2],
        bookTitle: "The Great Gatsby",
        amount: 349,
        status: "Completed",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        userId: adminUserId,
        orderNumber: "#1237",
        customerName: "Sneha Reddy",
        bookId: Array.from(this.books.keys())[3],
        bookTitle: "Pride and Prejudice",
        amount: 299,
        status: "Pending",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ];

    sampleOrders.forEach(order => {
      const id = randomUUID();
      this.orders.set(id, { ...order, id });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role ?? "user",
      cart: [],
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBook(id: string): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(book: InsertBook): Promise<Book> {
    const id = randomUUID();
    const now = new Date();
    const newBook: Book = {
      ...book,
      id,
      isbn: book.isbn ?? null,
      coverUrl: book.coverUrl ?? null,
      description: book.description ?? null,
      stock: book.stock ?? 0,
      createdAt: now,
      updatedAt: now
    };
    this.books.set(id, newBook);
    return newBook;
  }

  async updateBook(id: string, bookUpdate: Partial<InsertBook>): Promise<Book | undefined> {
    const book = this.books.get(id);
    if (!book) return undefined;
    
    // Check if any content actually changed
    const contentFields: (keyof InsertBook)[] = ['title', 'author', 'genre', 'year', 'price', 'isbn', 'coverUrl', 'description', 'stock'];
    const hasContentChanged = contentFields.some(field => {
      if (field in bookUpdate) {
        const newValue = bookUpdate[field];
        const oldValue = book[field];
        // Handle null/undefined comparison
        if (newValue === undefined) return false;
        if (newValue === null && oldValue === null) return false;
        if (newValue !== oldValue) return true;
      }
      return false;
    });
    
    // Only update updatedAt if content actually changed
    const updatedBook: Book = { 
      ...book, 
      ...bookUpdate, 
      updatedAt: hasContentChanged ? new Date() : book.updatedAt 
    };
    this.books.set(id, updatedBook);
    return updatedBook;
  }

  async deleteBook(id: string): Promise<boolean> {
    return this.books.delete(id);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const newOrder: Order = { ...order, id, createdAt: new Date() };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrder(id: string, orderUpdate: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = { ...order, ...orderUpdate };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    return this.orders.delete(id);
  }

  private getDateRangeFromPeriod(period: string = '30d'): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    return { startDate, endDate };
  }

  async getDashboardStats(period: string = '30d'): Promise<DashboardStats> {
    const totalBooks = this.books.size;
    const totalUsers = this.users.size;
    
    const { startDate } = this.getDateRangeFromPeriod(period);
    const allOrders = Array.from(this.orders.values());
    const periodOrders = allOrders.filter(order => order.createdAt >= startDate);
    
    const totalOrders = periodOrders.length;
    const totalRevenue = periodOrders.reduce((sum, order) => sum + order.amount, 0);

    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousOrders = allOrders.filter(order => 
      order.createdAt >= previousPeriodStart && order.createdAt < startDate
    );
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.amount, 0);
    
    const ordersTrend = previousOrders.length > 0 
      ? Math.round(((totalOrders - previousOrders.length) / previousOrders.length) * 100)
      : totalOrders > 0 ? 100 : 0;
    const revenueTrend = previousRevenue > 0
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
      : totalRevenue > 0 ? 100 : 0;

    return {
      totalBooks,
      totalUsers,
      totalOrders,
      totalRevenue,
      booksTrend: 12,
      usersTrend: 8,
      ordersTrend,
      revenueTrend
    };
  }

  async getRevenueChartData(period: string): Promise<RevenueChartData[]> {
    const { startDate, endDate } = this.getDateRangeFromPeriod(period);
    const orders = Array.from(this.orders.values())
      .filter(order => order.createdAt >= startDate && order.createdAt <= endDate);
    
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const chartData: RevenueChartData[] = [];
    
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayRevenue = orders
        .filter(order => order.createdAt >= dayStart && order.createdAt <= dayEnd)
        .reduce((sum, order) => sum + order.amount, 0);
      
      chartData.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue
      });
    }
    
    return chartData;
  }

  async getTopBooks(limit: number): Promise<Array<{ title: string; sales: number; revenue: number }>> {
    const orders = Array.from(this.orders.values());
    const bookSales = new Map<string, { title: string; sales: number; revenue: number }>();

    orders.forEach(order => {
      const existing = bookSales.get(order.bookTitle);
      if (existing) {
        existing.sales += 1;
        existing.revenue += order.amount;
      } else {
        bookSales.set(order.bookTitle, {
          title: order.bookTitle,
          sales: 1,
          revenue: order.amount
        });
      }
    });

    return Array.from(bookSales.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit);
  }

  async getSettings(): Promise<Settings> {
    return {
      id: "default",
      storeName: "BookHub",
      storeEmail: "contact@bookhub.com",
      storePhone: "+91 9876543210",
      emailNotifications: true,
      orderNotifications: true,
      lowStockAlerts: true,
      newArrivalDuration: 30,
      newArrivalUnit: "days",
      recentlyUpdatedDuration: 14,
      recentlyUpdatedUnit: "days",
      updatedAt: new Date(),
    };
  }

  async updateSettings(settings: Partial<InsertSettings>): Promise<Settings> {
    return {
      id: "default",
      storeName: settings.storeName || "BookHub",
      storeEmail: settings.storeEmail || "contact@bookhub.com",
      storePhone: settings.storePhone || "+91 9876543210",
      emailNotifications: settings.emailNotifications ?? true,
      orderNotifications: settings.orderNotifications ?? true,
      lowStockAlerts: settings.lowStockAlerts ?? true,
      newArrivalDuration: settings.newArrivalDuration ?? 30,
      newArrivalUnit: settings.newArrivalUnit ?? "days",
      recentlyUpdatedDuration: settings.recentlyUpdatedDuration ?? 14,
      recentlyUpdatedUnit: settings.recentlyUpdatedUnit ?? "days",
      updatedAt: new Date(),
    };
  }
}

export class MongoDBStorage implements IStorage {
  private client: MongoClient;
  private db!: Db;
  private users!: Collection<User>;
  private books!: Collection<Book>;
  private orders!: Collection<Order>;
  private settings!: Collection<Settings>;
  private initialized = false;

  constructor(mongoUri: string) {
    this.client = new MongoClient(mongoUri);
  }

  async connect(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.client.connect();
      this.db = this.client.db("bookstore");
      this.users = this.db.collection<User>("users");
      this.books = this.db.collection<Book>("books");
      this.orders = this.db.collection<Order>("orders");
      this.settings = this.db.collection<Settings>("settings");
      
      await this.createIndexes();
      await this.seedData();
      await this.fixBookTimestamps();
      await this.initializeSettings();
      
      this.initialized = true;
      console.log("Connected to MongoDB successfully");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    try {
      await this.users.dropIndex("username_1");
      console.log("Dropped old username index");
    } catch (error) {
      // Index doesn't exist, ignore
    }
    
    // User indexes
    await this.users.createIndex({ email: 1 }, { unique: true });
    
    // Book indexes for performance
    await this.books.createIndex({ isbn: 1 });
    await this.books.createIndex({ genre: 1 }); // Filter by genre
    await this.books.createIndex({ year: 1 }); // Filter by year
    await this.books.createIndex({ title: "text", author: "text" }); // Text search
    
    // Order indexes
    await this.orders.createIndex({ orderNumber: 1 }, { unique: true });
    await this.orders.createIndex({ userId: 1, createdAt: -1 }); // User's orders sorted by date
    
    console.log("[MongoDB] Indexes created successfully");
  }

  private async seedData(): Promise<void> {
    const existingAdmin = await this.users.findOne({ email: 'admin@bookhub.com' });
    if (!existingAdmin) {
      const bcrypt = await import('bcrypt');
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      const adminUserId = randomUUID();
      
      const adminUser: User = {
        id: adminUserId,
        name: 'Admin User',
        email: 'admin@bookhub.com',
        passwordHash: adminPasswordHash,
        role: 'admin',
        cart: [],
        createdAt: new Date()
      };
      
      await this.users.insertOne(adminUser);
      console.log('Admin user seeded: admin@bookhub.com / admin123');
    }

    const bookCount = await this.books.countDocuments();
    if (bookCount > 0) return;

    const sampleBooks: InsertBook[] = [
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        genre: "Fiction",
        year: 1960,
        price: 499,
        isbn: "9780061120084",
        stock: 45,
        description: "A classic novel of modern American literature that explores themes of racial injustice and moral growth in the American South."
      },
      {
        title: "1984",
        author: "George Orwell",
        genre: "Science Fiction",
        year: 1949,
        price: 399,
        isbn: "9780451524935",
        stock: 62,
        description: "A dystopian social science fiction novel and cautionary tale about the dangers of totalitarianism."
      },
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        genre: "Fiction",
        year: 1925,
        price: 349,
        isbn: "9780743273565",
        stock: 38,
        description: "A tragic love story set in the Jazz Age on Long Island, exploring themes of decadence and idealism."
      },
      {
        title: "Pride and Prejudice",
        author: "Jane Austen",
        genre: "Romance",
        year: 1813,
        price: 299,
        isbn: "9780141439518",
        stock: 52,
        description: "A romantic novel of manners that charts the emotional development of Elizabeth Bennet."
      },
      {
        title: "Harry Potter and the Philosopher's Stone",
        author: "J.K. Rowling",
        genre: "Fantasy",
        year: 1997,
        price: 599,
        isbn: "9780439708180",
        stock: 78,
        description: "The first book in the Harry Potter series, following a young wizard's journey at Hogwarts."
      },
      {
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
        genre: "Fiction",
        year: 1951,
        price: 449,
        isbn: "9780316769174",
        stock: 34,
        description: "A story about teenage rebellion and alienation narrated by Holden Caulfield."
      },
      {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        genre: "Fantasy",
        year: 1937,
        price: 549,
        isbn: "9780547928227",
        stock: 56,
        description: "A fantasy adventure about Bilbo Baggins and his quest to reclaim treasure from the dragon Smaug."
      },
      {
        title: "Brave New World",
        author: "Aldous Huxley",
        genre: "Science Fiction",
        year: 1932,
        price: 399,
        isbn: "9780060850524",
        stock: 41,
        description: "A dystopian novel set in a futuristic World State of genetically modified citizens."
      }
    ];

    const booksWithCovers = await Promise.all(
      sampleBooks.map(async (book, index) => {
        const coverUrl = book.isbn ? await fetchBookCoverFromOpenLibrary(book.isbn) : null;
        const id = randomUUID();
        const now = new Date();
        const daysAgoMap = [1, 5, 15, 25, 45, 60, 90, 120];
        const daysAgo = daysAgoMap[index] || 30;
        const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const updatedAt = index === 1 ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : createdAt;
        
        return {
          ...book,
          id,
          isbn: book.isbn ?? null,
          coverUrl: coverUrl ?? null,
          description: book.description ?? null,
          stock: book.stock ?? 0,
          createdAt,
          updatedAt
        } as Book;
      })
    );

    await this.books.insertMany(booksWithCovers);
    console.log(`Seeded ${booksWithCovers.length} books with diverse timestamps`);

    const adminUser = await this.users.findOne({ email: 'admin@bookhub.com' });
    const adminUserId = adminUser?.id || randomUUID();

    const insertedBooks = await this.books.find().toArray();
    if (insertedBooks.length > 0) {
      const sampleOrders: Array<Omit<Order, "id">> = [
        {
          userId: adminUserId,
          orderNumber: "#1234",
          customerName: "Rajesh Kumar",
          bookId: insertedBooks[0].id,
          bookTitle: insertedBooks[0].title,
          amount: insertedBooks[0].price,
          status: "Completed",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          userId: adminUserId,
          orderNumber: "#1235",
          customerName: "Priya Sharma",
          bookId: insertedBooks[1]?.id || insertedBooks[0].id,
          bookTitle: insertedBooks[1]?.title || insertedBooks[0].title,
          amount: insertedBooks[1]?.price || insertedBooks[0].price,
          status: "Processing",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        {
          userId: adminUserId,
          orderNumber: "#1236",
          customerName: "Amit Patel",
          bookId: insertedBooks[2]?.id || insertedBooks[0].id,
          bookTitle: insertedBooks[2]?.title || insertedBooks[0].title,
          amount: insertedBooks[2]?.price || insertedBooks[0].price,
          status: "Completed",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ];

      const ordersWithIds = sampleOrders.map(order => ({
        ...order,
        id: randomUUID()
      }));

      await this.orders.insertMany(ordersWithIds);
    }

  }

  private async fixBookTimestamps(): Promise<void> {
    const books = await this.books.find().sort({ createdAt: 1 }).toArray();
    
    if (books.length === 0) return;
    
    const firstBook = books[0];
    const now = new Date();
    const firstBookAge = now.getTime() - new Date(firstBook.createdAt).getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    if (firstBookAge < 10 * oneDayInMs) {
      console.log('Fixing book timestamps for proper new arrival filtering...');
      const daysAgoMap = [1, 5, 15, 25, 45, 60, 90, 120];
      
      for (let i = 0; i < books.length; i++) {
        const book = books[i];
        const daysAgo = daysAgoMap[i] || 30;
        const createdAt = new Date(now.getTime() - daysAgo * oneDayInMs);
        const updatedAt = i === 1 ? new Date(now.getTime() - 2 * oneDayInMs) : createdAt;
        
        await this.books.updateOne(
          { _id: book._id },
          { $set: { createdAt, updatedAt } }
        );
      }
      
      console.log(`Updated timestamps for ${books.length} books`);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await this.users.findOne({ id });
    return user ?? undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.users.findOne({ email });
    return user ?? undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role ?? "user",
      cart: [],
      createdAt: new Date()
    };
    await this.users.insertOne(user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.users.find().toArray();
  }

  async updateUser(id: string, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.users.findOneAndUpdate(
      { id },
      { $set: userUpdate },
      { returnDocument: "after", includeResultMetadata: false }
    );
    return result ?? undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.users.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getAllBooks(): Promise<Book[]> {
    return await this.books.find().toArray();
  }

  async getBook(id: string): Promise<Book | undefined> {
    const book = await this.books.findOne({ id });
    return book ?? undefined;
  }

  async createBook(book: InsertBook): Promise<Book> {
    const id = randomUUID();
    let coverUrl = book.coverUrl ?? null;
    
    if (!coverUrl && book.isbn) {
      coverUrl = await fetchBookCoverFromOpenLibrary(book.isbn);
    }

    const now = new Date();
    const newBook: Book = {
      ...book,
      id,
      isbn: book.isbn ?? null,
      coverUrl,
      description: book.description ?? null,
      stock: book.stock ?? 0,
      createdAt: now,
      updatedAt: now
    };
    
    await this.books.insertOne(newBook);
    return newBook;
  }

  async updateBook(id: string, bookUpdate: Partial<InsertBook>): Promise<Book | undefined> {
    // First, get the existing book to compare values
    const existingBook = await this.books.findOne({ id });
    if (!existingBook) return undefined;
    
    // Check if any content actually changed
    const contentFields: (keyof InsertBook)[] = ['title', 'author', 'genre', 'year', 'price', 'isbn', 'coverUrl', 'description', 'stock'];
    const hasContentChanged = contentFields.some(field => {
      if (field in bookUpdate) {
        const newValue = bookUpdate[field];
        const oldValue = existingBook[field];
        // Handle null/undefined comparison
        if (newValue === undefined) return false;
        if (newValue === null && oldValue === null) return false;
        if (newValue !== oldValue) return true;
      }
      return false;
    });
    
    // Only update updatedAt if content actually changed
    const updateData = hasContentChanged 
      ? { ...bookUpdate, updatedAt: new Date() }
      : bookUpdate;
    
    const result = await this.books.findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: "after", includeResultMetadata: false }
    );
    return result ?? undefined;
  }

  async deleteBook(id: string): Promise<boolean> {
    const result = await this.books.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getAllOrders(): Promise<Order[]> {
    return await this.orders.find().sort({ createdAt: -1 }).toArray();
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const order = await this.orders.findOne({ id });
    return order || undefined;
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return await this.orders.find({ userId }).sort({ createdAt: -1 }).toArray();
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    return await this.orders.find().sort({ createdAt: -1 }).limit(limit).toArray();
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const newOrder: Order = { ...order, id, createdAt: new Date() };
    await this.orders.insertOne(newOrder);
    return newOrder;
  }

  async updateOrder(id: string, orderUpdate: Partial<InsertOrder>): Promise<Order | undefined> {
    const result = await this.orders.findOneAndUpdate(
      { id },
      { $set: orderUpdate },
      { returnDocument: "after", includeResultMetadata: false }
    );
    return result ?? undefined;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const result = await this.orders.findOneAndUpdate(
      { id },
      { $set: { status } },
      { returnDocument: "after", includeResultMetadata: false }
    );
    return result ?? undefined;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await this.orders.deleteOne({ id });
    return result.deletedCount > 0;
  }

  private getDateRangeFromPeriod(period: string = '30d'): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    return { startDate, endDate };
  }

  async getDashboardStats(period: string = '30d'): Promise<DashboardStats> {
    const totalBooks = await this.books.countDocuments();
    const totalUsers = await this.users.countDocuments();
    
    const { startDate } = this.getDateRangeFromPeriod(period);
    const periodOrders = await this.orders.find({ 
      createdAt: { $gte: startDate } 
    }).toArray();
    
    const totalOrders = periodOrders.length;
    const totalRevenue = periodOrders.reduce((sum, order) => sum + order.amount, 0);

    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousOrders = await this.orders.find({
      createdAt: { $gte: previousPeriodStart, $lt: startDate }
    }).toArray();
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.amount, 0);
    
    const ordersTrend = previousOrders.length > 0 
      ? Math.round(((totalOrders - previousOrders.length) / previousOrders.length) * 100)
      : totalOrders > 0 ? 100 : 0;
    const revenueTrend = previousRevenue > 0
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
      : totalRevenue > 0 ? 100 : 0;

    return {
      totalBooks,
      totalUsers,
      totalOrders,
      totalRevenue,
      booksTrend: 12,
      usersTrend: 8,
      ordersTrend,
      revenueTrend
    };
  }

  async getRevenueChartData(period: string): Promise<RevenueChartData[]> {
    const { startDate, endDate } = this.getDateRangeFromPeriod(period);
    const orders = await this.orders.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).toArray();
    
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const chartData: RevenueChartData[] = [];
    
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayRevenue = orders
        .filter(order => order.createdAt >= dayStart && order.createdAt <= dayEnd)
        .reduce((sum, order) => sum + order.amount, 0);
      
      chartData.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue
      });
    }
    
    return chartData;
  }

  async getTopBooks(limit: number): Promise<Array<{ title: string; sales: number; revenue: number }>> {
    const orders = await this.orders.find().toArray();
    const bookSales = new Map<string, { title: string; sales: number; revenue: number }>();

    orders.forEach(order => {
      const existing = bookSales.get(order.bookTitle);
      if (existing) {
        existing.sales += 1;
        existing.revenue += order.amount;
      } else {
        bookSales.set(order.bookTitle, {
          title: order.bookTitle,
          sales: 1,
          revenue: order.amount
        });
      }
    });

    return Array.from(bookSales.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit);
  }

  private async initializeSettings(): Promise<void> {
    const existing = await this.settings.findOne({ id: "default" });
    if (!existing) {
      await this.settings.insertOne({
        id: "default",
        storeName: "BookHub",
        storeEmail: "contact@bookhub.com",
        storePhone: "+91 9876543210",
        emailNotifications: true,
        orderNotifications: true,
        lowStockAlerts: true,
        newArrivalDuration: 30,
        newArrivalUnit: "days",
        recentlyUpdatedDuration: 14,
        recentlyUpdatedUnit: "days",
        updatedAt: new Date(),
      });
    }
  }

  async getSettings(): Promise<Settings> {
    const settings = await this.settings.findOne({ id: "default" });
    if (!settings) {
      await this.initializeSettings();
      return this.getSettings();
    }
    return settings;
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings> {
    await this.settings.updateOne(
      { id: "default" },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        }
      },
      { upsert: true }
    );
    return this.getSettings();
  }
}

async function createStorage(): Promise<IStorage> {
  const mongoUri = process.env.MONGODB_URI?.trim();
  
  if (mongoUri) {
    try {
      const mongoStorage = new MongoDBStorage(mongoUri);
      await mongoStorage.connect();
      return mongoStorage;
    } catch (error) {
      console.error("Failed to connect to MongoDB, falling back to in-memory storage:", error);
      return new MemStorage();
    }
  } else {
    console.log("No MONGODB_URI found, using in-memory storage");
    return new MemStorage();
  }
}

let storageInstance: IStorage | null = null;

export async function initializeStorage(): Promise<IStorage> {
  if (!storageInstance) {
    storageInstance = await createStorage();
  }
  return storageInstance;
}

export function getStorage(): IStorage {
  if (!storageInstance) {
    throw new Error("Storage not initialized. Call initializeStorage() first.");
  }
  return storageInstance;
}
