import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Add your Supabase Project URL and publishable (anon) key below.
// Never put a secret/service_role key in browser code or GitHub.
const SUPABASE_URL = "https://vxifxiuitprdafvgpojh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WbeQeyK02QCDwayhi2NMjw_T-gOIpxG";

const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const form = document.querySelector("#login-form");
const message = document.querySelector("#login-message");
const loginButton = document.querySelector("#login-button");

document.querySelector("#year").textContent = new Date().getFullYear();

const configured = SUPABASE_URL.startsWith("https://")
  && !SUPABASE_URL.includes("PASTE_")
  && !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");

let supabase = null;
if (configured) {
  supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
} else {
  message.textContent = "Setup needed: add your Supabase Project URL and publishable key in app.js.";
}

document.querySelector("#toggle-password").addEventListener("click", () => {
  const input = document.querySelector("#password");
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  document.querySelector("#toggle-password").textContent = show ? "Hide" : "Show";
});

function showLogin(text = "") {
  dashboardView.classList.add("hidden");
  loginView.classList.remove("hidden");
  message.textContent = text;
}

function showDashboard(profile, email) {
  loginView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  const name = profile.full_name || email || "User";
  document.querySelector("#user-name").textContent = name;
  document.querySelector("#user-role").textContent = profile.role;
  document.querySelector("#avatar").textContent = name.trim().charAt(0).toUpperCase();
  document.querySelector("#welcome-title").textContent =
    profile.role === "admin" ? "Admin dashboard" :
    profile.role === "teacher" ? "Teacher dashboard" : "Student dashboard";
}

async function loadProfile(session) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, approval_status")
    .eq("id", session.user.id)
    .single();

  if (error || !data) {
    await supabase.auth.signOut();
    showLogin("Your profile could not be loaded. Please contact the DhyanshEdu administrator.");
    return;
  }
  if (data.approval_status !== "approved") {
    await supabase.auth.signOut();
    showLogin("Your account is awaiting approval. Please contact DhyanshEdu.");
    return;
  }
  showDashboard(data, session.user.email);
  loadStats(data.role);
}

async function loadStats(role) {
  const msg = document.querySelector("#dashboard-message");
  const tables = [
    ["teacher-count", "profiles", "teacher"],
    ["student-count", "profiles", "student"],
    ["exam-count", "exams", null],
    ["attempt-count", "exam_attempts", null]
  ];
  for (const [elementId, table, roleFilter] of tables) {
    let query = supabase.from(table).select("*", { count: "exact", head: true });
    if (roleFilter) query = query.eq("role", roleFilter);
    const { count, error } = await query;
    document.getElementById(elementId).textContent = error ? "—" : String(count ?? 0);
    if (error) msg.textContent = "Some dashboard counts are unavailable until the database permissions are configured.";
  }
  // Non-admins should not use the admin overview. This starter keeps the same
  // shell while the dedicated teacher and student views are built in later phases.
  if (role !== "admin") {
    msg.textContent = `Signed in as ${role}. Dedicated ${role} workspace will be added in the next build phase.`;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return;
  message.textContent = "";
  loginButton.disabled = true;
  loginButton.textContent = "Signing in…";
  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  loginButton.disabled = false;
  loginButton.innerHTML = 'Sign in <span>→</span>';
  if (error) {
    message.textContent = error.message;
    return;
  }
  await loadProfile(data.session);
});

document.querySelector("#signout-button").addEventListener("click", async () => {
  if (supabase) await supabase.auth.signOut();
  showLogin("You have signed out.");
});

if (supabase) {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) loadProfile(data.session);
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) showLogin();
  });
}
