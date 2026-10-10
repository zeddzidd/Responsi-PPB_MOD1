import { supabase, isSupabaseConfigured } from '../config/supabaseClient.js';
import { today } from '../utils/validator.js';
import { randomUUID } from 'crypto';

const TABLE = 'loans';

// In-Memory store untuk testing tanpa Supabase
let mockLoans = [
  {
    id: '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b',
    nama_anggota: 'Budi Santoso',
    judul_buku: 'Laskar Pelangi',
    tanggal_pinjam: '2026-10-01',
    tanggal_jatuh_tempo: '2026-10-15',
    tanggal_kembali: null,
    status: 'Dipinjam',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7a1c9d2e-8b3f-4c5d-a6e7-0f1a2b3c4d5e',
    nama_anggota: 'Siti Aminah',
    judul_buku: 'Bumi Manusia',
    tanggal_pinjam: '2026-09-20',
    tanggal_jatuh_tempo: '2026-10-04',
    tanggal_kembali: null,
    status: 'Terlambat',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e4f5a6b7-8c9d-0e1f-2a3b-4c5d6e7f8a9b',
    nama_anggota: 'Andi Wijaya',
    judul_buku: 'Clean Code',
    tanggal_pinjam: '2026-09-10',
    tanggal_jatuh_tempo: '2026-09-24',
    tanggal_kembali: '2026-09-22',
    status: 'Dikembalikan',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const LoanModel = {
  /** Peminjaman "Dipinjam" yang lewat jatuh tempo otomatis menjadi "Terlambat". */
  async syncOverdue() {
    if (!isSupabaseConfigured) {
      const nowStr = today();
      mockLoans.forEach((item) => {
        if (item.status === 'Dipinjam' && item.tanggal_jatuh_tempo < nowStr) {
          item.status = 'Terlambat';
          item.updated_at = new Date().toISOString();
        }
      });
      return;
    }

    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'Terlambat', updated_at: new Date().toISOString() })
      .eq('status', 'Dipinjam')
      .lt('tanggal_jatuh_tempo', today());
    if (error) throw error;
  },

  async getAll({ status, nama_anggota, judul_buku, sort = 'created_at', order = 'desc', page = 1, limit = 10 }) {
    if (!isSupabaseConfigured) {
      let filtered = [...mockLoans];
      if (status) filtered = filtered.filter((item) => item.status === status);
      if (nama_anggota)
        filtered = filtered.filter((item) =>
          item.nama_anggota.toLowerCase().includes(nama_anggota.toLowerCase())
        );
      if (judul_buku)
        filtered = filtered.filter((item) =>
          item.judul_buku.toLowerCase().includes(judul_buku.toLowerCase())
        );

      filtered.sort((a, b) => {
        let valA = a[sort] || '';
        let valB = b[sort] || '';
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });

      const total = filtered.length;
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit);
      return { data, count: total };
    }

    let query = supabase.from(TABLE).select('*', { count: 'exact' });

    const esc = (s) => String(s).replace(/[%,()]/g, '');
    if (status) query = query.eq('status', status);
    if (nama_anggota) query = query.ilike('nama_anggota', `%${esc(nama_anggota)}%`);
    if (judul_buku) query = query.ilike('judul_buku', `%${esc(judul_buku)}%`);

    const from = (page - 1) * limit;
    const { data, count, error } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(from, from + limit - 1);
    if (error) throw error;
    return { data, count };
  },

  async getById(id) {
    if (!isSupabaseConfigured) {
      const found = mockLoans.find((item) => item.id === id);
      return found || null;
    }

    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    if (!isSupabaseConfigured) {
      const now = new Date().toISOString();
      const newLoan = {
        id: randomUUID(),
        nama_anggota: payload.nama_anggota,
        judul_buku: payload.judul_buku,
        tanggal_pinjam: payload.tanggal_pinjam || today(),
        tanggal_jatuh_tempo: payload.tanggal_jatuh_tempo,
        tanggal_kembali: payload.tanggal_kembali || null,
        status: payload.status || 'Dipinjam',
        created_at: now,
        updated_at: now,
      };
      mockLoans.unshift(newLoan);
      return newLoan;
    }

    const { data, error } = await supabase.from(TABLE).insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    if (!isSupabaseConfigured) {
      const index = mockLoans.findIndex((item) => item.id === id);
      if (index === -1) return null;
      mockLoans[index] = {
        ...mockLoans[index],
        ...payload,
        updated_at: new Date().toISOString(),
      };
      return mockLoans[index];
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    if (!isSupabaseConfigured) {
      const index = mockLoans.findIndex((item) => item.id === id);
      if (index === -1) return null;
      const removed = mockLoans.splice(index, 1)[0];
      return removed;
    }

    const { data, error } = await supabase.from(TABLE).delete().eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data;
  },
};

