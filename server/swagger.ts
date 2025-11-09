import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

function getServerUrl(): string {
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  }
  
  if (process.env.NODE_ENV === 'production') {
    return process.env.CLIENT_URL || process.env.PRODUCTION_URL || 'https://your-app.com';
  }
  
  const port = process.env.PORT || 5000;
  return `http://localhost:${port}`;
}

function getServerDescription(): string {
  if (process.env.API_BASE_URL) {
    return 'Custom Server';
  }
  
  if (process.env.REPLIT_DEV_DOMAIN || process.env.REPL_SLUG) {
    return 'Replit Development';
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'Production Server';
  }
  
  return 'Local Development';
}

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'BookHub API',
    version: '1.0.0',
    description: 'Enterprise Book Management & E-Commerce Platform API - Complete documentation for all endpoints including authentication, book catalog, order processing, and admin operations.',
    contact: {
      name: 'BookHub API Support',
      email: 'api@bookhub.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: getServerUrl(),
      description: getServerDescription(),
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token for API testing. Copy the token from login/signup response and paste it here.',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'JWT token in httpOnly cookie. Automatically set after successful login/signup (used by web app).',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Unique user identifier' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          cart: { 
            type: 'array', 
            items: { $ref: '#/components/schemas/CartItem' },
            description: 'Shopping cart items'
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Book ID' },
          title: { type: 'string', example: 'The Great Gatsby' },
          author: { type: 'string', example: 'F. Scott Fitzgerald' },
          price: { type: 'integer', example: 1599, description: 'Price in paise/cents (₹15.99 = 1599)' },
          quantity: { type: 'integer', minimum: 1, example: 2 },
          coverUrl: { type: 'string', format: 'uri', nullable: true },
        },
      },
      Book: {
        type: 'object',
        required: ['title', 'author', 'genre', 'year', 'price'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'The Great Gatsby' },
          author: { type: 'string', example: 'F. Scott Fitzgerald' },
          genre: { type: 'string', example: 'Fiction' },
          year: { type: 'integer', example: 1925 },
          price: { type: 'integer', example: 1599, description: 'Price in paise/cents (₹15.99 = 1599)' },
          isbn: { type: 'string', example: '978-0-7432-7356-5', nullable: true },
          coverUrl: { type: 'string', format: 'uri', nullable: true },
          description: { type: 'string', nullable: true },
          stock: { type: 'integer', minimum: 0, default: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          orderNumber: { type: 'string', example: 'ORD-1234567890-ABC123' },
          customerName: { type: 'string', example: 'John Doe' },
          bookId: { type: 'string', format: 'uuid' },
          bookTitle: { type: 'string', example: 'The Great Gatsby' },
          amount: { type: 'integer', example: 1599, description: 'Order amount in paise/cents' },
          status: { 
            type: 'string', 
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            example: 'pending' 
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Settings: {
        type: 'object',
        properties: {
          id: { type: 'string', default: 'default' },
          storeName: { type: 'string', example: 'BookHub' },
          storeEmail: { type: 'string', format: 'email', example: 'contact@bookhub.com' },
          storePhone: { type: 'string', example: '+91 9876543210' },
          emailNotifications: { type: 'boolean', default: true },
          orderNotifications: { type: 'boolean', default: true },
          lowStockAlerts: { type: 'boolean', default: true },
          newArrivalDuration: { type: 'integer', example: 30 },
          newArrivalUnit: { type: 'string', example: 'days' },
          recentlyUpdatedDuration: { type: 'integer', example: 14 },
          recentlyUpdatedUnit: { type: 'string', example: 'days' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DashboardStats: {
        type: 'object',
        properties: {
          totalRevenue: { type: 'number', example: 125000 },
          totalOrders: { type: 'integer', example: 342 },
          totalBooks: { type: 'integer', example: 156 },
          totalUsers: { type: 'integer', example: 89 },
          revenueChange: { type: 'number', example: 12.5, description: 'Percentage change' },
          ordersChange: { type: 'number', example: 8.2 },
          booksChange: { type: 'number', example: 5.1 },
          usersChange: { type: 'number', example: 15.3 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'An error occurred' },
          details: { type: 'array', items: { type: 'object' }, nullable: true },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', nullable: true },
        },
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'User authentication and authorization endpoints' },
    { name: 'Books', description: 'Book catalog management and Google Books API integration' },
    { name: 'Orders', description: 'Order processing and management' },
    { name: 'Users', description: 'User management (admin only)' },
    { name: 'Dashboard', description: 'Dashboard statistics and analytics (admin only)' },
    { name: 'Settings', description: 'Application settings management (admin only)' },
    { name: 'Admin', description: 'Administrative actions' },
    { name: 'Health', description: 'Health check and monitoring' },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./server/routes.ts', './shared/schema.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'BookHub API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      url: '/api/docs.json',
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
  }));

  const serverUrl = getServerUrl();
  const serverDesc = getServerDescription();
  console.log('[Swagger] 📚 API documentation available at /api/docs');
  console.log('[Swagger] 📄 OpenAPI spec available at /api/docs.json');
  console.log(`[Swagger] 🌐 Server URL: ${serverUrl} (${serverDesc})`);
}
