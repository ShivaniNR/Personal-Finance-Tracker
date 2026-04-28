require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { GraphQLError } = require('graphql');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { supabaseAdmin, createUserClient } = require('../services/supabase');
// const { parseTransaction } = require('../services/ai'); // AI feature — uncomment when ready

async function startServer() {
  const app = express();

  // Security middleware
  app.use(helmet());
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:4173'];

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window per IP
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // AI: Parse voice/text input into structured transaction data — uncomment when ready
  // app.post('/api/parse-transaction', async (req, res) => {
  //   try {
  //     const token = req.headers.authorization?.replace('Bearer ', '');
  //     if (!token) {
  //       return res.status(401).json({ error: 'Authentication required' });
  //     }
  //     const {
  //       data: { user },
  //       error: authError,
  //     } = await supabaseAdmin.auth.getUser(token);
  //     if (authError || !user) {
  //       return res.status(401).json({ error: 'Invalid or expired token' });
  //     }
  //     const { text } = req.body;
  //     if (!text || typeof text !== 'string' || text.trim().length === 0) {
  //       return res.status(400).json({ error: 'Text input is required' });
  //     }
  //     const supabase = createUserClient(token);
  //     const { data: categories, error: catError } = await supabase
  //       .from('categories')
  //       .select('name, type');
  //     if (catError) {
  //       console.error('Error fetching categories:', catError);
  //       return res.status(500).json({ error: 'Failed to fetch categories' });
  //     }
  //     const result = await parseTransaction(text.trim(), categories || []);
  //     res.json(result);
  //   } catch (err) {
  //     console.error('AI parse error:', err);
  //     res.status(422).json({
  //       error: 'Could not parse transaction. Please try manual entry.',
  //     });
  //   }
  // });

  // Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (formattedError, error) => {
      // Log errors server-side but don't expose internal details to client
      console.error('GraphQL Error:', error);

      // Pass through validation and auth errors as-is
      if (
        formattedError.extensions?.code === 'UNAUTHENTICATED' ||
        formattedError.extensions?.code === 'BAD_USER_INPUT'
      ) {
        return formattedError;
      }

      // For unexpected errors, return a generic message in production
      if (process.env.NODE_ENV === 'production') {
        return {
          message: 'An unexpected error occurred',
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        };
      }

      return formattedError;
    },
  });

  await server.start();

  // GraphQL endpoint with authentication
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // Verify the JWT with Supabase
        const {
          data: { user },
          error,
        } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
          throw new GraphQLError('Invalid or expired token', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // Create a user-scoped Supabase client that respects RLS
        const supabase = createUserClient(token);

        return {
          userId: user.id,
          supabase,
          token,
        };
      },
    })
  );

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}/graphql`);
    console.log(`Health check at http://localhost:${PORT}/health`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
