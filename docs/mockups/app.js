// ---- Seed data ----
const SEED_USERS = [
  { id: "u1", name: "Marcus Chen", dob: "1987-03-14", sex: "male" },
  { id: "u2", name: "Elena Rivera", dob: "1992-11-02", sex: "female" },
  { id: "u3", name: "Jordan Pierce", dob: "1975-06-28", sex: "male" },
];

const SEED_HISTORY = {
  "u1:knee-right": {
    visits: [
      {
        date: "2026-02-18",
        title: "Orthopedic consultation",
        body: "Right knee pain localized to patellar tendon. Onset after increased running volume. No instability, no swelling.",
        doctor: "Dr. Amelia Park",
        diagnosis: "Patellar tendinopathy",
      },
      {
        date: "2025-12-03",
        title: "Primary care visit",
        body: "Reported right knee discomfort during squats. Advised rest and referred to ortho if persistent.",
        doctor: "Dr. R. Okafor",
        diagnosis: "Knee pain, rule out tendinitis",
      },
    ],
    notes: [
      {
        date: "2026-03-05",
        title: "Self-note",
        body: "Pain is a 3/10 in the morning, subsides after warm-up. Ice after runs seems to help.",
      },
    ],
    prescriptions: [
      {
        date: "2026-02-18",
        title: "Naproxen 500mg",
        body: "Take 1 tablet twice daily with food for 10 days for inflammation.",
        prescriber: "Dr. Amelia Park",
        duration: "10 days",
      },
    ],
    imaging: [
      {
        date: "2026-02-20",
        title: "Right knee MRI",
        body: "Mild thickening of patellar tendon at inferior pole of patella. No meniscal tear. No joint effusion.",
        facility: "Mercy Imaging Center",
      },
    ],
  },
  "u1:lower-back": {
    visits: [
      {
        date: "2024-08-11",
        title: "Chiropractor visit",
        body: "Lower back stiffness after long flight. Adjustment performed, no red flags.",
        doctor: "Dr. Hale",
        diagnosis: "Mechanical low back pain",
      },
    ],
    notes: [],
    prescriptions: [],
    imaging: [],
  },
  "u2:eye-right": {
    visits: [
      {
        date: "2026-01-22",
        title: "Neurology follow-up",
        body: "Migraines reduced to 2/month on current regimen. Aura localizes behind right eye. Tolerating medication well.",
        doctor: "Dr. S. Nakamura",
        diagnosis: "Migraine with aura, improving",
      },
    ],
    notes: [
      {
        date: "2026-03-30",
        title: "Trigger log",
        body: "Noticed migraines cluster around poor sleep + red wine. Cutting wine for a month as a test.",
      },
    ],
    prescriptions: [
      {
        date: "2026-01-22",
        title: "Sumatriptan 50mg",
        body: "Take at onset of migraine. May repeat once after 2 hours if needed. Max 200mg/24h.",
        prescriber: "Dr. S. Nakamura",
        duration: "As needed",
      },
    ],
    imaging: [
      {
        date: "2025-09-14",
        title: "Brain MRI w/o contrast",
        body: "No acute intracranial abnormality. Findings consistent with chronic migraine.",
        facility: "University Neuro Imaging",
      },
    ],
  },
  "u2:chest": {
    visits: [],
    notes: [
      {
        date: "2026-04-02",
        title: "Self-note",
        body: "Occasional tightness during cold morning runs. Not pain, more like restriction. Monitoring.",
      },
    ],
    prescriptions: [],
    imaging: [],
  },
  "u3:shoulder-left": {
    visits: [
      {
        date: "2025-11-08",
        title: "Sports medicine",
        body: "Left shoulder pain after tennis. Positive impingement test. Recommended PT.",
        doctor: "Dr. J. Whittaker",
        diagnosis: "Subacromial impingement",
      },
    ],
    notes: [],
    prescriptions: [
      {
        date: "2025-11-08",
        title: "Ibuprofen 600mg",
        body: "Take as needed with food, max 3 times daily, for pain flares. Up to 2 weeks.",
        prescriber: "Dr. J. Whittaker",
        duration: "PRN, 2 weeks",
      },
    ],
    imaging: [],
  },
  "u3:hand-right": {
    visits: [],
    notes: [
      {
        date: "2026-04-10",
        title: "Self-note",
        body: "Mild stiffness in right thumb base on cold mornings. First noticed this winter.",
      },
    ],
    prescriptions: [],
    imaging: [],
  },

  "u1:shoulder-right": {
    visits: [
      {
        date: "2025-06-14",
        title: "Bench press strain",
        body: "Right anterior deltoid strained mid-set. No tear on exam. Rest recommended for 2 weeks.",
        doctor: "Dr. R. Okafor",
        diagnosis: "Anterior deltoid strain, grade I",
      },
    ],
    notes: [],
    prescriptions: [],
    imaging: [],
  },
  "u1:ribs": {
    visits: [
      {
        date: "2024-10-05",
        title: "Urgent care",
        body: "Took a ball to the left ribs playing rec soccer. Tender but breathing normal. X-ray negative.",
        doctor: "Dr. M. Patel",
        diagnosis: "Rib contusion, no fracture",
      },
    ],
    notes: [],
    prescriptions: [],
    imaging: [
      {
        date: "2024-10-05",
        title: "Left rib X-ray",
        body: "No displaced fracture. Soft tissue swelling consistent with contusion.",
        facility: "Valley Urgent Care",
      },
    ],
  },
  "u1:stomach": {
    visits: [],
    notes: [
      {
        date: "2026-02-02",
        title: "Self-note",
        body: "Occasional reflux after late heavy meals. Cutting caffeine after 3pm seems to help.",
      },
    ],
    prescriptions: [],
    imaging: [],
  },

  "u2:wrist-left": {
    visits: [],
    notes: [
      {
        date: "2026-04-08",
        title: "Self-note",
        body: "Dull ache in left wrist after long writing sessions. Stretching and wrist brace at night.",
      },
    ],
    prescriptions: [],
    imaging: [],
  },
  "u2:ankle-right": {
    visits: [
      {
        date: "2025-07-20",
        title: "Urgent care",
        body: "Rolled right ankle on trail. Lateral swelling, able to bear weight. Grade I sprain.",
        doctor: "Dr. A. Thompson",
        diagnosis: "Lateral ankle sprain, grade I",
      },
    ],
    notes: [],
    prescriptions: [
      {
        date: "2025-07-20",
        title: "Ibuprofen 400mg",
        body: "Take 1 tablet every 6 hours as needed with food. RICE protocol for 5 days.",
        prescriber: "Dr. A. Thompson",
        duration: "5 days PRN",
      },
    ],
    imaging: [],
  },
  "u2:ear-right": {
    visits: [
      {
        date: "2023-11-18",
        title: "Primary care",
        body: "Right ear infection, likely bacterial. Responded well to amoxicillin.",
        doctor: "Dr. R. Okafor",
        diagnosis: "Acute otitis media",
      },
    ],
    notes: [],
    prescriptions: [],
    imaging: [],
  },

  "u3:knee-left": {
    visits: [
      {
        date: "2026-03-02",
        title: "Sports medicine",
        body: "Anterior left knee pain with running. Suspect patellofemoral syndrome. Referred to PT.",
        doctor: "Dr. J. Whittaker",
        diagnosis: "Patellofemoral pain syndrome",
      },
    ],
    notes: [
      {
        date: "2026-03-18",
        title: "PT progress",
        body: "Quad and glute activation exercises 3x/week. Pain down to 2/10 after runs.",
      },
    ],
    prescriptions: [],
    imaging: [],
  },
  "u3:upper-back": {
    visits: [],
    notes: [
      {
        date: "2026-04-11",
        title: "Self-note",
        body: "Upper trap tightness after long desk days. Foam rolling + chin tucks helping.",
      },
    ],
    prescriptions: [
      {
        date: "2025-12-01",
        title: "Cyclobenzaprine 5mg",
        body: "Take 1 tablet at bedtime as needed for severe muscle spasm. Max 3 nights in a row.",
        prescriber: "Dr. R. Okafor",
        duration: "PRN",
      },
    ],
    imaging: [],
  },
  "u3:calf-right": {
    visits: [],
    notes: [
      {
        date: "2026-01-15",
        title: "Self-note",
        body: "Right calf tightness after a hilly run. Stretching and easy days for a week.",
      },
    ],
    prescriptions: [],
    imaging: [],
  },
};

