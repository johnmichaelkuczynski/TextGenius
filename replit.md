# Originality Meter

## Overview

The Originality Meter is a sophisticated text analysis application that evaluates documents across four key dimensions: originality, intelligence, cogency, and overall quality. The application supports both single and dual document analysis modes, offering users the flexibility to analyze individual texts or compare pairs of documents. Built as a full-stack web application, it leverages multiple LLM providers (Anthropic, OpenAI, Perplexity, and DeepSeek) to provide comprehensive assessments with detailed scoring and qualitative feedback.

## Recent Updates (August 19, 2025)

✅ **Complete Analysis Modes Added**
- **Quick Complete Analysis**: Runs all 4 parameters (originality, intelligence, cogency, quality) in quick mode with single button click
- **Comprehensive Complete Analysis**: Runs full 4-phase protocol for all 4 parameters with single button click  
- Backend processing logic handles complete analysis by running each parameter sequentially
- Results display groups complete analysis results by parameter with phase indicators
- UI shows helpful descriptions and time estimates for complete analysis modes
- File upload functionality completely fixed with proper FormData handling

✅ **Previous System Achievements**
- Complete 4-phase analysis protocol implemented per user specifications
- Comprehensive question sets integrated with exact user-provided questions
- Dual document comparison functionality working
- API key integration with Replit environment secrets operational
- Real LLM analysis calls successfully executing

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built using React with TypeScript, providing a modern and responsive user interface. The architecture follows a component-based design pattern with:

- **UI Framework**: React 18 with TypeScript for type safety and modern development practices
- **Styling**: Tailwind CSS with shadcn/ui components for consistent and accessible design
- **State Management**: React hooks for local state and TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **File Handling**: Built-in file upload capabilities supporting TXT, DOC, DOCX, and PDF formats

### Backend Architecture
The server is implemented using Node.js with Express.js, designed as a RESTful API with the following key characteristics:

- **API Design**: Express.js server with middleware for CORS, JSON parsing, and request logging
- **File Processing**: Multer for multipart file uploads with memory storage and size limits
- **Text Processing**: Custom chunking algorithms for handling large documents (500-1000 word chunks)
- **LLM Integration**: Abstracted client interfaces for multiple AI providers with standardized response formats
- **Analysis Engine**: Sequential processing system with configurable delays between API calls

### Data Storage Solutions
The application uses a hybrid storage approach:

- **Primary Database**: PostgreSQL with Drizzle ORM for structured data persistence
- **Schema Design**: Comprehensive analysis tracking with metadata, results storage, and performance metrics
- **Fallback Storage**: In-memory storage implementation for development and testing environments
- **Session Management**: PostgreSQL-backed session storage using connect-pg-simple

### Authentication and Authorization
The application implements a simple API key-based authentication system:

- **API Key Management**: Client-side storage of user-provided API keys for LLM services
- **Security**: API keys are handled securely with password input fields and local storage
- **Validation**: Server-side validation of API keys before processing requests

### LLM Integration Architecture
The system supports multiple LLM providers through a unified interface:

- **Provider Abstraction**: Common interface for all LLM providers with standardized request/response formats
- **Rate Limiting**: Built-in delays between requests to respect API rate limits
- **Error Handling**: Comprehensive error handling with fallback mechanisms
- **Response Processing**: Structured parsing of LLM responses into consistent scoring and feedback formats

### Text Processing Pipeline
The application implements a sophisticated text processing workflow:

- **Document Parsing**: Support for multiple file formats with content extraction
- **Chunking Strategy**: Intelligent text segmentation for large documents to prevent API limits
- **Question Generation**: Dynamic question sets based on evaluation parameters and analysis modes
- **Sequential Processing**: Chunk-by-chunk analysis with result aggregation
- **Report Generation**: Comprehensive report compilation with scoring and detailed feedback

### Analysis Modes and Configuration
The system offers flexible analysis configurations:

- **Document Modes**: Single document analysis and dual document comparison
- **Analysis Depth**: Quick mode (3 questions, ~30 seconds) and comprehensive mode (5+ questions, detailed analysis)
- **Evaluation Parameters**: Four distinct evaluation criteria with specialized question sets
- **LLM Selection**: User-configurable choice between multiple AI providers

## External Dependencies

### Core LLM Services
- **Anthropic Claude**: Primary LLM provider using claude-sonnet-4-20250514 model
- **OpenAI**: Secondary LLM provider with GPT models
- **Perplexity**: Alternative LLM provider for specialized analysis
- **DeepSeek**: Additional LLM provider option

### Database and Storage
- **Neon Database**: PostgreSQL hosting service using @neondatabase/serverless connector
- **Drizzle ORM**: Modern TypeScript ORM for database operations and migrations
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Development and Build Tools
- **Vite**: Fast build tool and development server with React plugin support
- **Replit Integration**: Development environment integration with @replit/vite-plugin-cartographer
- **TypeScript**: Type safety across the entire application stack

### UI and Styling Dependencies
- **Radix UI**: Comprehensive component library for accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide Icons**: Icon library for consistent iconography
- **TanStack Query**: Data fetching and caching library for optimal performance

### File Processing and Utilities
- **Multer**: Express middleware for handling multipart/form-data file uploads
- **React Dropzone**: File upload interface with drag-and-drop functionality
- **Date-fns**: Date manipulation and formatting utilities
- **Nanoid**: Unique ID generation for analysis tracking