import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

function loadEnv() {
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    process.env[trimmed.slice(0, index)] ??= trimmed.slice(index + 1);
  }
}

const password = "Pelatec123!";

const demoPlayers = [
  {
    email: "ana.owner@pelatec.demo",
    name: "Ana Carolina Souza",
    username: "ana_capita",
    nickname: "Capita",
    phone: "(81) 99901-1101",
    age: 31,
    position: "midfielder",
    height_cm: 168,
    weight_kg: 64,
    play_style: "Organizadora",
    player_description: "Gosta de cadenciar o jogo, chamar a tabela curta e manter a pelada bem organizada.",
    shooting: 1,
    dribbling: 1,
    passing: 4,
    strength: 1,
    speed: 1,
    defense: 2,
    last_lat: -7.94085,
    last_lng: -34.87291,
    last_location_label: "Paulista - PE",
    last_location_source: "manual"
  },
  {
    email: "bruno.admin@pelatec.demo",
    name: "Bruno Henrique Lima",
    username: "bruno_muralha",
    nickname: "Muralha",
    phone: "(81) 99902-1102",
    age: 34,
    position: "goalkeeper",
    height_cm: 184,
    weight_kg: 86,
    play_style: "Goleiro linha",
    player_description: "Fecha bem o gol e sai jogando quando o time precisa respirar.",
    shooting: 0,
    dribbling: 1,
    passing: 2,
    strength: 2,
    speed: 1,
    defense: 4,
    last_lat: -7.9342,
    last_lng: -34.8817,
    last_location_label: "Janga, Paulista - PE",
    last_location_source: "manual"
  },
  {
    email: "carlos.player@pelatec.demo",
    name: "Carlos Eduardo Melo",
    username: "dudu_gol",
    nickname: "Dudu Gol",
    phone: "(81) 99903-1103",
    age: 28,
    position: "striker",
    height_cm: 176,
    weight_kg: 78,
    play_style: "Goleador",
    player_description: "Ataca o espaco, finaliza rapido e sempre aparece para a bola decisiva.",
    shooting: 4,
    dribbling: 1,
    passing: 1,
    strength: 1,
    speed: 2,
    defense: 1,
    last_lat: -7.9635,
    last_lng: -34.8454,
    last_location_label: "Maranguape I, Paulista - PE",
    last_location_source: "manual"
  },
  {
    email: "diego.player@pelatec.demo",
    name: "Diego Rafael Santos",
    username: "diego_motor",
    nickname: "Motor",
    age: 26,
    position: "fullback",
    height_cm: 172,
    weight_kg: 70,
    play_style: "Corredor",
    player_description: "Nao para de correr, cobre a lateral toda e ajuda na recomposicao.",
    shooting: 1,
    dribbling: 1,
    passing: 1,
    strength: 1,
    speed: 4,
    defense: 2,
    last_lat: -8.0089,
    last_lng: -34.8553,
    last_location_label: "Olinda - PE",
    last_location_source: "manual"
  },
  {
    email: "elaine.player@pelatec.demo",
    name: "Elaine Martins Rocha",
    username: "elaine_drible",
    nickname: "Ela",
    age: 29,
    position: "midfielder",
    height_cm: 165,
    weight_kg: 60,
    play_style: "Dribladora",
    player_description: "Procura o um contra um e costuma quebrar linhas com dribles curtos.",
    shooting: 1,
    dribbling: 4,
    passing: 2,
    strength: 0,
    speed: 2,
    defense: 1,
    last_lat: -8.0522,
    last_lng: -34.9286,
    last_location_label: "Casa Amarela, Recife - PE",
    last_location_source: "manual"
  },
  {
    email: "fabio.player@pelatec.demo",
    name: "Fabio Nascimento",
    username: "fabio_zaga",
    nickname: "Zaga",
    age: 37,
    position: "center_back",
    height_cm: 181,
    weight_kg: 84,
    play_style: "Brutamontes",
    player_description: "Ganha dividida, protege bem a area e gosta de jogo fisico.",
    shooting: 1,
    dribbling: 0,
    passing: 1,
    strength: 4,
    speed: 1,
    defense: 3,
    last_lat: -8.0641,
    last_lng: -34.8786,
    last_location_label: "Boa Vista, Recife - PE",
    last_location_source: "manual"
  },
  {
    email: "gabi.player@pelatec.demo",
    name: "Gabriela Monteiro",
    username: "gabi_passe",
    nickname: "Gabi",
    age: 25,
    position: "midfielder",
    height_cm: 162,
    weight_kg: 58,
    play_style: "Maestra",
    player_description: "Tem bom passe, levanta a cabeca e acha o companheiro livre.",
    shooting: 1,
    dribbling: 1,
    passing: 5,
    strength: 0,
    speed: 1,
    defense: 2,
    last_lat: -8.1122,
    last_lng: -35.0156,
    last_location_label: "Jaboatao dos Guararapes - PE",
    last_location_source: "manual"
  },
  {
    email: "henrique.player@pelatec.demo",
    name: "Henrique Alves",
    username: "rick_veloz",
    nickname: "Rick",
    age: 23,
    position: "striker",
    height_cm: 174,
    weight_kg: 72,
    play_style: "Ponta veloz",
    player_description: "Busca profundidade e incomoda muito quando tem espaco para acelerar.",
    shooting: 2,
    dribbling: 2,
    passing: 1,
    strength: 0,
    speed: 4,
    defense: 1,
    last_lat: -7.9901,
    last_lng: -34.8412,
    last_location_label: "Rio Doce, Olinda - PE",
    last_location_source: "manual"
  }
];

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