// ---- Part label map (id → human label) ----
const PART_LABELS = {
  "eye-left": "Left Eye",
  "eye-right": "Right Eye",
  "nose": "Nose",
  "mouth": "Mouth",
  "ear-left": "Left Ear",
  "ear-right": "Right Ear",
  "shoulder-left": "Left Shoulder",
  "shoulder-right": "Right Shoulder",
  "elbow-left": "Left Elbow",
  "elbow-right": "Right Elbow",
  "forearm-left": "Left Forearm",
  "forearm-right": "Right Forearm",
  "wrist-left": "Left Wrist",
  "wrist-right": "Right Wrist",
  "hand-left": "Left Hand",
  "hand-right": "Right Hand",
  "chest": "Chest",
  "ribs": "Ribs",
  "stomach": "Stomach",
  "pelvis": "Pelvis",
  "hip-left": "Left Hip",
  "hip-right": "Right Hip",
  "thigh-left": "Left Thigh",
  "thigh-right": "Right Thigh",
  "knee-left": "Left Knee",
  "knee-right": "Right Knee",
  "shin-left": "Left Shin",
  "shin-right": "Right Shin",
  "ankle-left": "Left Ankle",
  "ankle-right": "Right Ankle",
  "foot-left": "Left Foot",
  "foot-right": "Right Foot",
  "upper-back": "Upper Back",
  "lower-back": "Lower Back",
  "glute-left": "Left Glute",
  "glute-right": "Right Glute",
  "hamstring-left": "Left Hamstring",
  "hamstring-right": "Right Hamstring",
  "calf-left": "Left Calf",
  "calf-right": "Right Calf",
};

