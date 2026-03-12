// Trading PrecisionCalc Logic
let currentMode = 'SP1!'; // SP1! is ES1!
let currentModeNews = 'today';
let calcHistory = [];
let currentSettingsMode = 'SP1!'; // New state variable for the settings modal inputs
let currentSettingsModeTime = 'NY'; 
let events = [];       // global
let activeTime = null; // global
let timesAll = []; // store all times for the current day
let timesVisibleCount = 3; // show only 3 initially
let timePage = 0; // current page of times
const timesPerPage = 3; // show only 3 times at a time

// Default Values for Settings
const defaultSettings = {
    riskAmount: 500,
    esFixedValue: 101.01,
    nqFixedValue: 100.172,
};

let userSettings = { ...defaultSettings };

// DOM Elements (Main UI)
const inputPoints = document.getElementById('points');
const container = document.getElementById("events-container");
const timeList = document.getElementById("time-list");
const btnSP1 = document.getElementById('btn-sp1');
const btnNQ1 = document.getElementById('btn-nq1');
const btnTM = document.getElementById('btn-tm');
const btnTD = document.getElementById('btn-td');
const btnYS = document.getElementById('btn-ys');
const btnCalculate = document.getElementById('calculate-btn');
const containerResult = document.getElementById('result-container');
const valueResult = document.getElementById('result-value');
const btnCopy = document.getElementById('copy-btn');
const textCopy = document.getElementById('copy-text');
const arrowLeft = document.getElementById('time-prev');
const arrowRight = document.getElementById('time-next');
const todoInput = document.getElementById("todo-input");
const riskAmountDisplay = document.getElementById('risk-amount-display');


// Settings Modal DOM Elements (New)
const settingsModal = document.getElementById('settings-modal');
const settingsPanel = document.getElementById('settings-panel'); // For the slide transition
const openSettingsBtn = document.getElementById('open-settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');

// Settings Inputs and Buttons
const riskAmountInput = document.getElementById('risk-amount-input');
const esNqFixedValueInput = document.getElementById('es-nq-fixed-value-input');
const btnEsSettings = document.getElementById('btn-es-settings');
const btnNqSettings = document.getElementById('btn-nq-settings');
const btnNySettings = document.getElementById('btn-ny-settings');
const btnMySettings = document.getElementById('btn-my-settings');
const resetDefaultsBtn = document.getElementById('reset-defaults-btn');



function updateRiskDisplay() {
    if (!riskAmountDisplay) return;

    riskAmountDisplay.textContent = `risk: $${userSettings.riskAmount}`;

    // Optional styling based on value
    riskAmountDisplay.className =
        "px-3 py-2 rounded-xl text-xs font-black tabular-nums transition-all duration-200 " +
        (userSettings.riskAmount > 0
            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
            : "bg-slate-100 text-slate-400 dark:bg-slate-800");
}


// Load Data and Settings
async function init() {
    try {
        const historyRes = await fetch('/api/data/trading_calc_history_v2');
        if (historyRes.ok) {
            calcHistory = await historyRes.json();
        }

        const settingsRes = await fetch('/api/data/trading_calc_settings');
        if (settingsRes.ok) {
            userSettings = await settingsRes.json();
            if (userSettings.timeZone) {
                currentSettingsModeTime = userSettings.timeZone;
            }
        }
    } catch (err) {
        console.error('Failed to load settings from Supabase', err);
    }
    
    // Update UI with loaded settings (e.g. default value text)
    updateSettingsUI();
    updateRiskDisplay();
    updateModeUI(); 
    updateModeNewsUI();
    updateSettingsModeButtonsUITime(); 
}


function updateModeUI() {
    // ... existing updateModeUI logic for main calculator ...
    const activeClass = "bg-white dark:bg-slate-800 shadow-lg text-indigo-600 dark:text-indigo-400";
    const inactiveClass = "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200";

    if (currentMode === 'SP1!') {
        btnSP1.className = `flex-1 py-4 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${activeClass}`;
        btnNQ1.className = `flex-1 py-4 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${inactiveClass}`;
    } else {
        btnNQ1.className = `flex-1 py-4 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${activeClass}`;
        btnSP1.className = `flex-1 py-4 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${inactiveClass}`;
    }
    containerResult.classList.add('hidden');
}

