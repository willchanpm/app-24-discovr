# Discovr - AI-Powered Research Analysis Tool

Discovr is a web application that helps users analyze research data and develop strategic insights using AI. The application allows users to input their research data, define their strategy and metrics, and get AI-powered analysis and recommendations.

## Features

- **Data Input**: Upload files or paste text to provide research data for analysis
- **Strategy Definition**: Define your product strategy and key metrics
- **AI-Powered Analysis**: Get insights and recommendations based on your data
- **Interactive Chat**: Ask questions about your research data and get AI-powered responses
- **Demo Mode**: Try out the application with sample data
- **File Management**: Upload and manage research files
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: CSS Modules
- **AI Integration**: OpenAI API
- **Vector Database**: Pinecone
- **File Storage**: Local storage (with vector embeddings)

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file with your API keys:

   ```
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=your_pinecone_environment
   PINECONE_INDEX=your_pinecone_index
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Data Input**:
   - Upload research files (PDF, TXT, DOCX)
   - Paste research data directly
   - Files are processed and stored with vector embeddings

2. **Strategy Definition**:
   - Define your product strategy
   - Set key metrics to track
   - Save for future reference

3. **AI Analysis**:
   - Get AI-powered insights based on your data
   - Ask questions in the chat interface
   - Receive recommendations and analysis

4. **Demo Mode**:
   - Toggle demo mode to try the application with sample data
   - Sample data includes strategy, metrics, and research data
   - Perfect for testing and demonstration purposes

## Project Structure

```
app/
├── api/              # API routes
├── components/       # React components
├── data/            # Data input page
├── insights/        # Insights page
├── strategy/        # Strategy page
└── styles/          # CSS modules
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## AI integration

Insights use the OpenAI Responses API. Set `OPENAI_API_KEY` on the server and optionally `OPENAI_MODEL` (defaults to `gpt-4.1-mini`). `OPENAI_ASSISTANT_ID` is no longer used because the Assistants API retired in August 2026. The discovery instructions are versioned in `app/api/insights-chat/route.ts`.

Research text stays in browser storage until included in an insights request. Uploaded files use OpenAI file inputs; demo files are illustrative, and demo research text is included directly in the prompt. New chats use response IDs to retain follow-up context. Old Assistants thread histories cannot be loaded by this integration.

Run `node tests/insights.cjs` for mocked provider regression checks and `npm run build` for production validation.
