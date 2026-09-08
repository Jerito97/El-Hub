// Seeds the same demo data the original Claude Design prototype shipped
// with, so the app can be clicked through immediately after setup.
//
// Usage:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
//
// Safe to re-run: it skips users that already exist (by name).

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const usersSeed = [
  { name: "Nacho", pin: "1234", alias: "nacho.mp.hub" },
  { name: "Sofi", pin: "1234", alias: "sofi.transfiere" },
  { name: "Mica", pin: "2580", alias: "mica.ahorro.uala" },
  { name: "Facu", pin: "4321", alias: "" },
  { name: "Caro", pin: "9999", alias: "caro.brubank" },
];

async function upsertUser(u) {
  const { data: existing } = await db
    .from("users")
    .select("id")
    .eq("name_key", u.name.toLowerCase())
    .maybeSingle();
  if (existing) return existing.id;
  const pin_hash = await bcrypt.hash(u.pin, 10);
  const { data, error } = await db
    .from("users")
    .insert({ name: u.name, pin_hash, alias: u.alias })
    .select("id")
    .single();
  if (error) throw error;
  await db.from("prefs").insert({ user_id: data.id });
  return data.id;
}

async function main() {
  const ids = {};
  for (const u of usersSeed) {
    ids[u.name] = await upsertUser(u);
  }
  console.log("Users ready:", ids);

  const { count } = await db.from("people").select("*", { count: "exact", head: true });
  if (count && count > 0) {
    console.log("people table already has rows, skipping people/events seed.");
    return;
  }

  const people = [
    { name: "Sofi", kind: "cumple", month: 9, day: 7, year: 1996, user_id: ids.Sofi, added_by_id: ids.Nacho },
    { name: "Sofi y Tomi", kind: "aniversario", month: 9, day: 14, year: 2019, user_id: null, added_by_id: ids.Nacho },
    { name: "Tomi", kind: "cumple", month: 9, day: 11, year: 1995, user_id: null, added_by_id: ids.Mica },
    { name: "Mica", kind: "cumple", month: 9, day: 19, year: 1994, user_id: ids.Mica, added_by_id: ids.Sofi },
    { name: "Facu", kind: "cumple", month: 10, day: 2, year: 1995, user_id: ids.Facu, added_by_id: ids.Facu },
    { name: "Juli", kind: "cumple", month: 10, day: 14, year: 1997, user_id: null, added_by_id: ids.Nacho },
    { name: "Nacho", kind: "cumple", month: 11, day: 3, year: 1995, user_id: ids.Nacho, added_by_id: ids.Nacho },
    { name: "Caro", kind: "cumple", month: 11, day: 28, year: 1996, user_id: ids.Caro, added_by_id: ids.Caro },
    { name: "Lu", kind: "cumple", month: 12, day: 24, year: 1998, user_id: null, added_by_id: ids.Sofi },
  ];
  const { error: peopleErr } = await db.from("people").insert(people);
  if (peopleErr) throw peopleErr;
  console.log("Seeded people.");

  async function makeEvent({ name, createdBy, closed, participants, expenses, payments }) {
    const { data: ev, error } = await db
      .from("events")
      .insert({ name, created_by: createdBy, closed: !!closed })
      .select("id")
      .single();
    if (error) throw error;
    await db.from("event_participants").insert(participants.map((user_id) => ({ event_id: ev.id, user_id })));
    for (const x of expenses || []) {
      const { data: exp, error: expErr } = await db
        .from("expenses")
        .insert({ event_id: ev.id, description: x.desc, amount: x.amount, payer_id: x.payer })
        .select("id")
        .single();
      if (expErr) throw expErr;
      await db.from("expense_shares").insert(x.shares.map((user_id) => ({ expense_id: exp.id, user_id })));
    }
    for (const p of payments || []) {
      await db.from("payments").insert({ event_id: ev.id, from_id: p.from, to_id: p.to, amount: p.amount });
    }
    return ev.id;
  }

  await makeEvent({
    name: "Finde en Mar del Plata",
    createdBy: ids.Nacho,
    participants: [ids.Nacho, ids.Sofi, ids.Mica, ids.Facu],
    expenses: [
      { desc: "Alquiler de la casa", amount: 96000, payer: ids.Nacho, shares: [ids.Nacho, ids.Sofi, ids.Mica, ids.Facu] },
      { desc: "Nafta ida y vuelta", amount: 42000, payer: ids.Facu, shares: [ids.Nacho, ids.Sofi, ids.Mica, ids.Facu] },
      { desc: "Súper del viernes", amount: 38500, payer: ids.Sofi, shares: [ids.Nacho, ids.Sofi, ids.Mica, ids.Facu] },
      { desc: "Bar del sábado", amount: 24000, payer: ids.Mica, shares: [ids.Nacho, ids.Sofi, ids.Mica] },
    ],
  });

  await makeEvent({
    name: "Cena cumple Sofi",
    createdBy: ids.Caro,
    participants: [ids.Nacho, ids.Sofi, ids.Caro],
    expenses: [
      { desc: "Restaurante", amount: 84000, payer: ids.Caro, shares: [ids.Nacho, ids.Sofi, ids.Caro] },
      { desc: "Torta", amount: 18000, payer: ids.Nacho, shares: [ids.Nacho, ids.Caro] },
    ],
  });

  await makeEvent({
    name: "Asado en casa de Facu",
    createdBy: ids.Facu,
    participants: [ids.Nacho, ids.Facu, ids.Mica],
    expenses: [
      { desc: "Carne y carbón", amount: 61000, payer: ids.Facu, shares: [ids.Nacho, ids.Facu, ids.Mica] },
      { desc: "Bebidas", amount: 22500, payer: ids.Mica, shares: [ids.Nacho, ids.Facu, ids.Mica] },
    ],
  });

  await makeEvent({
    name: "Previa de año nuevo",
    createdBy: ids.Nacho,
    participants: [ids.Nacho, ids.Sofi],
    expenses: [{ desc: "Fernet y hielo", amount: 24000, payer: ids.Nacho, shares: [ids.Nacho, ids.Sofi] }],
    payments: [{ from: ids.Sofi, to: ids.Nacho, amount: 12000 }],
  });

  await makeEvent({ name: "Torneo de padel", createdBy: ids.Caro, participants: [ids.Sofi, ids.Mica, ids.Caro], expenses: [] });
  await makeEvent({ name: "Regalo para Mica", createdBy: ids.Sofi, participants: [ids.Sofi, ids.Facu, ids.Caro], expenses: [] });
  await makeEvent({ name: "Bariloche invierno", createdBy: ids.Facu, participants: [ids.Facu, ids.Caro], expenses: [] });
  await makeEvent({ name: "Cumple sorpresa Nacho", createdBy: ids.Sofi, participants: [ids.Sofi, ids.Mica, ids.Facu, ids.Caro], expenses: [] });

  console.log("Seeded events.");
  console.log("\nDemo logins: Nacho/1234, Sofi/1234, Mica/2580, Facu/4321, Caro/9999");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