function competence(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

async function ensureUser(supabase, player) {
  const existing = await findUserByEmail(supabase, player.email);
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      email: player.email,
      password,
      email_confirm: true,
      user_metadata: { name: player.name, avatar_url: player.avatar_url ?? null }
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: player.email,
    password,
    email_confirm: true,
    user_metadata: { name: player.name, avatar_url: player.avatar_url ?? null }
  });

  if (error) throw error;
  return data.user;
}

async function findUserByEmail(supabase, email) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
  return null;
}

async function insertAndReturn(supabase, table, rows) {
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) throw error;
  return data;
}

async function main() {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL nao encontrada em .env.local.");
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao encontrada em .env.local. Use a service role key apenas localmente para rodar seeds.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const usersByEmail = new Map();
  for (const player of demoPlayers) {
    const user = await ensureUser(supabase, player);
    usersByEmail.set(player.email, user);
  }

  const profileRows = demoPlayers.map((player) => {
    const user = usersByEmail.get(player.email);
    return {
      id: user.id,
      email: player.email,
      name: player.name,
      username: player.username,
      nickname: player.nickname,
      phone: player.phone ?? null,
      avatar_url: player.avatar_url ?? null,
      age: player.age,
      position: player.position,
      height_cm: player.height_cm,
      weight_kg: player.weight_kg,
      play_style: player.play_style,
      player_description: player.player_description,
      shooting: player.shooting,
      dribbling: player.dribbling,
      passing: player.passing,
      strength: player.strength,
      speed: player.speed,
      defense: player.defense,
      last_lat: player.last_lat,
      last_lng: player.last_lng,
      last_location_label: player.last_location_label,
      last_location_source: player.last_location_source,
      last_location_at: new Date().toISOString()
    };
  });

  const { error: profilesError } = await supabase.from("profiles").upsert(profileRows, { onConflict: "id" });
  if (profilesError) throw profilesError;

  const demoSlugs = ["pelada-rarotec-demo", "domingo-da-aurora-demo"];
  const { error: cleanupError } = await supabase.from("peladas").delete().in("public_slug", demoSlugs);
  if (cleanupError) throw cleanupError;

  const owner = usersByEmail.get("ana.owner@pelatec.demo").id;
  const admin = usersByEmail.get("bruno.admin@pelatec.demo").id;
  const carlos = usersByEmail.get("carlos.player@pelatec.demo").id;
  const diego = usersByEmail.get("diego.player@pelatec.demo").id;
  const elaine = usersByEmail.get("elaine.player@pelatec.demo").id;
  const fabio = usersByEmail.get("fabio.player@pelatec.demo").id;
  const gabi = usersByEmail.get("gabi.player@pelatec.demo").id;
  const henrique = usersByEmail.get("henrique.player@pelatec.demo").id;

  const [rarotec, aurora] = await insertAndReturn(supabase, "peladas", [
    {
      name: "Pelada Rarotec Demo",
      description: "Pelada de teste com agenda, presenca, sorteio e financeiro preenchidos.",
      city: "Paulista",
      neighborhood: "Maranguape I",
      venue: "Cia do Futebol",
      venue_address: "R. Campo de Pouso, 193 - Maranguape I, Paulista - PE, 53441-625",
      venue_place_id: "demo-cia-do-futebol",
      venue_lat: -7.95247,
      venue_lng: -34.87155,
      preferred_weekdays: "thursday",
      default_time: "19:30",
      monthly_fee: 80,
      daily_fee: 20,
      status: "active",
      created_by: owner,
      is_public: true,
      public_slug: "pelada-rarotec-demo",
      crest_url: "/default-pelada-crest.svg",
      banner_url: "/default-pelada-banner.svg"
    },
    {
      name: "Domingo da Aurora Demo",
      description: "Grupo aberto para testar exploracao de peladas publicas e jogadores por proximidade.",
      city: "Recife",
      neighborhood: "Boa Vista",
      venue: "Campo da Aurora",
      venue_address: "Rua da Aurora, Boa Vista, Recife - PE",
      venue_place_id: "demo-campo-da-aurora",
      venue_lat: -8.05941,
      venue_lng: -34.87877,
      preferred_weekdays: "sunday",
      default_time: "07:00",
      monthly_fee: 60,
      daily_fee: 15,
      status: "active",
      created_by: gabi,
      is_public: true,
      public_slug: "domingo-da-aurora-demo",
      crest_url: "/default-pelada-crest.svg",
      banner_url: "/default-pelada-banner.svg"
    }
  ]);

  await insertAndReturn(supabase, "pelada_members", [
    { pelada_id: rarotec.id, user_id: owner, role: "owner", member_type: "monthly" },
    { pelada_id: rarotec.id, user_id: admin, role: "admin", member_type: "monthly" },
    { pelada_id: rarotec.id, user_id: carlos, role: "player", member_type: "monthly" },
    { pelada_id: rarotec.id, user_id: diego, role: "player", member_type: "daily" },
    { pelada_id: rarotec.id, user_id: elaine, role: "player", member_type: "monthly" },
    { pelada_id: rarotec.id, user_id: fabio, role: "player", member_type: "daily" },
    { pelada_id: aurora.id, user_id: gabi, role: "owner", member_type: "monthly" },
    { pelada_id: aurora.id, user_id: henrique, role: "admin", member_type: "monthly" },
    { pelada_id: aurora.id, user_id: elaine, role: "player", member_type: "daily" },
    { pelada_id: aurora.id, user_id: fabio, role: "player", member_type: "monthly" },
    { pelada_id: aurora.id, user_id: carlos, role: "player", member_type: "daily" }
  ]);

  const [lastRound, nextRound, extraRound] = await insertAndReturn(supabase, "rounds", [
    {
      pelada_id: rarotec.id,
      title: "Rodada encerrada demo",
      round_date: addDays(-7),
      starts_at: "19:30",
      venue: "Cia do Futebol",
      player_limit: 12,
      notes: "Rodada teste encerrada com dois times sorteados.",
      status: "finished",
      created_by: owner
    },
    {
      pelada_id: rarotec.id,
      title: "Quinta da Rarotec",
      round_date: addDays(3),
      starts_at: "19:30",
      venue: "Cia do Futebol",
      player_limit: 14,
      notes: "Levar camisa clara e escura.",
      status: "scheduled",
      created_by: admin
    },
    {
      pelada_id: rarotec.id,
      title: "Rodada extra de sabado",
      round_date: addDays(10),
      starts_at: "17:00",
      venue: "Cia do Futebol",
      player_limit: 10,
      notes: "Confirmar ate sexta.",
      status: "scheduled",
      created_by: owner
    }
  ]);

  const [auroraRound] = await insertAndReturn(supabase, "rounds", [
    {
      pelada_id: aurora.id,
      title: "Domingo cedo",
      round_date: addDays(5),
      starts_at: "07:00",
      venue: "Campo da Aurora",
      player_limit: 12,
      notes: "Cafe depois do jogo.",
      status: "scheduled",
      created_by: gabi
    }
  ]);

  await insertAndReturn(supabase, "round_presence", [
    { round_id: nextRound.id, user_id: owner, status: "confirmed", marked_by: owner },
    { round_id: nextRound.id, user_id: admin, status: "confirmed", marked_by: admin },
    { round_id: nextRound.id, user_id: carlos, status: "confirmed", marked_by: carlos },
    { round_id: nextRound.id, user_id: diego, status: "pending", marked_by: null },
    { round_id: nextRound.id, user_id: elaine, status: "declined", marked_by: elaine },
    { round_id: nextRound.id, user_id: fabio, status: "confirmed", marked_by: fabio },
    { round_id: lastRound.id, user_id: owner, status: "confirmed", marked_by: owner },
    { round_id: lastRound.id, user_id: admin, status: "confirmed", marked_by: admin },
    { round_id: lastRound.id, user_id: carlos, status: "confirmed", marked_by: carlos },
    { round_id: lastRound.id, user_id: diego, status: "confirmed", marked_by: diego },
    { round_id: lastRound.id, user_id: elaine, status: "confirmed", marked_by: elaine },
    { round_id: lastRound.id, user_id: fabio, status: "confirmed", marked_by: fabio },
    { round_id: auroraRound.id, user_id: gabi, status: "confirmed", marked_by: gabi },
    { round_id: auroraRound.id, user_id: henrique, status: "confirmed", marked_by: henrique },
    { round_id: auroraRound.id, user_id: elaine, status: "pending", marked_by: null },
    { round_id: auroraRound.id, user_id: fabio, status: "confirmed", marked_by: fabio },
    { round_id: auroraRound.id, user_id: carlos, status: "declined", marked_by: carlos }
  ]);

  const [teamA, teamB] = await insertAndReturn(supabase, "round_teams", [
    { round_id: lastRound.id, name: "Time Verde", sort_order: 1 },
    { round_id: lastRound.id, name: "Time Branco", sort_order: 2 }
  ]);

  await insertAndReturn(supabase, "round_team_players", [
    { team_id: teamA.id, user_id: owner },
    { team_id: teamA.id, user_id: carlos },
    { team_id: teamA.id, user_id: diego },
    { team_id: teamB.id, user_id: admin },
    { team_id: teamB.id, user_id: elaine },
    { team_id: teamB.id, user_id: fabio }
  ]);

  const [roundMatch] = await insertAndReturn(supabase, "round_matches", [
    { round_id: lastRound.id, team_a_id: teamA.id, team_b_id: teamB.id, team_a_score: 4, team_b_score: 3, notes: "Jogo equilibrado ate o fim." }
  ]);

  await insertAndReturn(supabase, "round_match_player_stats", [
    { match_id: roundMatch.id, user_id: carlos, team_id: teamA.id, goals_for: 2, own_goals: 0 },
    { match_id: roundMatch.id, user_id: diego, team_id: teamA.id, goals_for: 1, own_goals: 0 },
    { match_id: roundMatch.id, user_id: owner, team_id: teamA.id, goals_for: 1, own_goals: 0 },
    { match_id: roundMatch.id, user_id: elaine, team_id: teamB.id, goals_for: 2, own_goals: 0 },
    { match_id: roundMatch.id, user_id: fabio, team_id: teamB.id, goals_for: 1, own_goals: 0 }
  ]);

  const currentCompetence = competence();
  const dueDate = addDays(6);
  const [chargeAna, chargeBruno, chargeCarlos, chargeElaine] = await insertAndReturn(supabase, "player_charges", [
    { pelada_id: rarotec.id, user_id: owner, description: "Mensalidade demo", competence: currentCompetence, due_date: dueDate, amount: 80, status: "paid", created_by: owner, pix_code: "pix-demo-rarotec@pelatec" },
    { pelada_id: rarotec.id, user_id: admin, description: "Mensalidade demo", competence: currentCompetence, due_date: dueDate, amount: 80, status: "open", created_by: owner, pix_code: "pix-demo-rarotec@pelatec" },
    { pelada_id: rarotec.id, user_id: carlos, description: "Mensalidade demo", competence: currentCompetence, due_date: dueDate, amount: 80, status: "paid", created_by: owner, pix_code: "pix-demo-rarotec@pelatec" },
    { pelada_id: rarotec.id, user_id: elaine, description: "Mensalidade demo", competence: currentCompetence, due_date: dueDate, amount: 80, status: "open", created_by: owner, pix_code: "pix-demo-rarotec@pelatec" }
  ]);

  await insertAndReturn(supabase, "player_payments", [
    { charge_id: chargeAna.id, pelada_id: rarotec.id, user_id: owner, amount: 80, paid_at: addDays(-2), notes: "Pagamento aprovado demo", created_by: owner, status: "approved", reviewed_by: admin, reviewed_at: new Date().toISOString() },
    { charge_id: chargeCarlos.id, pelada_id: rarotec.id, user_id: carlos, amount: 80, paid_at: addDays(-1), notes: "Aguardando aprovacao demo", created_by: carlos, status: "pending" },
    { charge_id: chargeBruno.id, pelada_id: rarotec.id, user_id: admin, amount: 80, paid_at: addDays(-3), notes: "Pagamento rejeitado demo", created_by: admin, status: "rejected", reviewed_by: owner, reviewed_at: new Date().toISOString(), rejection_reason: "Comprovante ilegivel" }
  ]);

  await insertAndReturn(supabase, "financial_entries", [
    { pelada_id: rarotec.id, type: "expense", description: "Aluguel do campo", amount: 220, entry_date: addDays(-1), notes: "Despesa demo", created_by: owner },
    { pelada_id: rarotec.id, type: "expense", description: "Bolas novas", amount: 95, entry_date: addDays(-12), notes: "Compra de material", created_by: admin },
    { pelada_id: rarotec.id, type: "revenue", description: "Patrocinio da resenha", amount: 120, entry_date: addDays(-5), notes: "Receita avulsa demo", created_by: owner },
    { pelada_id: aurora.id, type: "expense", description: "Reserva do campo", amount: 150, entry_date: addDays(-2), notes: "Despesa demo", created_by: gabi }
  ]);

  console.log("Seed demo criado com sucesso.");
  console.log(`Senha dos usuarios demo: ${password}`);
  console.log("Logins principais:");
  console.log("- ana.owner@pelatec.demo");
  console.log("- bruno.admin@pelatec.demo");
  console.log("- carlos.player@pelatec.demo");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
