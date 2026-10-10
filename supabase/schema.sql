-- Jalankan di Supabase Dashboard > SQL Editor
create extension if not exists "pgcrypto";

create table if not exists public.loans (
  id                   uuid primary key default gen_random_uuid(),
  nama_anggota         text not null,
  judul_buku           text not null,
  tanggal_pinjam       date not null default current_date,
  tanggal_jatuh_tempo  date not null,
  tanggal_kembali      date,
  status               text not null default 'Dipinjam'
                       check (status in ('Dipinjam', 'Dikembalikan', 'Terlambat')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (tanggal_jatuh_tempo >= tanggal_pinjam)
);

create index if not exists loans_status_idx on public.loans (status);
create index if not exists loans_jatuh_tempo_idx on public.loans (tanggal_jatuh_tempo);

-- RLS aktif; service_role key otomatis melewati RLS
alter table public.loans enable row level security;

-- Data contoh (opsional)
insert into public.loans (nama_anggota, judul_buku, tanggal_pinjam, tanggal_jatuh_tempo, status) values
  ('Budi Santoso', 'Laskar Pelangi', current_date - 20, current_date - 6, 'Dipinjam'),
  ('Siti Aminah',  'Bumi Manusia',   current_date - 3,  current_date + 11, 'Dipinjam'),
  ('Andi Wijaya',  'Clean Code',     current_date - 30, current_date - 16, 'Dikembalikan');
