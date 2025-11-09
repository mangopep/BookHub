# Design Guidelines: Enterprise Book Management & Purchase System

## Design Approach
**Hybrid Reference Strategy**: Combine e-commerce excellence (Amazon's catalog density, Goodreads' book-focused layouts) with enterprise admin patterns (Stripe Dashboard's clarity, Shopify's admin efficiency). The public-facing site prioritizes discovery and conversion, while the admin panel emphasizes data management efficiency.

## Typography System
- **Primary Font**: Inter (Google Fonts) - excellent readability for catalog listings and data tables
- **Accent Font**: Merriweather (Google Fonts) - for book titles and editorial content
- **Hierarchy**:
  - Hero Headlines: text-4xl to text-5xl, font-bold (Merriweather)
  - Page Titles: text-3xl, font-semibold
  - Section Headers: text-2xl, font-semibold
  - Book Titles: text-lg, font-semibold (Merriweather)
  - Body Text: text-base, font-normal
  - Metadata/Captions: text-sm, text-gray-600

## Spacing System
**Tailwind Units**: Standardize on 2, 4, 6, 8, 12, 16, 24 for consistency
- Component padding: p-4 to p-6
- Section spacing: py-12 to py-24
- Card gaps: gap-6 to gap-8
- Container margins: mx-4 to mx-auto max-w-7xl

## Layout Patterns

### Public Website
**Homepage**: 
- Hero section (60vh): Featured books carousel with overlay text, blurred background buttons
- Search bar: Prominent, centered with filters (author, genre, year)
- Book grid: 4-column on desktop (lg:grid-cols-4), 2-column tablet (md:grid-cols-2), single on mobile
- Category sections: Horizontal scrollable rows of book cards

**Book Details Page**:
- Two-column split (md:grid-cols-2): Left = large book cover (40% width), Right = details and CTA
- Sticky purchase panel on scroll
- Related books carousel below

**Cart/Checkout**:
- Two-column: Left = cart items list (60%), Right = order summary sidebar (40%)
- Progress indicator at top (Cart → Information → Payment → Confirmation)

### Admin Panel
**Dashboard**:
- Stat cards in 4-column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Data tables with sorting, pagination, and inline actions
- Sidebar navigation (fixed, 240px width) with section grouping

**Book Management**:
- Table view with thumbnail previews
- Inline edit capabilities
- Bulk actions toolbar
- Filter sidebar (collapsible on mobile)

## Component Library

### Book Card
- Vertical card with aspect-ratio-[2/3] book cover
- Cover image with subtle shadow and hover lift (hover:-translate-y-1)
- Title (2 lines max, truncate)
- Author, genre badges, price
- "Quick View" overlay on hover

### Navigation
- **Public**: Transparent header with blur backdrop, sticky on scroll, search icon expanding to full bar
- **Admin**: Persistent sidebar with icon + text, collapsible on tablet

### Forms
- Grouped field sections with subtle borders
- Floating labels or top-aligned labels for clarity
- Full-width inputs with p-3 padding
- Primary CTA buttons: Large (px-8 py-3), high contrast

### Data Tables (Admin)
- Striped rows for readability
- Fixed header on scroll
- Inline action buttons (icon-only with tooltips)
- Compact row height (py-2)

### Modals/Dialogs
- Center-aligned with backdrop blur
- Max width: max-w-2xl for forms, max-w-4xl for book previews
- Close button top-right, primary action bottom-right

## Images

### Hero Section
**Large hero image**: Bookshelf or library aesthetic, warm tones
- Placement: Full-width background with gradient overlay (top-to-bottom fade)
- Overlay text: Centered, with blurred-background CTA buttons (backdrop-blur-md, bg-white/20)
- Height: 60vh

### Book Covers
- Always display via Open Library API cover URLs
- Fallback: Placeholder with book icon and title text
- Aspect ratio: 2:3 (portrait)
- Use object-fit-cover for consistency

### Admin Dashboard
- No hero images
- Icon illustrations for empty states
- Small thumbnails in tables (48x48px)

## Interaction Patterns
- **Hover states**: Subtle lift (translate-y) on cards, opacity changes on buttons
- **Loading states**: Skeleton screens matching content structure
- **Transitions**: duration-200 for micro-interactions
- **Animations**: Minimal - use only for page transitions and loading indicators

## Accessibility
- Focus rings: ring-2 ring-offset-2 on all interactive elements
- ARIA labels on icon-only buttons
- Semantic HTML throughout (nav, main, article, aside)
- Keyboard navigation support for modals and dropdowns

## Icons
**Heroicons** (outline style for UI, solid for emphasis)
- Navigation, actions, and status indicators
- Size: w-5 h-5 for inline, w-6 h-6 for standalone