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
    src: typeof films !== 'undefined' ? films : [],
  },
  selector: "#autoComplete",
  threshold: 1,
  debounce: 100,
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
  maxResults: 6,
  highlight: true,
  resultItem: {
    content: (data, source) => {
      source.className = "autoComplete_result_item";
      source.innerHTML = '<div class="result-movie-row"><div class="result-icon-wrapper"><i class="fas fa-film"></i></div><span class="result-movie-text">' + data.match + '</span><i class="fas fa-chevron-right result-arrow"></i></div>';
    },
    element: "li"
  },
  noResults: () => {
    const result = document.createElement("li");
    result.setAttribute("class", "no_result_item");
    result.setAttribute("tabindex", "1");
    result.innerHTML = '<div class="no-result-row"><i class="fas fa-search"></i><span>No matching movies found in database</span></div>';
    const list = document.querySelector("#food_list") || document.querySelector("#autoComplete_list");
    if (list) {
      list.appendChild(result);
    }
  },
  onSelection: feedback => {
    const input = document.getElementById('autoComplete');
    const selectedMovie = feedback.selection.value;
    if (input) {
      input.value = selectedMovie;
      const btn = document.querySelector('.movie-button');
      if (btn) {
        btn.removeAttribute('disabled');
      }
    }
    clearAutoCompleteDropdown();
    setTimeout(clearAutoCompleteDropdown, 10);
    if (typeof triggerSearch === 'function') {
      triggerSearch(selectedMovie);
    }
  }
});