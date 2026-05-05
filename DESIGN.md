---
name: Luminous Ledger
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464651'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#777682'
  outline-variant: '#c7c5d3'
  surface-tint: '#5156a7'
  primary: '#15196c'
  on-primary: '#ffffff'
  primary-container: '#2d3282'
  on-primary-container: '#999ff5'
  inverse-primary: '#bfc2ff'
  secondary: '#4b6700'
  on-secondary: '#ffffff'
  secondary-container: '#b6f300'
  on-secondary-container: '#4f6c00'
  tertiary: '#54000a'
  on-tertiary: '#ffffff'
  tertiary-container: '#7c0516'
  on-tertiary-container: '#ff807d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bfc2ff'
  on-primary-fixed: '#070963'
  on-primary-fixed-variant: '#393e8e'
  secondary-fixed: '#b8f600'
  secondary-fixed-dim: '#a1d800'
  on-secondary-fixed: '#141f00'
  on-secondary-fixed-variant: '#384e00'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b0'
  on-tertiary-fixed: '#410006'
  on-tertiary-fixed-variant: '#8c1520'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -1px
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.5px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.5px
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-padding: 20px
  gutter: 16px
---

## Brand & Style

The brand personality of this design system is "The Empowering Guide." It aims to transform the often-intimidating world of finance into a welcoming, navigable, and even energetic experience. The target audience includes young professionals and small business owners who value efficiency but are repelled by the coldness of traditional banking interfaces.

The design style follows a **Modern Corporate** approach with a **Tactile** twist. It utilizes the depth and layering found in Material Design but softens it with a more organic color palette and exaggerated geometry. The interface prioritizes "flow-oriented" navigation—meaning every screen should naturally lead to the next logical action through visual cues and spatial metaphors. High-quality whitespace is treated as a functional element to prevent cognitive overload during financial decision-making.

## Colors

The color strategy for this design system balances authority with high-energy accents. 
- **Primary:** A deep, professional Indigo serves as the foundation, used for headers, primary text, and core navigation elements to establish trust.
- **Secondary:** An energetic Lime is used sparingly as a "vibrancy" color for growth indicators, primary action buttons, and success states, making the app feel alive and modern.
- **Tertiary:** A soft Coral is reserved for interactive alerts, promotional highlights, or secondary calls-to-action that require attention without the harshness of a standard red.
- **Neutrals:** The background utilizes an extremely light blue-gray to reduce eye strain, while cards and surfaces use pure white to pop against the backdrop.

## Typography

This design system utilizes **Manrope** for its entire type scale. Manrope is chosen for its modern, refined, and balanced characteristics which bridge the gap between technical SaaS tools and approachable consumer products. 

Headlines use heavy weights and tighter letter spacing to create a sense of importance and "material" weight. Body text remains generous in line height to ensure that complex financial data is highly readable even on small mobile screens. Labels and data points use a slightly heavier weight than body text to ensure they stand out as interactive or informative anchors within the UI.

## Layout & Spacing

The layout philosophy is built on an **8px linear grid system** to ensure mathematical harmony across all screen sizes. This design system uses a fluid grid approach where vertical rhythm is strictly maintained to create the "flow-oriented" feel. 

Margins and padding are intentionally oversized (utilizing `xl` and `xxl` units) to create the "plenty of whitespace" requested. This spaciousness is critical in financial data density; by giving elements room to breathe, the user feels a sense of calm and control. Mobile layouts should adhere to a 20px side margin to provide a safe "thumb zone" for navigation.

## Elevation & Depth

