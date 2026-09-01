async function checkEvolution() {
  const input = document.getElementById('pokemonInput').value.toLowerCase().trim();
  const resultDiv = document.getElementById('result');
  if (!input) return;

  resultDiv.innerHTML = "Searching...";

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${input}`);
    if (!response.ok) throw new Error("Pokémon not found");
    const data = await response.json();

    const speciesResponse = await fetch(data.species.url);
    const speciesData = await speciesResponse.json();

    const evoResponse = await fetch(speciesData.evolution_chain.url);
    const evoData = await evoResponse.json();

    let chain = evoData.chain;
    let evolvesTo = null;

    if (chain.species.name === input && chain.evolves_to.length > 0) {
      evolvesTo = chain.evolves_to[0].species.name;
    } else if (chain.evolves_to.length > 0) {
      for (let sub of chain.evolves_to) {
        if (sub.species.name === input && sub.evolves_to.length > 0) {
          evolvesTo = sub.evolves_to[0].species.name;
        }
      }
    }

    if (evolvesTo) {
      const evoPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${evolvesTo}`);
      const evoPokemonData = await evoPokemonResponse.json();

      resultDiv.innerHTML = `
        <h2>Yes, you should evolve ${data.name.toUpperCase()}!</h2>
        <div style="display:flex; gap: 20px; align-items:center;">
          <div>
            <p>Current: ${data.name}</p>
            <img src="${data.sprites.front_default}" alt="${data.name}">
          </div>
          <h3>➔</h3>
          <div>
            <p>Evolves into: ${evoPokemonData.name}</p>
            <img src="${evoPokemonData.sprites.front_default}" alt="${evoPokemonData.name}">
          </div>
        </div>
      `;
    } else {
      resultDiv.innerHTML = `
        <h2>No / Fully Evolved</h2>
        <p>${data.name.toUpperCase()} does not evolve further.</p>
        <img src="${data.sprites.front_default}" alt="${data.name}">
      `;
    }
  } catch (err) {
    resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}