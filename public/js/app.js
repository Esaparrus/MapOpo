import { navarraPlaces } from "./places.js";

const questionElement = document.getElementById("question");
const checkButton = document.getElementById("checkButton");
const nextButton = document.getElementById("nextButton");
const feedbackElement = document.getElementById("feedback");

const map = L.map("map", {
  center: [42.695, -1.65],
  zoom: 8,
  minZoom: 6,
  maxZoom: 16,
  zoomControl: true,
  attributionControl: true
});

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
  maxZoom: 18,
  attribution:
    "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='https://carto.com/'>CARTO</a>"
}).addTo(map);

const guessIcon = L.divIcon({
  className: "", // avoid default marker styles
  html: "<span class='marker-pin guess-pin'></span>",
  iconSize: [24, 24],
  iconAnchor: [12, 24]
});

const targetIcon = L.divIcon({
  className: "",
  html: "<span class='marker-pin target-pin'></span>",
  iconSize: [24, 24],
  iconAnchor: [12, 24]
});

let currentPlace = null;
let guessMarker = null;
let targetMarker = null;
let connectionLine = null;
let answered = false;

function pickRandomPlace() {
  const index = Math.floor(Math.random() * navarraPlaces.length);
  return navarraPlaces[index];
}

function resetState() {
  if (guessMarker) {
    map.removeLayer(guessMarker);
    guessMarker = null;
  }
  if (targetMarker) {
    map.removeLayer(targetMarker);
    targetMarker = null;
  }
  if (connectionLine) {
    map.removeLayer(connectionLine);
    connectionLine = null;
  }
  feedbackElement.textContent = "Haz clic en el mapa para colocar tu respuesta.";
  feedbackElement.classList.remove("error");
  checkButton.disabled = true;
  nextButton.disabled = true;
  answered = false;
}

function loadNextQuestion() {
  currentPlace = pickRandomPlace();
  questionElement.textContent = currentPlace.question;
  resetState();
}

function formatDistance(distanceInMeters) {
  if (distanceInMeters >= 1000) {
    return `${(distanceInMeters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(distanceInMeters)} metros`;
}

map.on("click", (event) => {
  if (answered) {
    return;
  }

  if (!currentPlace) {
    return;
  }

  const { latlng } = event;

  if (!guessMarker) {
    guessMarker = L.marker(latlng, { icon: guessIcon });
    guessMarker.addTo(map);
  } else {
    guessMarker.setLatLng(latlng);
  }

  feedbackElement.textContent = "Pulsa en \"Comprobar\" para ver la solución.";
  checkButton.disabled = false;
});

checkButton.addEventListener("click", () => {
  if (!currentPlace || !guessMarker) {
    feedbackElement.textContent = "Primero marca tu respuesta en el mapa.";
    feedbackElement.classList.add("error");
    return;
  }

  answered = true;
  checkButton.disabled = true;
  nextButton.disabled = false;

  const guessLatLng = guessMarker.getLatLng();
  const actualLatLng = L.latLng(
    currentPlace.coordinates.lat,
    currentPlace.coordinates.lng
  );

  targetMarker = L.marker(actualLatLng, { icon: targetIcon }).addTo(map);

  connectionLine = L.polyline([guessLatLng, actualLatLng], {
    color: "#2563eb",
    weight: 2,
    dashArray: "6 6"
  }).addTo(map);

  const distance = guessLatLng.distanceTo(actualLatLng);

  const categoryLabel = {
    monte: "el monte",
    rio: "el río",
    carretera: "la carretera",
    pueblo: "la localidad"
  }[currentPlace.category] ?? "el lugar";

  feedbackElement.textContent = `Te has quedado a ${formatDistance(
    distance
  )} de ${categoryLabel} ${currentPlace.name}.`;
  feedbackElement.classList.remove("error");

  const bounds = L.latLngBounds([guessLatLng, actualLatLng]);
  map.fitBounds(bounds.pad(0.25));
});

nextButton.addEventListener("click", () => {
  loadNextQuestion();
});

loadNextQuestion();
