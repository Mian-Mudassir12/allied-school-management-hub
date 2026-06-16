import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export async function ensureUpgradeSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id serial PRIMARY KEY,
      roll_number text NOT NULL UNIQUE,
      name text NOT NULL,
      class text NOT NULL,
      section text,
      father_name text NOT NULL,
      mother_name text,
      phone text NOT NULL,
      father_phone text,
      home_phone text,
      whatsapp_number text,
      has_whatsapp boolean NOT NULL DEFAULT true,
      address text,
      admission_date date NOT NULL,
      monthly_fee integer NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      left_date date,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id serial PRIMARY KEY,
      name text NOT NULL,
      phone text NOT NULL,
      mobile_number text,
      home_number text,
      whatsapp_number text,
      qualification text NOT NULL DEFAULT '',
      address text,
      joining_date date NOT NULL,
      monthly_salary integer NOT NULL,
      subjects_taught text NOT NULL DEFAULT '',
      assigned_class text,
      teaching_assignments text NOT NULL DEFAULT '',
      timetable_notes text NOT NULL DEFAULT '',
      portal_username text,
      portal_password text,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS fee_records (
      id serial PRIMARY KEY,
      student_id integer NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      month integer NOT NULL,
      year integer NOT NULL,
      amount integer NOT NULL,
      paid boolean NOT NULL DEFAULT false,
      paid_date date,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id serial PRIMARY KEY,
      student_id integer NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      date date NOT NULL,
      present boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id serial PRIMARY KEY,
      title text NOT NULL,
      content text NOT NULL,
      target_role text NOT NULL DEFAULT 'all',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS credentials (
      id serial PRIMARY KEY,
      username text NOT NULL UNIQUE,
      password text NOT NULL,
      role text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS father_phone text;
    ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS home_phone text;
    ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS whatsapp_number text;
    ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS has_whatsapp boolean NOT NULL DEFAULT true;

    ALTER TABLE IF EXISTS teachers ADD COLUMN IF NOT EXISTS mobile_number text;
    ALTER TABLE IF EXISTS teachers ADD COLUMN IF NOT EXISTS home_number text;
    ALTER TABLE IF EXISTS teachers ADD COLUMN IF NOT EXISTS whatsapp_number text;
    ALTER TABLE IF EXISTS teachers ADD COLUMN IF NOT EXISTS qualification text NOT NULL DEFAULT '';
    ALTER TABLE IF EXISTS teachers ADD COLUMN IF NOT EXISTS teaching_assignments text NOT NULL DEFAULT '';
    ALTER TABLE IF EXISTS teachers ADD COLUMN IF NOT EXISTS timetable_notes text NOT NULL DEFAULT '';
    ALTER TABLE IF EXISTS teachers ADD COLUMN IF NOT EXISTS portal_username text;
    ALTER TABLE IF EXISTS teachers ADD COLUMN IF NOT EXISTS portal_password text;

    CREATE TABLE IF NOT EXISTS class_subjects (
      id serial PRIMARY KEY,
      class text NOT NULL,
      subject text NOT NULL,
      book_name text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS school_holidays (
      id serial PRIMARY KEY,
      date date NOT NULL,
      scope text NOT NULL DEFAULT 'school',
      class text,
      reason text NOT NULL DEFAULT 'Holiday',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS timetable_assignments (
      id serial PRIMARY KEY,
      teacher_id integer NOT NULL,
      class text NOT NULL,
      subject text NOT NULL,
      weekday text NOT NULL,
      start_time text NOT NULL,
      end_time text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS teacher_attendance (
      id serial PRIMARY KEY,
      teacher_id integer NOT NULL,
      date date NOT NULL,
      present boolean NOT NULL DEFAULT false,
      status text NOT NULL DEFAULT 'OFF / Absent',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS exam_papers (
      id serial PRIMARY KEY,
      teacher_id integer,
      title text NOT NULL,
      subject text NOT NULL,
      class text NOT NULL,
      exam_type text NOT NULL,
      total_marks integer NOT NULL DEFAULT 100,
      chapter_from text NOT NULL DEFAULT '',
      chapter_to text NOT NULL DEFAULT '',
      lesson_scope text NOT NULL DEFAULT '',
      file_url text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE IF EXISTS exam_papers ADD COLUMN IF NOT EXISTS total_marks integer NOT NULL DEFAULT 100;
    ALTER TABLE IF EXISTS exam_papers ADD COLUMN IF NOT EXISTS chapter_from text NOT NULL DEFAULT '';
    ALTER TABLE IF EXISTS exam_papers ADD COLUMN IF NOT EXISTS chapter_to text NOT NULL DEFAULT '';
    ALTER TABLE IF EXISTS exam_papers ADD COLUMN IF NOT EXISTS lesson_scope text NOT NULL DEFAULT '';

    CREATE TABLE IF NOT EXISTS exam_results (
      id serial PRIMARY KEY,
      student_id integer NOT NULL,
      paper_id integer,
      subject text NOT NULL,
      class text NOT NULL,
      total_marks integer NOT NULL,
      obtained_marks integer NOT NULL,
      percentage integer NOT NULL,
      grade text NOT NULL,
      status text NOT NULL,
      position integer,
      checked_paper_url text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE IF EXISTS exam_results ADD COLUMN IF NOT EXISTS checked_paper_url text NOT NULL DEFAULT '';

    CREATE TABLE IF NOT EXISTS syllabus_plans (
      id serial PRIMARY KEY,
      class text NOT NULL,
      subject text NOT NULL,
      plan_date date NOT NULL,
      chapter_name text NOT NULL,
      lesson text NOT NULL,
      content_scope text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS homework_diaries (
      id serial PRIMARY KEY,
      teacher_id integer,
      class text NOT NULL,
      subject text NOT NULL,
      diary_date date NOT NULL,
      taught_today text NOT NULL DEFAULT '',
      homework text NOT NULL,
      dispatch_status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

export * from "./schema";
