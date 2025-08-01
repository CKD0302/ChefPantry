# Chef Pantry - Freelance Chef Booking Platform

## Overview

Chef Pantry is a full-stack web application connecting freelance chefs with hospitality businesses. Built with React frontend, Express backend, and PostgreSQL database with Drizzle ORM, it provides a comprehensive platform for gig management, profile creation, invoicing, and payment processing.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth for user management
- **File Storage**: Supabase Storage for image uploads
- **Payment Processing**: Stripe for payment handling
- **Build**: esbuild for production bundling

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema**: Comprehensive relational schema including users, profiles, gigs, applications, invoices, and reviews
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication System
- Supabase-based authentication with role-based access (Chef, Business, Admin)
- JWT session management
- Role-specific dashboard routing
- Password reset functionality with email verification

### User Profile Management
- Dual profile types: Chef profiles and Business profiles
- Image upload with Supabase Storage integration
- Professional document management
- Portfolio showcase capabilities

### Gig Management System
- Business posting and chef application workflow
- Real-time application status tracking
- Automated notifications system
- Review and rating system post-completion

### Invoicing System
- Automated invoice generation post-gig
- Manual invoice creation for off-platform work
- Stripe integration for payment processing
- Business validation and matching

### File Management
- Multi-bucket Supabase Storage setup
- Image optimization and validation
- Professional document storage
- Secure file access controls

## Data Flow

### User Registration Flow
1. User registers with email/password via Supabase Auth
2. Role assignment (Chef/Business/Admin) stored in user metadata
3. Profile creation with role-specific fields
4. Dashboard access based on role permissions

### Gig Booking Flow
1. Business creates gig posting
2. Chefs browse and apply to gigs
3. Business reviews applications and accepts/rejects
4. Confirmation workflow for accepted applications
5. Post-completion invoicing and reviews

### Payment Flow
1. Chef submits invoice (automatic or manual)
2. Business receives notification
3. Stripe payment processing
4. Payment confirmation and record keeping

## External Dependencies

### Core Services
- **Supabase**: Authentication, database hosting, file storage
- **Stripe**: Payment processing and Connect for payouts
- **Neon Database**: PostgreSQL hosting (via DATABASE_URL)

### Development Tools
- **Vite**: Development server and build tool
- **Drizzle Kit**: Database migrations and schema management
- **TypeScript**: Type safety across the stack
- **ESBuild**: Production build optimization

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **React Hook Form**: Form management
- **Zod**: Schema validation

## Deployment Strategy

### Build Process
- Frontend: Vite builds static assets to `dist/public`
- Backend: ESBuild compiles TypeScript to `dist/index.js`
- Database: Drizzle pushes schema changes to PostgreSQL

### Environment Configuration
- Development: Local development with hot reload
- Production: Static assets served by Express server
- Database: PostgreSQL connection via DATABASE_URL
- External services: Supabase and Stripe via environment variables

### File Structure
- `client/`: React frontend application
- `server/`: Express backend with routes and database logic
- `shared/`: Common schemas and types
- `migrations/`: Database migration files

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- August 01, 2025. **DATABASE SCHEMA CLEANUP**: Removed duplicate bank detail fields from chef profiles table to maintain consistency. Eliminated redundant `bank_sort_code` and `bank_account_number` fields, keeping clear naming convention with `bankSortCode` and `bankAccountNumber` for chef profiles and `sort_code`/`account_number` for invoice-specific details.
- August 01, 2025. **MANUAL INVOICE BANK DETAILS FIX**: Fixed server-side issue where manual invoice bank details were being overridden by chef profile settings. Manual invoices now properly prioritize bank details entered in the invoice form over chef profile defaults, enabling true one-time payment events without requiring chefs to pre-configure payment settings.
- August 01, 2025. **INVOICE PDF GENERATION AND DOWNLOAD SYSTEM**: Implemented comprehensive invoice PDF generation with downloadable copies for businesses. Added jsPDF library for client-side PDF creation with professional invoice formatting including business branding, Chef Pantry logo, itemized billing details, payment information, and proper styling. Download buttons available on all invoice cards across pending, processing, and paid tabs. Businesses can now download professional invoices for emailing to clients and record keeping purposes.
- August 01, 2025. **PASSWORD RESET FUNCTIONALITY**: Implemented complete password reset system with forgot password page, reset password form, and email verification flow. Added resetPassword and updatePassword functions to authentication context. Users can now securely reset their passwords via email links.
- July 18, 2025. **COMPREHENSIVE REVIEW SYSTEM IMPLEMENTATION**: Completed full bidirectional review system with category-based ratings. Chefs rate venues on Organisation, Equipment, and Welcoming; venues rate chefs on Timekeeping, Appearance, and Role Fulfilment. Added review summary components with star ratings, category breakdowns, and rating distributions. Fixed all data type conversion issues between server and client. Review system properly syncs between chefs and businesses with sample data created for testing.
- July 18, 2025. Fixed Reviews page layout by moving Review Summary below main heading for better visual hierarchy and user experience
- July 18, 2025. Resolved JavaScript errors in review components by implementing proper data type conversion from SQL string results to JavaScript numbers
- July 09, 2025. **MAJOR ARCHITECTURE CHANGE**: Removed complex Stripe Connect integration and replaced with simplified direct payment model. Added payment_method and payment_link fields to gigInvoices table. Invoice creation now auto-fetches payment method details from chef profiles. Updated BusinessInvoices component to display payment method information with "Pay Now" buttons for Stripe payments and "Mark as Paid" for bank transfers.
- July 09, 2025. Added new payment method fields to chef_profiles table: payment_method, stripe_payment_link, bank_sort_code, bank_account_number with corresponding API endpoints and storage methods
- July 09, 2025. Enhanced invoice management with "Mark as Paid" functionality for manual invoices with bank transfer details, allowing businesses to manually mark invoices as paid after completing bank transfers
- July 09, 2025. Fixed UUID validation error in review checking system to prevent database errors when null values are passed
- July 07, 2025. Implemented comprehensive disclaimer flow for both chef and business profiles with role-specific disclaimer text and validation
- July 06, 2025. Initial setup