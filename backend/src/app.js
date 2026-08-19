import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Trust reverse proxy header (X-Forwarded-Proto) for Render / Cloudflare deployment
app.set('trust proxy', 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.nodeEnv === 'development' ? 2000 : 600, // Reasonable threshold for API discovery & page loads
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Location service is temporarily unavailable due to high request volume. Please try again shortly.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 login/register requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
});

import path from 'path';

const allowedOrigins = [
  'https://www.joynus.online',
  'https://joynus.online',
  'http://localhost:5173',
  'http://localhost:3000',
  env.clientUrl,
].filter(Boolean);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);
app.use('/api', routes);


app.use(notFound);
app.use(errorHandler);

export default app;
