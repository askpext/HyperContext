// Listen for text selection
document.addEventListener('mouseup', handleSelection);
document.addEventListener('keyup', handleSelection); // For keyboard selection

async function handleSelection() {
  const selection = window.getSelection().toString().trim();
  if (!selection || selection.length < 3) return; // Ignore short or empty selections

  let summary = await getWikipediaSummary(selection).catch(() => null);
  if (!summary) {
    summary = getLocalSummary(selection); // Fallback to in-browser heuristics
  }

  showTooltip(selection, summary);
}

// Wikipedia API fetch (free, robust with error handling)
async function getWikipediaSummary(term) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('API error');
  const data = await response.json();
  
  // Minimalism: Take first sentence or excerpt, truncate to ~50 words
  let shortSummary = data.extract || 'No summary found.';
  shortSummary = shortSummary.split('.')[0] + '.'; // First sentence
  if (shortSummary.length > 250) { // Char limit for brevity
    shortSummary = shortSummary.slice(0, 250) + '...';
  }
  return shortSummary;
}

// In-browser "NLP" heuristics (client-side, no API: regex + DOM parsing)
function getLocalSummary(term) {
  const pageText = document.body.innerText.toLowerCase();
  const termLower = term.toLowerCase();
  
  // Find sentences containing the term
  const sentences = pageText.match(/[^.!?]+[.!?]+/g) || [];
  const relevant = sentences.find(s => s.includes(termLower));
  
  if (relevant) {
    // Extract short meaning: phrase around the term, truncate
    const words = relevant.split(/\s+/);
    const index = words.findIndex(w => w.includes(termLower));
    const excerpt = words.slice(Math.max(0, index - 20), index + 21).join(' ');
    return excerpt.length > 250 ? excerpt.slice(0, 250) + '...' : excerpt;
  }
  
  return `Local context for "${term}": Not found on page.`;
}

// Show minimal tooltip (positioned near cursor, auto-fades)
let tooltip = null;
function showTooltip(term, summary) {
  if (tooltip) tooltip.remove(); // Clean up old tooltip
  
  tooltip = document.createElement('div');
  tooltip.className = 'hypercontext-tooltip';
  tooltip.innerHTML = `<strong>${term}</strong>: ${summary}`;
  
  document.body.appendChild(tooltip);
  
  // Position near mouse
  const positionTooltip = (e) => {
    tooltip.style.left = `${e.pageX + 15}px`;
    tooltip.style.top = `${e.pageY + 15}px`;
  };
  document.addEventListener('mousemove', positionTooltip);
  
  // Auto-remove after 5s or on click
  setTimeout(() => removeTooltip(), 5000);
  tooltip.addEventListener('click', removeTooltip);
}

function removeTooltip() {
  if (tooltip) {
    tooltip.remove();
    tooltip = null;
  }
}

// Stub for context map (expand later: add to localStorage and render Canvas)
function addToContextMap(term, summary) {
  const map = JSON.parse(localStorage.getItem('hyperContextMap') || '{}');
  map[term] = { summary, timestamp: Date.now() };
  localStorage.setItem('hyperContextMap', JSON.stringify(map));
  
  // Render basic map (Canvas example)
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 100;
  canvas.style.cssText = 'position: fixed; bottom: 10px; right: 10px; border: 1px solid #ccc;';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText(`Map: ${term}`, 10, 20);
  setTimeout(() => canvas.remove(), 3000); // Temp display
}

// Optional: Call addToContextMap(summary) inside handleSelection if you want maps auto-triggered