Visual hierarchy is established through **Ambient Shadows** and **Tonal Layering**. Unlike harsh, high-contrast shadows, this design system uses extra-diffused shadows with a slight tint of the Primary Indigo color (e.g., #2D3282 at 8-12% opacity). This creates a softer, more "materialistic" feel where cards appear to be floating gently above the surface rather than sitting flat.

Depth levels are defined as follows:
1.  **Level 0 (Base):** The neutral background surface.
2.  **Level 1 (Cards/Lists):** White surfaces with a soft, wide-spread shadow.
3.  **Level 2 (Active Elements):** Buttons and active inputs, which use a more condensed shadow to appear closer to the user.
4.  **Level 3 (Overlays/Modals):** Large-scale shadows to indicate significant depth and focus.

## Shapes

The shape language is defined by a large radius to remove any "sharp edges" from the financial experience. Standard UI components like small buttons use `rounded-md` (0.5rem), while primary cards and containers utilize `rounded-xl` (1.5rem) to create a friendly, non-intimidating silhouette. 

This roundedness is applied consistently to images, avatars, and input fields. For progress bars and chips, a fully rounded "pill" shape is preferred to emphasize the "flow" and continuity of the design style.

## Components

### Buttons
Primary buttons use the energetic Lime accent with dark Indigo text for maximum contrast. They feature a slight lift on hover (shadow increase) and a large 1rem corner radius. Secondary buttons should use a ghost style with an Indigo border or a soft Indigo tint.

### Cards
Cards are the primary container for financial data. They must have a white background, a 1.5rem corner radius, and the standard ambient shadow. Content within cards should have at least 24px of internal padding to maintain the spacious feel.

### Input Fields
Inputs are designed with a soft light-gray background and no border in their default state. Upon focus, they transition to a white background with a 2px Indigo border and a soft glow. This transition provides clear visual feedback for "flow."

### Data Visualization
Charts should avoid sharp angles. Line charts must use smooth bezier curves. Bar charts must have rounded top caps. Use the Primary, Secondary, and Tertiary colors for data series to maintain brand harmony.

### Chips & Tags
Chips are used for category filtering and status indicators. These should be pill-shaped and use low-saturation versions of the brand colors (e.g., a pale lime background with dark lime text) to keep the UI clean and readable.

## Application Architecture

### Technology Stack
- **Frontend**: React 19 with Vite, React Router for navigation, Recharts for analytics
- **Backend**: Python FastAPI with pdfplumber for PDF parsing
- **State Management**: React useState with lifted state for cross-page data sharing

### Routing Structure
The application uses client-side routing with three main pages:

1. **Home (`/`)**
   - Primary workspace for statement processing
   - Upload component with dynamic bank selection
   - Transaction view with editable fields
   - Filters (type, category, search)
   - Inline analytics toggle
   - Debug logs for troubleshooting

2. **About (`/about`)**
   - Brand showcase page
   - Feature highlights
   - Call-to-action buttons
   - Preview imagery

3. **Analytics (`/analytics`)**
   - Dedicated analytics dashboard
   - Comprehensive financial insights
   - Visual charts and metrics
   - Category breakdowns and patterns

### Navigation
- **Desktop**: Horizontal navigation bar with active route highlighting
- **Mobile**: Hamburger menu with vertical list
- Active routes use Primary Indigo background with white text
- Hover states include subtle scale transformation
- Smooth transitions between states

### Page Transitions
All pages use a `PageTransition` wrapper component for consistent entrance animations, creating a smooth, polished feel when navigating between sections.

## Component Architecture

### Core Components
- **Upload**: File upload with bank selection, password support, and status feedback
- **Summary**: Financial overview cards (total debit, credit, net balance)
- **Filters**: Type, category, and search controls with export dialog trigger
- **Table**: Editable transaction grid with inline editing support
- **DebugLogs**: Collapsible log viewer for parsing troubleshooting
- **ExportDialog**: CSV export with notes inclusion option
- **Analytics**: Comprehensive charts and insights dashboard
- **Footer**: Brand footer with navigation and links

### Page Components
- **Home**: Main application page with upload, transactions, and analytics
- **About**: Marketing/informational page
- **AnalyticsPage**: Dedicated analytics view (shares data with Home via props)

### State Management Strategy
Transaction data is lifted to the App component level and passed down via props to pages that need it. This allows:
- Data uploaded on Home page to be available on Analytics page
- Single source of truth for transaction data
- Clean separation of concerns

## Backend Architecture

### Parser System
Modular parser architecture with bank-specific implementations:

- **Canara Bank**: Table extraction with text fallback, supports DD-MM-YYYY dates
- **HDFC Bank**: Text-based parsing, supports DD/MM/YY dates
- **Union Bank**: UPI/IMPS transactions with merchant mappings
- **Federal Bank**: Table extraction, UPI/IFN/IMPS support, wallet categorization
- **SBI**: Table/text extraction, UPI/CR|DR detection, DD/MM/YYYY dates

### API Endpoints
- `GET /api/banks` - Returns list of supported banks
- `POST /api/parse` - Parses uploaded PDF statement
- **Payee Extraction**: Normalized text processing with merchant mappings
- **Transaction Categorization**: UPI, IMPS, IFN, ATM, NEFT, RTGS, Cheque, Other

## Supported Banks
The system dynamically fetches available banks from the backend, allowing new parsers to be added without frontend changes. Currently supports:
- HDFC
- Canara
- Union Bank
- Federal Bank
- SBI

## Responsive Design
- **Mobile First**: Design starts at mobile breakpoint (640px)
- **Grid System**: Fluid grid that adapts from single column (mobile) to multi-column (desktop)
- **Touch Targets**: Minimum 44px for interactive elements
- **Safe Areas**: 20px side margins on mobile for thumb zone

## Accessibility
- **Focus States**: Clear 2px Indigo ring on focused elements
- **Color Contrast**: WCAG AA compliant ratios
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader**: ARIA labels where needed