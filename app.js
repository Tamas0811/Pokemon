// "Should I evolve this Pokémon?" - reads all data from pokemon.csv in this repo.

const STATS = [
  ["hp", "HP"],
  ["attack", "Attack"],
  ["defense", "Defense"],
  ["special_attack", "Sp. Atk"],
  ["special_defense", "Sp. Def"],
  ["speed", "Speed"],
];

let pokemon = [];        // one row per species (default forms only)
const bySpecies = {};    // species_id -> row

// ---------- Loading the CSV ----------

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i] === "NA" ? null : values[i]));
    return row;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const selectEl = document.getElementById("pokemonSelect");
  try {
    const res = await fetch("pokemon.csv");
    if (!res.ok) throw new Error("Could not load pokemon.csv");
    const rows = parseCsv(await res.text());

    // Keep only the default form of each species (skips megas, alternate forms, etc.)
    pokemon = rows.filter((r) => r.id === r.species_id);
    pokemon.forEach((p) => {
      STATS.forEach(([key]) => (p[key] = Number(p[key])));
      p.bst = STATS.reduce((sum, [key]) => sum + p[key], 0);
      bySpecies[p.species_id] = p;
    });
    pokemon.sort((a, b) => a.pokemon.localeCompare(b.pokemon));

    renderList("");
    document.getElementById("search").addEventListener("input", (e) => renderList(e.target.value));
    selectEl.addEventListener("change", () => showResult(selectEl.value));
  } catch (err) {
    selectEl.innerHTML = `<option>${err.message}</option>`;
  }
});

function renderList(query) {
  const selectEl = document.getElementById("pokemonSelect");
  const q = query.trim().toLowerCase();
  const matches = pokemon.filter((p) => p.pokemon.includes(q));
  selectEl.innerHTML = matches
    .map((p) => `<option value="${p.species_id}">${displayName(p)}</option>`)
    .join("");
  if (matches.length === 1) {
    selectEl.value = matches[0].species_id;
    showResult(matches[0].species_id);
  }
}

// ---------- Helpers ----------

function displayName(p) {
  return p.pokemon
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function types(p) {
  return [p.type_1, p.type_2].filter(Boolean);
}

function abilities(p) {
  return [p.ability_1, p.ability_2, p.ability_hidden].filter(Boolean);
}

function evolutionsOf(p) {
  return pokemon.filter((x) => x.evolves_from_species_id === p.species_id);
}

function imageHtml(p) {
  if (!p.url_image) return `<div class="no-image">No image</div>`;
  return `<img src="images/${p.url_image}" alt="${displayName(p)}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'no-image',textContent:'No image'}))">`;
}

function typeBadges(p) {
  return types(p).map((t) => `<span class="type type-${t}">${t}</span>`).join(" ");
}

function card(p) {
  return `
    <div class="card">
      ${imageHtml(p)}
      <h3>${displayName(p)}</h3>
      <div>${typeBadges(p)}</div>
      <p class="bst">Base stat total: <strong>${p.bst}</strong></p>
    </div>`;
}

// ---------- The decision logic ----------

function assess(from, to) {
  const diffs = STATS.map(([key, label]) => ({ label, before: from[key], after: to[key], diff: to[key] - from[key] }));
  const drops = diffs.filter((d) => d.diff < 0);
  const bstDiff = to.bst - from.bst;

  const lostTypes = types(from).filter((t) => !types(to).includes(t));
  const gainedTypes = types(to).filter((t) => !types(from).includes(t));
  const abilityChanged = abilities(from).join() !== abilities(to).join();

  const notes = [];
  drops.forEach((d) => notes.push(`${d.label} drops by ${-d.diff} (${d.before} → ${d.after}).`));
  if (lostTypes.length || gainedTypes.length) {
    const parts = [];
    if (gainedTypes.length) parts.push(`gains ${gainedTypes.join("/")}`);
    if (lostTypes.length) parts.push(`loses ${lostTypes.join("/")}`);
    notes.push(`Type changes: ${parts.join(" and ")}, which changes its weaknesses and resistances.`);
  }
  if (abilityChanged) notes.push(`Abilities change: ${abilities(from).join(", ")} → ${abilities(to).join(", ")}.`);

  let verdict, level;
  if (bstDiff < 0) {
    verdict = "Probably not";
    level = "no";
  } else if (bstDiff === 0) {
    verdict = "It depends";
    level = "maybe";
    notes.unshift("The base stat total stays the same, so evolving only redistributes stats.");
  } else if (drops.length === 0 && !lostTypes.length && !gainedTypes.length) {
    verdict = "Yes";
    level = "yes";
  } else {
    verdict = "Yes, with trade-offs";
    level = "maybe";
  }

  return { diffs, bstDiff, notes, verdict, level };
}

function statTable(diffs) {
  const max = 255;
  return `
    <table class="stats">
      ${diffs
        .map(
          (d) => `
        <tr>
          <th>${d.label}</th>
          <td class="num">${d.before}</td>
          <td class="bar-cell"><div class="bar" style="width:${(d.after / max) * 100}%"></div></td>
          <td class="num">${d.after}</td>
          <td class="num ${d.diff > 0 ? "up" : d.diff < 0 ? "down" : ""}">${d.diff > 0 ? "+" : ""}${d.diff}</td>
        </tr>`
        )
        .join("")}
    </table>`;
}

function showResult(speciesId) {
  const resultDiv = document.getElementById("result");
  const current = bySpecies[speciesId];
  if (!current) return;

  const options = evolutionsOf(current);

  if (options.length === 0) {
    const pre = bySpecies[current.evolves_from_species_id];
    const reason = pre
      ? `${displayName(current)} is already in its final form (it evolves from ${displayName(pre)}).`
      : `${displayName(current)} does not evolve.`;
    resultDiv.innerHTML = `
      <div class="verdict verdict-none"><h2>No evolution available</h2><p>${reason}</p></div>
      <div class="compare">${card(current)}</div>`;
    return;
  }

  const results = options.map((to) => ({ to, ...assess(current, to) })).sort((a, b) => b.bstDiff - a.bstDiff);

  let header;
  if (results.length === 1) {
    const r = results[0];
    header = `
      <div class="verdict verdict-${r.level}">
        <h2>${r.verdict}: evolve ${displayName(current)} into ${displayName(r.to)}</h2>
        <p>Base stat total ${r.bstDiff > 0 ? "+" : ""}${r.bstDiff}</p>
      </div>`;
  } else {
    const best = results[0];
    header = `
      <div class="verdict verdict-maybe">
        <h2>Yes, but you have to choose: ${results.length} possible evolutions</h2>
        <p>${displayName(current)} can evolve into ${results.map((r) => displayName(r.to)).join(", ")}.
        The biggest stat gain is ${displayName(best.to)} (+${best.bstDiff}), but pick based on the type you need for your team.</p>
      </div>`;
  }

  const blocks = results
    .map(
      (r) => `
    <div class="option">
      ${results.length > 1 ? `<h3 class="option-title verdict-${r.level}">${displayName(r.to)}: ${r.verdict} (${r.bstDiff > 0 ? "+" : ""}${r.bstDiff})</h3>` : ""}
      <div class="compare">
        ${card(current)}
        <div class="arrow">➔</div>
        ${card(r.to)}
      </div>
      ${statTable(r.diffs)}
      ${r.notes.length ? `<ul class="notes">${r.notes.map((n) => `<li>${n}</li>`).join("")}</ul>` : `<p class="notes-ok">Every stat goes up and the type stays the same.</p>`}
    </div>`
    )
    .join("");

  resultDiv.innerHTML = header + blocks;
}
