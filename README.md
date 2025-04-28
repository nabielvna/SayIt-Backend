# SayIt API

A modern RESTful API built with Hono, Clerk authentication, and PostgreSQL (via Drizzle ORM).

## 📋 Overview

SayIt API is a backend service that provides endpoints for user management, chat interactions with AI, and note-taking functionality. The API is designed with a focus on performance, security, and developer experience.

## 🚀 Features

- **Authentication**: Secure authentication using Clerk
- **User Management**: Create and manage user profiles
- **AI Chat**: Conversation capabilities with Gemini AI
- **Notes System**: Create, organize, and manage notes with tags and mood tracking
- **OpenAPI Documentation**: Auto-generated API documentation

## 🛠️ Tech Stack

- **Framework**: Hono.js
- **Authentication**: Clerk
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Documentation**: OpenAPI + Scalar UI
- **Logging**: Pino
- **TypeScript**: Type-safe codebase

## 🏗️ Project Structure

```
src/
├── app.ts                # Main application setup
├── env.ts               # Environment configuration
├── index.ts             # Entry point
├── constants/           # Constants like HTTP status codes
├── handlers/            # Global handlers
├── lib/                 # Utilities and shared code
├── middlewares/         # Middleware functions
├── routes/              # API routes organized by domain
└── db/                  # Database models and queries
```

## 🔧 Getting Started

### Prerequisites

- PostgreSQL database
- Clerk account
- Gemini API key

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
DATABASE_URL=postgresql://user:password@localhost:5432/sayit
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SIGNING_SECRET=your_clerk_webhook_signing_secret
GEMINI_API_KEY=your_gemini_api_key
```

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/nabielvna/SayIt-Backend.git
   cd SayIt-Backend
   ```

2. Install dependencies:

   ```bash
   bun i
   ```

3. Start the development server:
   ```bash
   bun dev
   ```

## 📚 API Documentation

Once the server is running, you can access the API documentation at:

- JSON Schema: `http://localhost:3001/doc`
- Interactive UI: `http://localhost:3001/doc-ui`

## 🛡️ Authentication

The API uses Clerk for authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

## 📝 License

[MIT](LICENSE)
