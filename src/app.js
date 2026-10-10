import express from 'express';
import loanRoutes from './routes/loanRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Library Loan API',
    version: '1.0.0',
    endpoints: {
      list: 'GET /loans?status=Terlambat',
      detail: 'GET /loans/:id',
      create: 'POST /loans',
      update: 'PUT /loans/:id',
      delete: 'DELETE /loans/:id',
    },
  });
});

app.use('/loans', loanRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
