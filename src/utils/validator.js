import { HttpError } from './httpError.js';

export const VALID_STATUS = ['Dipinjam', 'Dikembalikan', 'Terlambat'];
export const SORTABLE = [
  'created_at', 'tanggal_pinjam', 'tanggal_jatuh_tempo',
  'nama_anggota', 'judul_buku', 'status',
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const today = () => new Date().toISOString().slice(0, 10);
const isValidDate = (s) => DATE_RE.test(s) && !Number.isNaN(Date.parse(s));

export const isUuid = (id) => UUID_RE.test(id);

/** Validasi body untuk POST (partial=false) dan PUT/PATCH (partial=true). */
export function validateLoanBody(body, { partial }) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Body request harus berupa objek JSON');
  }

  const errors = [];
  const out = {};

  if (!partial) {
    ['nama_anggota', 'judul_buku', 'tanggal_jatuh_tempo'].forEach((f) => {
      if (body[f] === undefined || body[f] === null || body[f] === '') errors.push(`${f} wajib diisi`);
    });
  }

  ['nama_anggota', 'judul_buku'].forEach((f) => {
    if (body[f] !== undefined) {
      if (typeof body[f] !== 'string' || !body[f].trim()) errors.push(`${f} harus berupa teks tidak kosong`);
      else out[f] = body[f].trim();
    }
  });

  ['tanggal_pinjam', 'tanggal_jatuh_tempo', 'tanggal_kembali'].forEach((f) => {
    if (body[f] !== undefined) {
      if (body[f] === null && f === 'tanggal_kembali') out[f] = null;
      else if (typeof body[f] !== 'string' || !isValidDate(body[f])) errors.push(`${f} harus berformat YYYY-MM-DD`);
      else out[f] = body[f];
    }
  });

  if (body.status !== undefined) {
    if (!VALID_STATUS.includes(body.status)) errors.push(`status harus salah satu dari: ${VALID_STATUS.join(', ')}`);
    else out.status = body.status;
  }

  if (out.tanggal_pinjam && out.tanggal_jatuh_tempo && out.tanggal_jatuh_tempo < out.tanggal_pinjam) {
    errors.push('tanggal_jatuh_tempo tidak boleh sebelum tanggal_pinjam');
  }

  if (errors.length) throw new HttpError(400, 'Validasi gagal', errors);
  if (partial && Object.keys(out).length === 0) {
    throw new HttpError(400, 'Tidak ada field valid untuk diperbarui');
  }
  return out;
}