function updateModeNewsUI() {
    // ... existing updateModeUI logic for main calculator ...
    const activeClass = "bg-white dark:bg-slate-800 shadow-lg text-indigo-600 dark:text-indigo-400 scale-[1.02]";
    const inactiveClass = "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200";

    if (currentModeNews === 'today') {
        btnTD.className = `flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${activeClass}`;
        btnYS.className = `flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${inactiveClass}`;
        btnTM.className = `flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${inactiveClass}`;
    } else if (currentModeNews === 'yesterday') {
        btnYS.className = `flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${activeClass}`;
        btnTD.className = `flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${inactiveClass}`;
        btnTM.className = `flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${inactiveClass}`;
    } else {
        btnTM.className = `flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${activeClass}`;
        btnTD.className = `flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${inactiveClass}`;
        btnYS.className = `flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${inactiveClass}`;
    }
}

function calculate() {
    const p = parseFloat(inputPoints.value);
    if (isNaN(p) || p <= 0) {
        alert("Please enter a valid point value.");
        return;
    }

    let result;
    // Use dynamic settings for calculation
    if (currentMode === 'SP1!') {
        result = userSettings.riskAmount / (p * userSettings.esFixedValue);
    } else {
        result = userSettings.riskAmount / (p * userSettings.nqFixedValue);
    }

    // Display Result
    valueResult.textContent = result.toFixed(2);
    containerResult.classList.remove('hidden');

    // Reset copy button
    textCopy.textContent = "Copy to Clipboard";
    btnCopy.classList.remove('bg-emerald-500', 'text-white');
}

// Settings Modal Functions (With Animations)
function openSettingsModal() {
    // Sync inputs with current user settings before opening
    riskAmountInput.value = userSettings.riskAmount;
    // Sync the mode switcher input to match the currently selected mode's value
    esNqFixedValueInput.value = (currentSettingsMode === 'SP1!') ? userSettings.esFixedValue : userSettings.nqFixedValue;

    settingsModal.classList.remove('hidden'); // Make the background visible
    
    // Use a slight timeout to allow the browser to render the modal wrapper
    // before applying the 'translate-x-0' class to trigger the CSS transition
    setTimeout(() => {
        settingsPanel.classList.remove('translate-x-full');
        // Ensure the backdrop opacity also transitions in
        settingsModal.classList.remove('opacity-0');
        settingsModal.classList.add('opacity-100');
    }, 10); 
}

function closeSettingsModal() {
    settingsPanel.classList.add('translate-x-full'); // Start sliding out

    // Fade out backdrop and then hide entirely after transition completes (300ms)
    settingsModal.classList.remove('opacity-100');
    settingsModal.classList.add('opacity-0');

    setTimeout(() => {
        settingsModal.classList.add('hidden');
    }, 300); // Must match the Tailwind transition duration (duration-300)
}

function updateSettingsUI() {
    // Update the default display text based on current settings 
    // document.getElementById('default-risk-value').textContent = userSettings.riskAmount;
    // document.getElementById('default-es-value').textContent = userSettings.esFixedValue;
    // document.getElementById('default-nq-value').textContent = userSettings.nqFixedValue;
    // The calculation will use `userSettings` automatically after init() runs
}

async function saveSettingsToLocalStorage() {
    try {
        await fetch('/api/data/trading_calc_settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userSettings)
        });
    } catch (err) {
        console.error('Failed to save settings to Supabase', err);
    }
}


// Function to manage the visual active state of the ES/NQ buttons in the settings panel
function updateSettingsModeButtonsUI() {
    // These classes match the design provided by the user
    const activeClass = "bg-white dark:bg-slate-800 shadow-lg text-indigo-600 dark:text-indigo-400 scale-[1.02]";
    
    // Updated inactiveClass definition for consistency:
    const inactiveClass = "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200";

    if (currentSettingsMode === 'SP1!') {
        btnEsSettings.className = `flex-1 py-4 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${activeClass}`;
        btnNqSettings.className = `flex-1 py-4 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${inactiveClass}`;
        esNqFixedValueInput.value = userSettings.esFixedValue; // Sync input value
    } else {
        btnNqSettings.className = `flex-1 py-4 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${activeClass}`;
        btnEsSettings.className = `flex-1 py-4 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${inactiveClass}`;
        esNqFixedValueInput.value = userSettings.nqFixedValue; // Sync input value
    }
}

