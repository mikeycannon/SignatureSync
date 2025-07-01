# Email Signature Generator SaaS

## Overview

This is a multi-tenant email signature generator SaaS application built with React, Express.js, and PostgreSQL. The application allows organizations to create, manage, and distribute professional email signatures across their teams with role-based access control and asset management capabilities.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server:

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool and development server
- **TailwindCSS** for styling with shadcn/ui component library
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation for form handling

### Backend Architecture  
- **Express.js** with TypeScript for the REST API
- **JWT-based authentication** with tenant isolation
- **Drizzle ORM** for database operations with PostgreSQL
- **Multer** for file upload handling
- **RESTful API design** with proper error handling and logging

### Database Architecture
- **PostgreSQL** with Neon serverless integration
- **Multi-tenant data isolation** at the database level
- **Drizzle migrations** for schema management

## Key Components

### Authentication & Authorization
- JWT token-based authentication system
- Multi-tenant architecture with tenant isolation
- Role-based access control (admin/member roles)
- Middleware for authentication and tenant access validation

### Data Models
- **Tenants**: Organization-level entities with plan-based limitations
- **Users**: Team members with roles and tenant associations
- **Signature Templates**: Reusable email signature designs
- **Assets**: Centralized media library for logos and images
- **User Signatures**: Individual signature instances
- **Activities**: Audit trail for system actions

### UI Components
- Comprehensive component library built on Radix UI primitives
- Custom signature editor with real-time preview
- Responsive design with mobile-first approach
- Toast notifications and modal dialogs
- Data tables with sorting and filtering

## Data Flow

1. **Authentication Flow**: Users authenticate via JWT tokens, establishing tenant context
2. **API Requests**: All API calls include tenant validation middleware
3. **Data Isolation**: Database queries are scoped to the authenticated tenant
4. **File Uploads**: Assets are uploaded via multipart form data and stored with tenant association
5. **Real-time Updates**: Client state is managed through React Query with optimistic updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **TypeScript**: Static type checking
- **Vite**: Build tool and dev server
- **ESBuild**: JavaScript bundler for production
- **PostCSS**: CSS processing

### Authentication & Security
- **jsonwebtoken**: JWT token handling
- **bcrypt**: Password hashing (implied)
- **multer**: File upload middleware

## Deployment Strategy

### Development
- Vite development server with HMR
- Express server running on Node.js
- Database migrations via Drizzle Kit
- Environment variable configuration

### Production Build
- Client: Vite builds static assets to `dist/public`
- Server: ESBuild bundles Express server to `dist/index.js`
- Single deployment artifact with both client and server
- Database connection via `DATABASE_URL` environment variable

### Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run db:push`: Apply database schema changes

## Changelog
- July 01, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.