import { LoanModel } from '../models/loanModel.js';
import { HttpError } from '../utils/httpError.js';
import {
  SORTABLE, VALID_STATUS, isUuid, today, validateLoanBody,
} from '../utils/validator.js';

const assertId = (id) => {
  if (!isUuid(id)) throw new HttpError(400, 'Format id tidak valid (harus UUID)');
};

export const LoanController = {
  // GET /loans?status=&nama_anggota=&judul_buku=&sort=&order=&page=&limit=
  async getAll(req, res) {
    const { status, nama_anggota, judul_buku, sort = 'created_at', order = 'desc' } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    if (status && !VALID_STATUS.includes(status)) {
      throw new HttpError(400, `status harus salah satu dari: ${VALID_STATUS.join(', ')}`);
    }
    if (!SORTABLE.includes(sort)) {
      throw new HttpError(400, `sort harus salah satu dari: ${SORTABLE.join(', ')}`);
    }

    await LoanModel.syncOverdue();
    const { data, count } = await LoanModel.getAll({
      status, nama_anggota, judul_buku, sort, order, page, limit,
    });

    res.json({
      success: true,
      meta: { page, limit, total: count, total_pages: Math.ceil((count || 0) / limit) },
      data,
    });
  },

  // GET /loans/:id
  async getById(req, res) {
    assertId(req.params.id);
    await LoanModel.syncOverdue();
    const loan = await LoanModel.getById(req.params.id);
    if (!loan) throw new HttpError(404, 'Data peminjaman tidak ditemukan');
    res.json({ success: true, data: loan });
  },

  // POST /loans
  async create(req, res) {
    const payload = validateLoanBody(req.body, { partial: false });
    payload.tanggal_pinjam = payload.tanggal_pinjam || today();
    payload.status = payload.status || 'Dipinjam';
    if (payload.tanggal_jatuh_tempo < payload.tanggal_pinjam) {
      throw new HttpError(400, 'tanggal_jatuh_tempo tidak boleh sebelum tanggal_pinjam');
    }
    if (payload.status === 'Dikembalikan' && !payload.tanggal_kembali) {
      payload.tanggal_kembali = today();
    }
    const loan = await LoanModel.create(payload);
    res.status(201).json({ success: true, message: 'Peminjaman berhasil dicatat', data: loan });
  },

  // PUT / PATCH /loans/:id
  async update(req, res) {
    assertId(req.params.id);
    const payload = validateLoanBody(req.body, { partial: true });
    if (payload.status === 'Dikembalikan' && payload.tanggal_kembali === undefined) {
      payload.tanggal_kembali = today();
    }
    let loan;
    try {
      loan = await LoanModel.update(req.params.id, payload);
    } catch (err) {
      if (err.code === '23514') {
        throw new HttpError(400, 'tanggal_jatuh_tempo tidak boleh sebelum tanggal_pinjam');
      }
      throw err;
    }
    if (!loan) throw new HttpError(404, 'Data peminjaman tidak ditemukan');
    res.json({ success: true, message: 'Data peminjaman berhasil diperbarui', data: loan });
  },

  // DELETE /loans/:id
  async remove(req, res) {
    assertId(req.params.id);
    const loan = await LoanModel.remove(req.params.id);
    if (!loan) throw new HttpError(404, 'Data peminjaman tidak ditemukan');
    res.json({ success: true, message: 'Data peminjaman berhasil dihapus', data: loan });
  },
};
