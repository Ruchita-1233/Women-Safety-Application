 import { API_URL } from "./config.js";
// PWA Service Worker Registration
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then(() => console.log("Service Worker registered"))
    .catch((err) => console.error("SW registration failed:", err));
}

let authToken = localStorage.getItem("authToken") || null;
let currentUser = null;

// Utility: Fetch wrapper with auth
async function apiRequest(url, method = "GET", data = null) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  const token = localStorage.getItem("authToken");
  if (token) {
    opts.headers["Authorization"] = "Bearer " + token;
  } else {
    throw new Error("No token");
  }

  if (data) opts.body = JSON.stringify(data);

  const res = await fetch(API_URL + url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// 🌟 Signup
async function signup(event) {
  event.preventDefault();
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const res = await apiRequest("/api/signup", "POST", { name, email, password });
    localStorage.setItem("authToken", res.token);
    alert("Signup successful!");
    window.location.href = "index.html";
  } catch (err) {
    alert(err.message);
  }
}

// 🔑 Login
// 🔑 Login
async function login(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("Please enter both email and password");
    return;
  }

  try {
    const res = await fetch(API_URL + "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Login failed" }));
      throw new Error(err.error || "Login failed");
    }

    const data = await res.json();
    localStorage.setItem("authToken", data.token);
    alert("Login successful!");
    window.location.href = "index.html";
  } catch (error) {
    alert("Login failed: " + error.message);
  }
}
// 👥 Fetch Contacts
async function loadContacts() {
  try {
    const res = await apiRequest("/api/contacts");
    const list = document.getElementById("contactList");
    list.innerHTML = "";
    res.contacts.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = `${c.name} - ${c.phone || ""} ${c.email || ""}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert("Failed to load contacts");
  }
}

// ➕ Add Contact
async function addContact(event) {
  event.preventDefault();
  const name = document.getElementById("contactName").value;
  const phone = document.getElementById("contactPhone").value;
  const email = document.getElementById("contactEmail").value;

  try {
    await apiRequest("/api/contacts", "POST", { name, phone, email });
    alert("Contact added successfully!");
    loadContacts();
  } catch (err) {
    alert(err.message);
  }
}

// 🚨 SOS Alert
async function sendSOS() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  // Play alarm
  const audio = new Audio("police-siren-sound-effect-317645.mp3");
  audio.play();

  navigator.geolocation.getCurrentPosition(async (pos) => {

    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;

    const message = document.getElementById("sosMessage").value;

    try {
      await apiRequest("/api/sos", "POST", {
        latitude,
        longitude,
        message
      });

      alert("🚨 SOS sent! Your contacts have been notified via WhatsApp.");
    } catch (err) {
      alert("Failed to send SOS: " + err.message);
    }

  }, (err) => {
    alert("Unable to get location: " + err.message);
  });
}

// 🚪 Logout
function logout() {
  localStorage.removeItem("authToken");
  alert("Logged out");
  window.location.href = "login.html";
}

// Auto-run when user is on home page
document.addEventListener("DOMContentLoaded", () => {
  const contactSection = document.getElementById("contactSection");
  if (contactSection && authToken) {
    loadContacts();
  }
});

// Redirect if not logged in
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  if (document.getElementById("contactSection")) {
    loadContacts();
  }
});