// Update the UI function to handle the active colors
function updateSettingsModeButtonsUITime() {
    const activeClass = "bg-white dark:bg-slate-800 shadow-lg text-indigo-600 dark:text-indigo-400 scale-[1.02]";
    const inactiveClass = "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200";
    const tzDisplay = document.getElementById('current-tz-display');

    if (currentSettingsModeTime === 'NY') {
        btnNySettings.className = `flex-1 py-4 px-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${activeClass}`;
        btnMySettings.className = `flex-1 py-4 px-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${inactiveClass}`;
        if(tzDisplay) tzDisplay.textContent = "NY (UTC-13)";
    } else {
        btnMySettings.className = `flex-1 py-4 px-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${activeClass}`;
        btnNySettings.className = `flex-1 py-4 px-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${inactiveClass}`;
        if(tzDisplay) tzDisplay.textContent = "MY (UTC-12)";
    }
}

function handleResetDefaults() {
    userSettings = { ...defaultSettings };
    saveSettingsToLocalStorage();
    updateSettingsUI();
    updateRiskDisplay(); 
    closeSettingsModal();
    showToast("Settings reset to default");
}


function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;

    // show
    toast.classList.remove('opacity-0', 'translate-y-10');
    toast.classList.add('opacity-100', 'translate-y-0');

    // auto hide after 2s
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-10');
    }, 2000);
}



// Event Listeners (Main UI)
btnSP1.addEventListener('click', () => {
    currentMode = 'SP1!';
    updateModeUI();
    inputPoints.focus();
});

btnNQ1.addEventListener('click', () => {
    currentMode = 'NQ1!';
    updateModeUI();
    inputPoints.focus();
});

btnTD.addEventListener('click', () => {
    currentModeNews = 'today';
    updateModeNewsUI();
    const filteredEvents = getFilteredEvents();
    const times = [...new Set(filteredEvents.map(getLocalTimeOnly))].sort();
    activeTime = times[0] || null;
    timePage = 0; // reset pagination
    renderTimes();
    renderEvents();
});

btnYS.addEventListener('click', () => {
    currentModeNews = 'yesterday';
    updateModeNewsUI();
    const filteredEvents = getFilteredEvents();
    const times = [...new Set(filteredEvents.map(getLocalTimeOnly))].sort();
    activeTime = times[0] || null;
    timePage = 0;
    renderTimes();
    renderEvents();
});

btnTM.addEventListener('click', () => {
    currentModeNews = 'tomorrow';
    updateModeNewsUI();
    const filteredEvents = getFilteredEvents();
    const times = [...new Set(filteredEvents.map(getLocalTimeOnly))].sort();
    activeTime = times[0] || null;
    timePage = 0;
    renderTimes();
    renderEvents();
});

btnCalculate.addEventListener('click', calculate);

inputPoints.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') calculate();
});

btnCopy.addEventListener('click', () => {
    const val = valueResult.textContent;
    navigator.clipboard.writeText(val).then(() => {
        textCopy.textContent = "Copied!";
        btnCopy.classList.add('bg-emerald-500', 'text-white');
        setTimeout(() => {
            textCopy.textContent = "Copy to Clipboard";
            btnCopy.classList.remove('bg-emerald-500', 'text-white');
        }, 2000);
    });
});

// Event Listeners (Settings Modal)
openSettingsBtn.addEventListener('click', openSettingsModal);
closeSettingsBtn.addEventListener('click', closeSettingsModal);
resetDefaultsBtn.addEventListener('click', handleResetDefaults);

// Listeners for the ES/NQ switch within the settings panel
btnEsSettings.addEventListener('click', () => {
    currentSettingsMode = 'SP1!';
    updateSettingsModeButtonsUI();
});
btnNqSettings.addEventListener('click', () => {
    currentSettingsMode = 'NQ1!';
    updateSettingsModeButtonsUI();
});


function convertTimeBetweenZones(timeStr, fromZone, toZone) {
    // timeStr = "HH:MM"
    let [hour, minute] = timeStr.split(":").map(Number);

    // NY offset = -13 for your current code, MY offset = -12
    const offsets = { NY: -13, MY: -12 };

    let diff = offsets[toZone] - offsets[fromZone]; // e.g., NY->MY = -12 - (-13) = 1
    hour += diff;

    if (hour < 0) hour += 24;
    if (hour >= 24) hour -= 24;

    return `${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`;
}

// Listeners for the MY/NY switch within the settings panel

btnNySettings.addEventListener('click', () => {
    if (currentSettingsModeTime !== 'NY') {
        currentSettingsModeTime = 'NY';
        userSettings.timeZone = 'NY';
        saveSettingsToLocalStorage();

        if (activeTime) {
            activeTime = convertTimeBetweenZones(activeTime, 'MY', 'NY');
        }

        updateSettingsModeButtonsUITime();
        renderTimes();
        renderEvents();
    }
});

