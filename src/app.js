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
      list: 'GET /loans',
      filter_terlambat: 'GET /loans?status=Terlambat',
      detail: 'GET /loans/:id',
      create: 'POST /loans',
      update: 'PATCH /loans/:id',
      delete: 'DELETE /loans/:id',
    },
    example_loans: [
      {
        nama_anggota: 'Budi Santoso',
        judul_buku: 'Laskar Pelangi',
        status: 'Dipinjam',
      },
      {
        nama_anggota: 'Siti Aminah',
        judul_buku: 'Bumi Manusia',
        status: 'Terlambat',
      },
      {
        nama_anggota: 'Andi Wijaya',
        judul_buku: 'Clean Code',
        status: 'Dikembalikan',
      },
    ],
  });
});


app.use('/loans', loanRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
