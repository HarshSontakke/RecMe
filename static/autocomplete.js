function clearAutoCompleteDropdown() {
  const lists = document.querySelectorAll("#food_list, #autoComplete_list, .autoComplete_list");
  lists.forEach(list => {
    list.innerHTML = "";
  });
  const input = document.getElementById('autoComplete');
  if (input && document.activeElement === input) {
    input.blur();
  }
}
window.clearAutoCompleteDropdown = clearAutoCompleteDropdown;

new autoComplete({
  data: {
    src: async () => {
      const input = document.querySelector("#autoComplete");
      const query = input ? input.value.trim() : "";
      if (!query || query.length < 2) return [];
      try {
        const apiKey = 'd47509337b8e8d779853e5b2a838c4db';
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!data || !data.results) return [];
        return data.results
          .filter(item => (item.media_type === 'movie' || item.media_type === 'tv') && (item.title || item.name))
          .slice(0, 8)
          .map(item => ({
            id: item.id,
            title: item.title || item.name,
            media_type: item.media_type,
            year: (item.release_date || item.first_air_date || '').substring(0, 4),
            poster: item.poster_path 
              ? `https://image.tmdb.org/t/p/w92${item.poster_path}` 
              : "data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'45\' height=\'68\' viewBox=\'0 0 45 68\'><rect width=\'45\' height=\'68\' fill=\'%23131722\'/><text x=\'50%\' y=\'55%\' fill=\'%2364748b\' font-family=\'sans-serif\' font-size=\'16\' text-anchor=\'middle\'>🎬</text></svg>"
          }));
      } catch (e) {
        console.error("Autocomplete fetch error:", e);
        return [];
      }
    },
    key: ["title"],
    cache: false
  },
  selector: "#autoComplete",
  threshold: 2,
  debounce: 180,
  searchEngine: "loose",
  resultsList: {
    render: true,
    container: source => {
      source.setAttribute("id", "food_list");
    },
    destination: document.querySelector(".search-container"),
    position: "beforeend",
    element: "ul"
  },
  maxResults: 8,
  highlight: true,
  resultItem: {
    content: (data, source) => {
      source.className = "autoComplete_result_item";
      const item = data.value;
      const isTv = item.media_type === 'tv';
      const badgeClass = isTv ? 'badge-tv' : 'badge-movie';
      const badgeIcon = isTv ? 'fas fa-tv' : 'fas fa-film';
      const badgeText = isTv ? 'Series' : 'Movie';
      const yearText = item.year ? `(${item.year})` : '';

      source.innerHTML = `
        <div class="result-movie-row">
          <img class="result-thumb" src="${item.poster}" alt="${item.title}" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'45\\\' height=\\\'68\\\' viewBox=\\\'0 0 45 68\\\'><rect width=\\\'45\\\' height=\\\'68\\\' fill=\\\'%23131722\\\'/><text x=\\\'50%\\\' y=\\\'55%\\\' fill=\\\'%2364748b\\\' font-family=\\\'sans-serif\\\' font-size=\\\'16\\\' text-anchor=\\\'middle\\\'>🎬</text></svg>';">
          <div class="result-info">
            <div class="result-title-line">
              <span class="result-movie-text">${data.match}</span>
              <span class="result-year">${yearText}</span>
            </div>
            <span class="result-badge ${badgeClass}"><i class="${badgeIcon}"></i> ${badgeText}</span>
          </div>
          <i class="fas fa-chevron-right result-arrow"></i>
        </div>
      `;
    },
    element: "li"
  },
  noResults: () => {
    const result = document.createElement("li");
    result.setAttribute("class", "no_result_item");
    result.setAttribute("tabindex", "1");
    result.innerHTML = '<div class="no-result-row"><i class="fas fa-search"></i><span>No movies or web series found</span></div>';
    const list = document.querySelector("#food_list") || document.querySelector("#autoComplete_list");
    if (list) {
      list.appendChild(result);
    }
  },
  onSelection: feedback => {
    const input = document.getElementById('autoComplete');
    const selectedItem = feedback.selection.value;
    const title = typeof selectedItem === 'object' ? selectedItem.title : selectedItem;
    const mediaType = typeof selectedItem === 'object' ? selectedItem.media_type : 'movie';
    const id = typeof selectedItem === 'object' ? selectedItem.id : '';
    
    if (input) {
      input.value = title;
      input.setAttribute('data-id', id);
      input.setAttribute('data-media-type', mediaType);
      const btn = document.querySelector('.movie-button');
      if (btn) {
        btn.removeAttribute('disabled');
      }
    }
    clearAutoCompleteDropdown();
    setTimeout(clearAutoCompleteDropdown, 10);
    if (typeof triggerSearch === 'function') {
      triggerSearch(title, mediaType, id);
    }
  }
});