btnMySettings.addEventListener('click', () => {
    if (currentSettingsModeTime !== 'MY') {
        currentSettingsModeTime = 'MY';
        userSettings.timeZone = 'MY';
        saveSettingsToLocalStorage();

        if (activeTime) {
            activeTime = convertTimeBetweenZones(activeTime, 'NY', 'MY');
        }

        updateSettingsModeButtonsUITime();
        renderTimes();
        renderEvents();
    }
});




// Close modal if user clicks outside of the content area
window.onclick = function(event) {
  if (event.target == settingsModal) {
    closeSettingsModal();
  }
}

// news data fetch and display



// Convert event date+time to NY 24h format
function convertToLocalTime24(dateStr, timeStr) {
    const [month, day, year] = dateStr.split("-").map(Number);
    let [hour, minute] = timeStr.replace(/(am|pm)/i, "").split(":").map(Number);
    const isPM = /pm/i.test(timeStr);
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;

    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

    let offsetHours = 0;

    if (currentSettingsModeTime === 'NY') offsetHours = -13; 
    if (currentSettingsModeTime === 'MY') offsetHours = -12; 

    const adjustedTime = new Date(utcDate.getTime() + offsetHours * 60 * 60000);

    const adjHour = String(adjustedTime.getHours()).padStart(2, "0");
    const adjMinute = String(adjustedTime.getMinutes()).padStart(2, "0");
    const adjMonth = String(adjustedTime.getMonth() + 1).padStart(2, "0");
    const adjDay = String(adjustedTime.getDate()).padStart(2, "0");
    const adjYear = adjustedTime.getFullYear();

    return `${adjMonth}-${adjDay}-${adjYear} ${adjHour}:${adjMinute}`;
}

// Only get the time part
function getLocalTimeOnly(ev) {
    return convertToLocalTime24(ev.date, ev.time).split(" ")[1];
}


// Filter events based on selected news mode
function getFilteredEvents() {
    if (!events.length) return [];

    const now = new Date();
    const nyOffset = -5 * 60;
    const nyDate = new Date(now.getTime() + (now.getTimezoneOffset() - nyOffset) * 60000);

    let baseDate = new Date(nyDate);
    if (currentModeNews === 'yesterday') baseDate.setDate(baseDate.getDate() - 1);
    if (currentModeNews === 'tomorrow') baseDate.setDate(baseDate.getDate() + 1);

    const m = String(baseDate.getMonth() + 1).padStart(2, "0");
    const d = String(baseDate.getDate()).padStart(2, "0");
    const y = baseDate.getFullYear();
    const targetDate = `${m}-${d}-${y}`;

    return events.filter(ev => ev.date === targetDate);
}