// ---- State (sessionStorage so refresh within tab persists, close resets) ----
const Store = {
  _loaded: false,
  users: [],
  history: {},

  load() {
    if (this._loaded) return;
    const u = sessionStorage.getItem("mh_users");
    const h = sessionStorage.getItem("mh_history");
    this.users = u ? JSON.parse(u) : JSON.parse(JSON.stringify(SEED_USERS));
    this.history = h ? JSON.parse(h) : JSON.parse(JSON.stringify(SEED_HISTORY));
    this._loaded = true;
  },

  save() {
    sessionStorage.setItem("mh_users", JSON.stringify(this.users));
    sessionStorage.setItem("mh_history", JSON.stringify(this.history));
  },

  addUser(user) {
    this.load();
    this.users.push(user);
    this.save();
  },

  getUser(id) {
    this.load();
    return this.users.find((u) => u.id === id);
  },

  getEntries(userId, partId) {
    this.load();
    const key = `${userId}:${partId}`;
    return (
      this.history[key] || {
        visits: [],
        notes: [],
        prescriptions: [],
        imaging: [],
      }
    );
  },

  addEntry(userId, partId, category, entry) {
    this.load();
    const key = `${userId}:${partId}`;
    if (!this.history[key]) {
      this.history[key] = { visits: [], notes: [], prescriptions: [], imaging: [] };
    }
    this.history[key][category].unshift(entry);
    this.save();
  },
};

// ---- Helpers ----
function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function calcAge(dob) {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
