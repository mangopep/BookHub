# BookHub - Automated Testing Framework

## Overview
Comprehensive automated testing framework implementing sections 8.6-8.10 of the deployment plan with unit tests, integration tests, E2E tests, and code coverage reporting.

## Test Coverage Targets
- **Lines**: 70%+
- **Functions**: 70%+
- **Branches**: 70%+
- **Statements**: 70%+

## Testing Stack

### Core Framework
- **Vitest**: Unit and integration testing with coverage reporting
- **@testing-library/react**: React component testing
- **Playwright**: End-to-end browser testing
- **Supertest**: HTTP API testing
- **Socket.IO Client**: WebSocket integration testing

### Configuration Files
- `vitest.config.ts`: Vitest configuration with React support, coverage thresholds, and path aliases
- `playwright.config.ts`: Playwright E2E configuration for Chromium, Firefox, and WebKit
- `tests/setup.ts`: Global test setup with cleanup hooks

## Test Structure

```
tests/
├── setup.ts                          # Global test configuration
├── unit/                            # Unit tests
│   ├── server/
│   │   ├── storage.test.ts          # Storage layer CRUD operations
│   │   └── websocket.test.ts        # WebSocket broadcast functions
│   └── client/
│       ├── components/
│       │   └── BookCard.test.tsx    # BookCard component tests
│       ├── utils/
│       │   └── cart.test.ts         # Cart hook tests
│       └── hooks/
│           └── useBooks.test.ts     # React Query integration tests
├── integration/                     # Integration tests
│   ├── api/
│   │   └── books.test.ts            # Books API endpoints
│   └── websocket/
│       └── realtime.test.ts         # WebSocket real-time events
└── e2e/                             # End-to-end tests
    ├── realtime-updates.spec.ts     # Real-time update flows
    └── checkout-flow.spec.ts        # Complete checkout flows
```

## Running Tests

### Required Package.json Scripts
Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration"
  }
}
```

### Running Tests

```bash
# Run all unit and integration tests in watch mode
npm test

# Run all tests once (CI mode)
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests with interactive UI
npm run test:ui

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed
```

## Test Suites

### 1. Backend Unit Tests

#### Storage Layer (`tests/unit/server/storage.test.ts`)
- Book CRUD operations (create, read, update, delete)
- User management
- Order processing
- Settings management
- Data persistence and retrieval

#### WebSocket Broadcasting (`tests/unit/server/websocket.test.ts`)
- WebSocket server initialization
- Book created event broadcasting
- Book updated event broadcasting
- Book deleted event broadcasting
- Event data validation
- Connection handling

### 2. Frontend Unit Tests

#### BookCard Component (`tests/unit/client/components/BookCard.test.tsx`)
- Book information rendering
- Add to cart functionality
- Badge display (New Arrival, Recently Updated)
- Price formatting
- Click interactions

#### Cart Hook (`tests/unit/client/utils/cart.test.ts`)
- Cart initialization
- Add item to cart
- Remove item from cart
- Update item quantity
- Clear cart
- Total calculation
- Local storage persistence

#### React Query Integration (`tests/unit/client/hooks/useBooks.test.ts`)
- Query key configuration
- Fetch behavior
- Error handling
- Loading states
- Data caching

### 3. Integration Tests

#### Books API (`tests/integration/api/books.test.ts`)
- GET /api/books - List all books
- POST /api/books - Create book (admin only)
- GET /api/books/:id - Get single book
- PUT /api/books/:id - Update book (admin only)
- DELETE /api/books/:id - Delete book (admin only)
- Authentication and authorization
- Input validation
- Error responses

#### WebSocket Real-time Events (`tests/integration/websocket/realtime.test.ts`)
- Book creation broadcasts to all clients
- Book update broadcasts to all clients
- Book deletion broadcasts to all clients
- Multiple client synchronization
- Failed operations don't broadcast

### 4. End-to-End Tests

#### Real-time Updates (`tests/e2e/realtime-updates.spec.ts`)
- New books appear instantly across clients
- Book updates reflect in real-time
- Book deletions sync across clients
- Connection status indicators
- Toast notifications for updates

#### Checkout Flow (`tests/e2e/checkout-flow.spec.ts`)
- User signup flow
- Browse and search books
- Add to cart
- Cart quantity management
- Remove from cart
- Checkout process
- Order confirmation
- Empty cart handling

## Code Coverage

### Generating Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# View HTML report
open coverage/index.html

# View coverage in terminal
npm run test:coverage -- --reporter=text
```

### Coverage Output Formats
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format (for CI/CD)
- `coverage/coverage-final.json` - JSON format

### Example Coverage Report

```
File                        | % Stmts | % Branch | % Funcs | % Lines |
----------------------------|---------|----------|---------|---------|
All files                   |   78.23 |    72.45 |   81.33 |   78.45 |
server/                    |   82.15 |    75.32 |   85.71 |   82.34 |
 routes.ts                 |   88.42 |    80.00 |   90.00 |   88.89 |
 storage.ts                |   91.23 |    85.71 |   95.00 |   91.67 |
 websocket.ts              |   76.47 |    66.67 |   80.00 |   76.92 |
client/src/                |   75.34 |    70.12 |   78.26 |   75.67 |
 components/BookCard.tsx   |   82.35 |    75.00 |   85.71 |   82.61 |
 pages/Home.tsx            |   71.23 |    68.42 |   72.73 |   71.43 |
 lib/socket.ts             |   89.47 |    83.33 |   91.67 |   89.66 |
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run unit and integration tests
        run: npm run test:run
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Best Practices

### Unit Tests
- Test one thing at a time
- Use descriptive test names
- Mock external dependencies
- Avoid testing implementation details
- Test edge cases and error conditions

### Integration Tests
- Test actual API endpoints
- Use real database connections (test DB)
- Verify authentication and authorization
- Test error responses
- Clean up test data after each test

### E2E Tests
- Test complete user flows
- Use realistic data
- Test across multiple browsers
- Verify real-time features
- Include visual regression testing

### Test Data
- Use factories for test data
- Keep test data minimal
- Avoid hardcoded IDs
- Clean up after each test
- Use realistic but safe data

## Debugging Tests

### Vitest Debugging

```bash
# Run tests with debugger
node --inspect-brk ./node_modules/vitest/vitest.mjs run

# Run specific test file
npm test -- tests/unit/server/storage.test.ts

# Run tests matching pattern
npm test -- -t "should create book"
```

### Playwright Debugging

```bash
# Run with headed browser
npm run test:e2e:headed

# Run with Playwright inspector
PWDEBUG=1 npm run test:e2e

# Run specific test
npm run test:e2e -- tests/e2e/checkout-flow.spec.ts
```

## Common Issues

### Socket.IO Client Mocking
- Integration tests use **real** Socket.IO clients
- Frontend unit tests should mock socket.io-client per test suite
- Don't add global socket.io-client mocks to tests/setup.ts

### Authentication in Tests
- Use test credentials: username "admin", password "admin123"
- Generate JWT tokens via login endpoint
- Store tokens for authenticated requests

### Async Testing
- Always await async operations
- Use `waitFor` for React state updates
- Return promises from event-based tests

## Maintenance

### Adding New Tests
1. Determine test type (unit/integration/e2e)
2. Create test file in appropriate directory
3. Follow existing patterns and conventions
4. Update this documentation

### Updating Tests
1. Keep tests in sync with code changes
2. Refactor tests when refactoring code
3. Maintain test coverage above thresholds
4. Update snapshots when UI changes

### Removing Tests
1. Document why test is removed
2. Ensure coverage doesn't drop
3. Verify no regression
4. Update documentation

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