function formatTimeLabel(time24) {
    if (currentSettingsModeTime !== 'MY') {
        return time24; // NY → 24h
    }

    let [hour, minute] = time24.split(":").map(Number);

    hour = hour % 12;
    if (hour === 0) hour = 12;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// --- RENDERING ---
function renderTimes() {
    const filteredEvents = getFilteredEvents();
    
    // --- NO EVENTS CASE ---
    if (!filteredEvents.length) {
        timeList.innerHTML = `
        `;
        activeTime = null;
        arrowLeft.innerHTML = `
        `;
        arrowRight.innerHTML = `
        `;
        // arrowLeft.style.visibility = "hidden";
        // arrowRight.style.visibility = "hidden";
        
        // Disable NY/MY buttons
        btnNySettings.disabled = true;
        btnMySettings.disabled = true;

        // Optional: visually show disabled state
        btnNySettings.classList.add('opacity-50');
        btnMySettings.classList.add('opacity-50');
        
        return;
    }

    // --- ENABLE BUTTONS IF EVENTS EXIST ---
    btnNySettings.disabled = false;
    btnMySettings.disabled = false;
    arrowLeft.innerHTML = `‹
        `;
    arrowRight.innerHTML = `›
    `;
    btnNySettings.classList.remove('opacity-50');
    btnMySettings.classList.remove('opacity-50');

    // --- NORMAL TIMES RENDERING ---
    timesAll = [...new Set(filteredEvents.map(getLocalTimeOnly))].sort();
    activeTime = activeTime || timesAll[0];

    const start = timePage;
    const end = Math.min(start + timesPerPage, timesAll.length);
    const timesToShow = timesAll.slice(start, end);

    timeList.innerHTML = timesToShow.map(time => {
        const isActive = time === activeTime;
        return `
            <span data-time="${time}" class="inline-flex flex-auto min-w-[80px] max-w-[120px] justify-center py-2 px-10 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all duration-200
            ${isActive ? "bg-white dark:bg-slate-800 shadow-lg text-indigo-600 dark:text-indigo-400 scale-[1.02]" 
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}">
                ${formatTimeLabel(time)}
            </span>
        `;
    }).join("");

    arrowLeft.style.visibility = (start > 0) ? "visible" : "hidden";
    arrowRight.style.visibility = (end < timesAll.length) ? "visible" : "hidden";

    arrowLeft.onclick = () => {
        if (timePage > 0) {
            timePage--;
            renderTimes();
        }
    };
    arrowRight.onclick = () => {
        if (end < timesAll.length) {
            timePage++;
            renderTimes();
        }
    };
}

function renderEvents() {
    if (!activeTime) {
        container.innerHTML = "<p>No events to display.</p>";
        return;
    }
    const filteredEvents = getFilteredEvents();
    container.innerHTML = filteredEvents
        .filter(ev => getLocalTimeOnly(ev) === activeTime)
.map(ev => {
            let impactText;

            // Logic for dot background and text color
            if (ev.impact === "High") {
                impactText = "text-red-500";
            } else if (ev.impact === "Medium") {
                impactText = "text-yellow-500";
            } else {
                impactText = "text-slate-500";
            }

            return `
                <div class="flex items-center gap-3 py-3 text-xs text-slate-400 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-white/5 last:border-0">
                    <span class="flex-1">${ev.title}</span>
                    <span class="text-[9px] font-black uppercase tracking-wider ${impactText}">
                        ${ev.impact}
                    </span>
                </div>                
            `;
        }).join("");
}


// --- LOAD EVENTS ---
async function loadEvents() {
    try {
        const res = await fetch("/calendar");
        events = await res.json();
        if (!events || events.length === 0) {
            container.innerHTML = "<p>No USD events available.</p>";
            return;
        }

        renderTimes();
        renderEvents();

        // CLICK HANDLER
        timeList.onclick = e => {
            const el = e.target.closest("[data-time]");
            if (!el) return;
            activeTime = el.dataset.time;
            renderTimes();
            renderEvents();
        };
    } catch (err) {
        container.innerHTML = "<p>Failed to load events.</p>";
        console.error(err);
    }
}

// note session storage for todo list

// Persistent note state for To-Do
let noteState = {
    text: ""
};

// Load note from localStorage if available
async function loadNoteLocal() {
    try {
        const res = await fetch('/api/data/todo_note');
        if (res.ok) {
            noteState = await res.json();
            todoInput.value = noteState.text || "";
        }
    } catch (err) {
        console.warn("Failed to parse saved note, resetting...", err);
        noteState = { text: "" };
        todoInput.value = "";
    }
}
// Save note to localStorage
async function saveNoteLocal(text) {
    noteState.text = text;
    try {
        await fetch('/api/data/todo_note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(noteState)
        });
    } catch (err) {
        console.error('Failed to save note to Supabase', err);
    }
}

let todoSaveTimer = null;

todoInput.addEventListener("input", () => {
    const note = todoInput.value;
    noteState.text = note;
    adjustTextareaHeight();
    
    clearTimeout(todoSaveTimer);
    todoSaveTimer = setTimeout(() => {
        saveNoteLocal(note);
    }, 1000);
});

function adjustTextareaHeight() {
    todoInput.style.height = "auto"; // reset first
    todoInput.style.height = todoInput.scrollHeight + "px"; // exact height of content
}
 




function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('opacity-0');
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 500);
    }
}

// Global Launch
async function launchApp() {
    try {
        // First, load settings to ensure correct timezone
        await init();
        
        // Then load other data in parallel
        await Promise.all([
            loadNoteLocal(),
            loadEvents(),
            initCalendar()
        ]);
    } catch (err) {
        console.error("Error during app launch:", err);
    } finally {
        // Always hide loading, even if some parts fail
        hideLoading();
        if (inputPoints) {
            inputPoints.focus();
        }
    }
}

// Launch
// launchApp is called at the end of the script
// adjustTextareaHeight is called at the end of the script




// Calendar State
let currentCalMonth = new Date().getMonth();
let currentCalYear = new Date().getFullYear();
let tradeData = [];
let manualPnL = {};

