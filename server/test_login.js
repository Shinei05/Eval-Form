import "dotenv/config";
globalThis.vi = {
  fn: (impl) => {
    const f = (...args) => {
      f.mock.calls.push(args);
      return impl ? impl(...args) : undefined;
    };
    f.mock = { calls: [] };
    return f;
  }
};

import { loginStudent } from "./src/controllers/auth.controller.js";
import pool from "./src/config/supabase.js";
import bcrypt from "bcryptjs";
import { mockReq, mockRes } from "./tests/helpers.js";

// mock the pool.query
pool.query = async (sql, params) => {
  console.log("SQL executed:", sql, params);
  if (sql.includes("FROM users")) {
    return { rows: [{ id: 1, email: "s@test.com", password: "hashed" }], rowCount: 1 };
  }
  if (sql.includes("FROM schedules")) {
    // Return a valid active schedule to pass activePeriod check
    return {
      rows: [{
        p1_date_start: "2026-01-01",
        p1_time_start: "00:00",
        p1_date_end: "2026-12-31",
        p1_time_end: "23:59",
      }],
      rowCount: 1
    };
  }
  if (sql.includes("FROM students")) {
    return {
      rows: [{
        id: 10,
        firstname: "John",
        lastname: "Doe",
        grade: "10",
        section: "A",
        stud_id: 12345,
      }],
      rowCount: 1
    };
  }
  return { rows: [], rowCount: 0 };
};

// mock bcrypt
bcrypt.compare = async () => true;

async function run() {
  const req = mockReq({ body: { email: "s@test.com", password: "pass" } });
  const res = mockRes();
  try {
    await loginStudent(req, res);
    console.log("Status:", res._status);
    console.log("JSON:", res._json);
  } catch (err) {
    console.error("Exception:", err);
  }
  process.exit(0);
}

run();
