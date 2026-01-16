# Chef Pantry - Freelance Chef Booking Platform

## Overview
Chef Pantry is a full-stack web application designed to connect freelance chefs with hospitality businesses. It provides a comprehensive platform for gig management, professional profile creation, invoicing, and payment processing. The project aims to streamline the hiring process for businesses and offer freelance chefs a robust tool for managing their work, finances, and professional presence in the gig economy.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
-   **Framework**: React 18 with TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS with custom design system
-   **UI Components**: Radix UI primitives with custom shadcn/ui components
-   **State Management**: TanStack Query (server state), React hooks (local state)
-   **Routing**: Wouter
-   **Forms**: React Hook Form with Zod validation
-   **Mobile App Support**: Hybrid iOS/Android apps via Capacitor 7, wrapping the React web app. Utilizes `html5-qrcode` for QR scanning.

### Backend
-   **Framework**: Express.js with TypeScript
-   **Database**: PostgreSQL with Drizzle ORM
-   **Authentication**: Supabase Auth with role-based access (Chef, Business, Admin)
-   **File Storage**: Supabase Storage
-   **Payment Processing**: Stripe for payment handling
-   **Build**: esbuild

### Database Design
-   **ORM**: Drizzle with PostgreSQL dialect
-   **Schema**: Relational schema for users, profiles, gigs, applications, invoices, reviews, notifications, and time tracking.
-   **Migrations**: Drizzle Kit

### Key Features
-   **Authentication System**: Supabase-based with JWTs and role-based access. Includes password reset.
-   **User Profile Management**: Dual profile types (Chef, Business) with image upload, document management, and portfolio showcase.
-   **Gig Management System**: Business gig posting, chef applications, real-time status tracking, automated notifications, and post-completion review/rating system.
-   **Invoicing System**: Automated and manual invoice generation, Stripe integration for payments, and business validation.
-   **File Management**: Secure multi-bucket Supabase Storage for images and documents.
-   **Notifications System**: Database-driven, with API endpoints and automated triggers for events like invoice submissions.
-   **Review System**: Bidirectional, category-based ratings for both chefs and businesses.
-   **Time Tracking System**: Comprehensive clock-in/out functionality for chefs at venues/gigs, including live timers, shift history, QR code-based clock-in/out, and timesheet review/approval for businesses. Integrates with invoicing for earnings calculation.
-   **Invoice PDF Generation**: Client-side PDF generation for invoices, including branding and detailed billing.
-   **Security**: Row Level Security (RLS) policies implemented via Supabase for data protection, with distinct client-side and server-side access configurations.

## External Dependencies

### Core Services
-   **Supabase**: Authentication, database hosting, file storage.
-   **Stripe**: Payment processing and Connect for payouts.
-   **Neon Database**: PostgreSQL hosting.

### Development Tools
-   **Vite**: Frontend development and build.
-   **Drizzle Kit**: Database migrations.
-   **TypeScript**: Type safety.
-   **ESBuild**: Backend production bundling.
-   **Capacitor**: Hybrid mobile app development.

### UI Libraries
-   **Radix UI**: Accessible component primitives.
-   **Tailwind CSS**: Utility-first styling.
-   **Lucide React**: Icon library.
-   **React Hook Form**: Form management.
-   **Zod**: Schema validation.
-   **jsPDF**: Client-side PDF generation.
-   **html5-qrcode**: QR code scanning for mobile.