// DOM Elements
const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const totalPnLEl = document.getElementById("totalPnL");
const calendarGrid = document.getElementById("calendar");

const calMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * Initialize Calendar
 */
async function initCalendar() {
    // Fill Month Select
    calMonths.forEach((m, i) => {
        const opt = new Option(m, i);
        opt.className = "text-slate-400 border-none outline-none font-black";
        monthSelect.appendChild(opt);
    });

    // Fill Year Select (PrecisionCalc style: Current +/- 3)
    const startYear = currentCalYear - 3;
    for (let y = startYear; y <= currentCalYear + 3; y++) {
        const opt = new Option(y, y);
        opt.className = "text-slate-400 outline-none border-none  font-black";
        if (y === currentCalYear) opt.selected = true;
        yearSelect.appendChild(opt);
    }

    monthSelect.value = currentCalMonth;
    
    // Initial Load
    await loadManualPnL();
    await loadTrades();
}

async function loadManualPnL() {
    try {
        const res = await fetch('/api/data/manual_pnl');
        if (res.ok) {
            manualPnL = await res.json() || {};
        }
    } catch (err) {
        console.error('Failed to load manual PnL', err);
    }
}

async function saveManualPnL() {
    try {
        await fetch('/api/data/manual_pnl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(manualPnL)
        });
    } catch (err) {
        console.error('Failed to save manual PnL', err);
    }
}

/**
 * Fetch and Process Data
 */
async function loadTrades() {
    try {
        const response = await fetch("/trades");
        tradeData = await response.json();
        
        processAndRender();
        return true;
    } catch (err) {
        console.error("Failed to load trades:", err);
        return false;
    }
}

/**
 * Logic & Calculation Block
 */
function processAndRender() {
    const calendarGrid = document.getElementById("calendar");
    
    // Smooth transition out
    calendarGrid.classList.add('opacity-0');

    setTimeout(() => {
        const entryPrices = {};
        const dailyPnL = {};
        
        tradeData.forEach(t => {
            if (t[15] === "true") entryPrices[t[16]] = parseFloat(t[8]);
        });

        tradeData.forEach(t => {
            if (t[15] === "false" && t[6] === "Filled") {
                const posId = t[16];
                const side = t[4].toUpperCase();
                const openPrice = entryPrices[posId];
                if (!openPrice) return;
                const lots = parseFloat(t[3]);
                const closePrice = parseFloat(t[8]);
                const symbol = t[1].toUpperCase();
                const contractSize = (symbol === "4701" || symbol === "4703") ? 100 : 1;
                const pnl = (side === "BUY" ? (openPrice - closePrice) : (closePrice - openPrice)) * lots * contractSize;
                const d = new Date(parseInt(t[13]));
                const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                dailyPnL[dateKey] = (dailyPnL[dateKey] || 0) + pnl;
            }
        });

        // Merge manual PnL (Override trade PnL)
        for (const [dateKey, pnl] of Object.entries(manualPnL)) {
            dailyPnL[dateKey] = pnl;
        }

        renderCalendarUI(dailyPnL);
        
        // Smooth transition in
        calendarGrid.classList.remove('opacity-0');
    }, 100);
}
/**
 * UI Rendering (Tailwind Class Pattern)
 */
function renderCalendarUI(dailyPnL) {
    calendarGrid.innerHTML = "";
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearSelect.value);
    let monthlyTotal = 0;

    // Weekday Headers
    ["S","M","T","W","T","F","S"].forEach(day => {
        const div = document.createElement("div");
        div.className = "text-center text-[13px] font-black text-slate-400 uppercase tracking-tighter mb-2";
        div.textContent = day;
        calendarGrid.appendChild(div);
    });
    

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Padding for first day
    for (let i = 0; i < firstDay; i++) calendarGrid.appendChild(document.createElement("div"));

    // Day Cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const pnl = dailyPnL[dateKey];
        const displayPnl = pnl || 0;
        monthlyTotal += displayPnl;

        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
        
        // Dynamic Tailwind Classes based on PnL
        let cardClass = "relative w-full min-h-[58px] sm:min-h-[70px] py-2 aspect-square rounded-xl  border transition-all duration-200 flex flex-col items-center justify-between overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95";

        if (displayPnl > 0) {
            cardClass += " bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/20";
        } else if (displayPnl < 0) {
            cardClass += " bg-rose-500/10 border-rose-500/30 dark:border-rose-500/20";
        } else {
            cardClass += " bg-slate-50 dark:bg-slate-800/50 border-transparent";
        }

        const div = document.createElement("div");
        div.className = cardClass;
        div.onclick = () => openPnLModal(dateKey, pnl);
        
        div.innerHTML = `
            <div class="flex items-center justify-center w-full h-7">
                <div class="text-[10px] sm:text-[11px] ${
                    isToday 
                    ? 'bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center' 
                    : 'text-slate-400 dark:text-slate-500'
                }">
                    ${day}
                </div>
            </div>

            <div class="flex items-end justify-center w-full h-5">
                <div class="text-[10px] sm:text-[11px] font-bold tracking-tight ${displayPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}">
                    ${displayPnl !== 0 ? '$' + Math.abs(displayPnl).toFixed(0) : ''}
                </div>
            </div>
        `;
        
        calendarGrid.appendChild(div);
    }
    // Update Summary Header
    updateTotalUI(monthlyTotal);
}

