# Log Analysis Application

A natural language interface for querying Elasticsearch logs, leveraging LLM technology to translate natural language queries into Elasticsearch DSL.

## Features

- **Natural Language Queries**: Ask questions in plain English to search your logs
- **Query Translation**: Automatic conversion of natural language to Elasticsearch DSL
- **Timeline Visualization**: See your log events on an interactive timeline
- **Query History**: Track and reuse your previous queries
- **Saved Queries**: Save frequently used queries for quick access
- **LLM Integration**: Enhanced query translation using specialized AI agents


## Architecture

The application consists of:

- **Frontend**: React.js with Redux for state management
- **Backend**: Node.js/Express RESTful API
- **Database**: MongoDB for user data, query history, and saved queries
- **Search Engine**: Elasticsearch for log storage and querying
- **LLM Integration**: Langchain framework for natural language processing

## Getting Started

### Prerequisites

- Node.js 16+
- MongoDB
- Elasticsearch 7.x
- Python 3.8+ (for CrewAI service)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/log-analysis-app.git
cd log-analysis-app
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Install Python dependencies for CrewAI service:
```bash
cd python_services/crewai_service
pip install -r requirements.txt
```

5. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

3. Start the CrewAI service:
```bash
cd backend/python_services/crewai_service
./start_services.sh
```

## Deployment

The application can be deployed using Docker and Kubernetes. See the [deployment guide](docs/deployment-guide.md) for detailed instructions.

## Documentation

- [User Guide](docs/user-guide.md)
- [API Reference](docs/api-reference.md)
- [CrewAI Integration](docs/crewai-integration.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
