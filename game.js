const specimens = ["🦖", "🦕", "🥚", "🦴", "🪨", "🦎", "🪶", "🐚", "☄️"];
const specimenNames = ["Tyrannosaur", "Sauropod", "Dinosaur egg", "Fossil bone", "Dig stone", "Raptor", "Ancient feather", "Ammonite", "Meteor"];

// Unique 9×9 excavations: fewer clues make each level more demanding.
const excavations = {
  easy: { solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179", puzzle: "530000902600105300008002067000760003420853790710020806061037080080410605340280070" },
  medium: { solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179", puzzle: "530008902070105340090042560800700000006853000000024800000500280000000600340080100" },
  hard: { solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179", puzzle: "530000012070100000098300000009700000026003700003020006000030280000410605000000000" },
};
const toValues = (string) => [...string].map((digit) => Number(digit) - 1);
const board = document.querySelector("#board");
const palette = document.querySelector("#palette");
const status = document.querySelector("#status");
const timer = document.querySelector("#timer");
const progress = document.querySelector("#progress");
const hintsText = document.querySelector("#hints");
const dialog = document.querySelector("#complete-dialog");
const startScreen = document.querySelector("#start-screen");
const gameScreen = document.querySelector("#game-screen");
let selectedSpecimen = 0, cells = [], startingPuzzle = [], solution = [], hints = 5, seconds = 0, elapsedInterval, finished = false, currentDifficulty = "medium";

function formatTime(total) { return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`; }
function saveGame() { localStorage.setItem("fossil-sudoku-save", JSON.stringify({ cells, startingPuzzle, solution, hints, seconds, finished, currentDifficulty })); }
function loadGame() { try { return JSON.parse(localStorage.getItem("fossil-sudoku-save")); } catch { return null; } }
function updateStats() { timer.textContent = formatTime(seconds); progress.textContent = `${cells.filter((value) => value !== null).length} / 81`; hintsText.textContent = hints; }
function renderPalette() {
  palette.innerHTML = "";
  specimens.forEach((specimen, index) => {
    const button = document.createElement("button");
    button.className = `specimen${index === selectedSpecimen ? " active" : ""}`;
    button.type = "button"; button.textContent = specimen; button.setAttribute("aria-label", `Choose ${specimenNames[index]}`);
    button.addEventListener("click", () => { selectedSpecimen = index; renderPalette(); });
    palette.append(button);
  });
}
function renderDifficulty() {
  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    const active = button.dataset.difficulty === currentDifficulty;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}
function sharesUnit(first, second) {
  const rowA = Math.floor(first / 9), colA = first % 9, rowB = Math.floor(second / 9), colB = second % 9;
  return rowA === rowB || colA === colB || (Math.floor(rowA / 3) === Math.floor(rowB / 3) && Math.floor(colA / 3) === Math.floor(colB / 3));
}
function conflictsAt(index) { const value = cells[index]; return value === null ? [] : cells.map((candidate, other) => other !== index && candidate === value && sharesUnit(index, other) ? other : -1).filter((item) => item >= 0); }
function renderBoard(selected = -1, conflicts = []) {
  board.innerHTML = "";
  cells.forEach((value, index) => {
    const button = document.createElement("button"), isGiven = startingPuzzle[index] !== null;
    button.className = `cell${isGiven ? " given" : ""}${selected >= 0 && sharesUnit(selected, index) ? " related" : ""}${index === selected ? " selected" : ""}${conflicts.includes(index) ? " conflict" : ""}`;
    button.type = "button"; button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", `Row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1}${value !== null ? `: ${specimenNames[value]}` : ", empty"}`);
    button.textContent = value === null ? "" : specimens[value];
    if (!isGiven && !finished) button.addEventListener("click", () => placeSpecimen(index));
    board.append(button);
  });
  updateStats();
}
function placeSpecimen(index) {
  cells[index] = selectedSpecimen;
  const conflicts = conflictsAt(index);
  if (conflicts.length) { status.textContent = "That specimen is already in this row, column, or dig site."; renderBoard(index, [index, ...conflicts]); }
  else { status.textContent = "Nice find. Keep excavating!"; renderBoard(index); checkComplete(); }
  saveGame();
}
function checkComplete() {
  if (!cells.every((value, index) => value === solution[index])) return;
  finished = true; clearInterval(elapsedInterval); status.textContent = "Every specimen is in its proper place.";
  document.querySelector("#complete-copy").textContent = `You restored Fern Hollow in ${formatTime(seconds)} with ${hints} hint${hints === 1 ? "" : "s"} left.`;
  saveGame(); setTimeout(() => dialog.showModal(), 350);
}
function startTimer() { clearInterval(elapsedInterval); if (!finished) elapsedInterval = setInterval(() => { seconds += 1; updateStats(); saveGame(); }, 1000); }
function startExcavation(useSave = false) {
  const saved = useSave && loadGame();
  if (saved?.cells?.length === 81 && saved?.startingPuzzle?.length === 81 && saved?.solution?.length === 81) ({ cells, startingPuzzle, solution, hints, seconds, finished, currentDifficulty = "medium" } = saved);
  else {
    const excavation = excavations[currentDifficulty];
    solution = toValues(excavation.solution); startingPuzzle = [...excavation.puzzle].map((digit) => digit === "0" ? null : Number(digit) - 1);
    cells = [...startingPuzzle]; hints = 5; seconds = 0; finished = false;
  }
  selectedSpecimen = 0; renderDifficulty(); renderPalette(); renderBoard(); startTimer();
  if (finished) status.textContent = "This excavation has already been completed.";
}
document.querySelector("#hint-button").addEventListener("click", () => {
  if (hints <= 0 || finished) return;
  const open = cells.map((value, index) => value === null ? index : -1).filter((index) => index >= 0);
  if (!open.length) return;
  const target = open[Math.floor(Math.random() * open.length)]; cells[target] = solution[target]; hints -= 1;
  status.textContent = "A museum conservator placed one specimen for you."; renderBoard(target); saveGame(); checkComplete();
});
document.querySelector("#reset-button").addEventListener("click", () => { cells = [...startingPuzzle]; seconds = 0; finished = false; status.textContent = "The dig site has been carefully reset."; renderBoard(); startTimer(); saveGame(); });
document.querySelector("#new-button").addEventListener("click", () => { localStorage.removeItem("fossil-sudoku-save"); startExcavation(); });
document.querySelector("#play-again-button").addEventListener("click", () => { dialog.close(); localStorage.removeItem("fossil-sudoku-save"); startExcavation(); });
document.querySelectorAll("[data-difficulty]").forEach((button) => button.addEventListener("click", () => {
  currentDifficulty = button.dataset.difficulty;
  localStorage.removeItem("fossil-sudoku-save");
  status.textContent = `${currentDifficulty[0].toUpperCase() + currentDifficulty.slice(1)} excavation selected.`;
  startExcavation();
}));
document.querySelectorAll("[data-start-difficulty]").forEach((button) => button.addEventListener("click", () => {
  currentDifficulty = button.dataset.startDifficulty;
  localStorage.removeItem("fossil-sudoku-save");
  startScreen.hidden = true;
  gameScreen.hidden = false;
  startExcavation();
}));