function updateTotalUI(total) {
    totalPnLEl.textContent =
        (total >= 0 ? "+$" : "-$") + Math.abs(total).toFixed(0);

    let baseClass =
        "ml-2 px-3 py-2 rounded-xl text-xs font-black tabular-nums transition-all duration-300 border";

    if (total > 0) {
        totalPnLEl.className =
            baseClass +
            " bg-emerald-50/50 border-emerald-500/20 text-emerald-500 dark:bg-emerald-500/5";
    } else if (total < 0) {
        totalPnLEl.className =
            baseClass +
            " bg-rose-50/50 border-rose-500/20 text-rose-500 dark:bg-rose-500/5";
    } else {
        totalPnLEl.className =
            baseClass +
            " bg-slate-50 border-transparent dark:bg-slate-800/50 text-slate-400";
    }
}







// Event Listeners
monthSelect.onchange = processAndRender;
yearSelect.onchange = processAndRender;

// Launch
// initCalendar(); is now called within launchApp() at the top level



const tabButtons = document.querySelectorAll('.tab-btn');



function updateHeaderUI(activeSection) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        const sectionName = btn.dataset.section;
        const label = document.getElementById(`label-${sectionName}`);
        const icon = btn.firstElementChild; 
        const isActive = sectionName === activeSection;

        if (isActive) {
            // Active: Expand padding and show label
            btn.classList.add('bg-white', 'dark:bg-slate-800', 'shadow-lg', 'scale-[1.02]', 'px-4');
            btn.classList.remove('px-2.5'); // Remove tight padding
            
            label.classList.add('text-indigo-600', 'dark:text-indigo-400', 'max-w-[100px]', 'opacity-100', 'ml-2');
            label.classList.remove('max-w-0', 'opacity-0');
            
            if (icon) icon.classList.remove('grayscale', 'opacity-50');
        } else {
            // Inactive: Shrink padding to minimize space
            btn.classList.remove('bg-white', 'dark:bg-slate-800', 'shadow-lg', 'scale-[1.02]', 'px-4');
            btn.classList.add('px-2.5'); // Add tight padding
            
            label.classList.add('max-w-0', 'opacity-0');
            label.classList.remove('text-indigo-600', 'dark:text-indigo-400', 'max-w-[100px]', 'opacity-100', 'ml-2');
            
            if (icon) icon.classList.add('grayscale', 'opacity-50');
        }
    });
}






// Initial load
// updateHeaderUI('calculator') is called at the end of the script

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const sectionName = btn.dataset.section;

        // Safely toggle content sections
        ['calculator', 'news', 'notes', 'calendar'].forEach(name => {
            const el = document.getElementById(`section-${name}`);
            if (el) el.classList.add('hidden');
        });

        const target = document.getElementById(`section-${sectionName}`);
        if (target) target.classList.remove('hidden');

        if (sectionName === 'notes') {
            setTimeout(() => {
                adjustTextareaHeight();
            }, 0);
        }
        
        updateHeaderUI(sectionName);
    });
});

// Initial load
// updateHeaderUI('calculator') is called at the end of the script



riskAmountInput.addEventListener('input', () => {
    const val = parseFloat(riskAmountInput.value);
    if (!isNaN(val)) {
        userSettings.riskAmount = val;
        saveSettingsToLocalStorage();
        updateRiskDisplay(); 
    }
});


esNqFixedValueInput.addEventListener('input', () => {
    const val = parseFloat(esNqFixedValueInput.value);
    if (!isNaN(val)) {
        if (currentSettingsMode === 'SP1!') {
            userSettings.esFixedValue = val;
        } else {
            userSettings.nqFixedValue = val;
        }
        saveSettingsToLocalStorage();
    }
});

btnEsSettings.addEventListener('click', () => {
    currentSettingsMode = 'SP1!';
    updateSettingsModeButtonsUI();
    esNqFixedValueInput.value = userSettings.esFixedValue; // sync input
    saveSettingsToLocalStorage(); // auto-save
});

btnNqSettings.addEventListener('click', () => {
    currentSettingsMode = 'NQ1!';
    updateSettingsModeButtonsUI();
    esNqFixedValueInput.value = userSettings.nqFixedValue; // sync input
    saveSettingsToLocalStorage(); // auto-save
});

// PnL Modal Logic
const pnlModal = document.getElementById('pnl-modal');
const pnlPanel = document.getElementById('pnl-panel');
const pnlInput = document.getElementById('pnl-input');
const pnlModalDate = document.getElementById('pnl-modal-date');
const pnlCancelBtn = document.getElementById('pnl-cancel-btn');
const pnlSaveBtn = document.getElementById('pnl-save-btn');
const btnPnlProfit = document.getElementById('btn-pnl-profit');
const btnPnlLoss = document.getElementById('btn-pnl-loss');

let currentPnLDateKey = null;
let currentPnLSign = 1; // 1 for profit, -1 for loss
let currentTotalPnL = undefined;

function updatePnLToggleUI() {
    if (currentPnLSign === 1) {
        btnPnlProfit.className = "flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 bg-white dark:bg-slate-800 shadow-lg text-emerald-500 scale-[1.02]";
        btnPnlLoss.className = "flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200";
    } else {
        btnPnlLoss.className = "flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 bg-white dark:bg-slate-800 shadow-lg text-rose-500 scale-[1.02]";
        btnPnlProfit.className = "flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200";
    }
}

btnPnlProfit.addEventListener('click', () => {
    currentPnLSign = 1;
    updatePnLToggleUI();
});

btnPnlLoss.addEventListener('click', () => {
    currentPnLSign = -1;
    updatePnLToggleUI();
});

function openPnLModal(dateKey, totalPnl) {
    currentPnLDateKey = dateKey;
    currentTotalPnL = totalPnl;
    
    // Format date like "Mar 4, 2026"
    const [year, month, day] = dateKey.split('-');
    const dateObj = new Date(year, month - 1, day);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    pnlModalDate.textContent = `PNL FOR ${formattedDate.toUpperCase()}`;
    
    if (totalPnl !== undefined && totalPnl !== null && totalPnl !== 0) {
        currentPnLSign = totalPnl >= 0 ? 1 : -1;
        pnlInput.value = parseFloat(Math.abs(totalPnl).toFixed(2));
    } else if (totalPnl === 0) {
        currentPnLSign = 1;
        pnlInput.value = '0';
    } else {
        currentPnLSign = 1;
        pnlInput.value = '';
    }
    updatePnLToggleUI();
    
    pnlModal.classList.remove('hidden');
    setTimeout(() => {
        pnlModal.classList.remove('opacity-0');
        pnlPanel.classList.remove('scale-95', 'opacity-0');
        pnlPanel.classList.add('scale-100', 'opacity-100');
        pnlInput.focus();
    }, 10);
}

function closePnLModal() {
    pnlModal.classList.add('opacity-0');
    pnlPanel.classList.remove('scale-100', 'opacity-100');
    pnlPanel.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        pnlModal.classList.add('hidden');
    }, 300);
}

pnlCancelBtn.addEventListener('click', closePnLModal);
pnlSaveBtn.addEventListener('click', () => {
    const val = parseFloat(pnlInput.value);
    let finalValue = undefined;
    
    if (!isNaN(val)) {
        finalValue = Math.abs(val) * currentPnLSign;
    }
    
    if (finalValue === currentTotalPnL) {
        closePnLModal();
        return;
    }
    
    if (finalValue !== undefined) {
        manualPnL[currentPnLDateKey] = finalValue;
    } else {
        delete manualPnL[currentPnLDateKey]; // clear if empty
    }
    saveManualPnL();
    processAndRender();
    closePnLModal();
});

pnlModal.addEventListener('click', (e) => {
    if (e.target === pnlModal) closePnLModal();
});

// Launch
launchApp();
updateHeaderUI('calculator');
adjustTextareaHeight();

