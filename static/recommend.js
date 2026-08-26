$(function() {
  const source = document.getElementById('autoComplete');
  
  // Enable / disable recommend button based on input value
  if (source) {
    source.addEventListener('input', function(e) {
      if (e.target.value.trim() === "") {
        $('.movie-button').attr('disabled', true);
        if (typeof clearAutoCompleteDropdown === 'function') {
          clearAutoCompleteDropdown();
        }
      } else {
        $('.movie-button').attr('disabled', false);
      }
    });

    // Press Enter to submit search
    source.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        var title = $(source).val().trim();
        var mediaType = $(source).attr('data-media-type') || '';
        var id = $(source).attr('data-id') || '';
        if (title !== "") {
          if (typeof clearAutoCompleteDropdown === 'function') {
            clearAutoCompleteDropdown();
          }
          triggerSearch(title, mediaType, id);
        }
      }
    });
  }

  // Click on search button
  $('.movie-button').on('click', function() {
    var title = $('#autoComplete').val().trim();
    var mediaType = $('#autoComplete').attr('data-media-type') || '';
    var id = $('#autoComplete').attr('data-id') || '';
    if (title === "") {
      $('.results').css('display', 'none');
      $('.fail').css('display', 'block');
    } else {
      if (typeof clearAutoCompleteDropdown === 'function') {
        clearAutoCompleteDropdown();
      }
      triggerSearch(title, mediaType, id);
    }
  });

  // Click on Quick Suggestion Chips
  $(document).on('click', '.chip-btn', function() {
    var title = $(this).data('title') || $(this).data('movie');
    var mediaType = $(this).data('type') || '';
    var id = $(this).data('id') || '';
    if (title) {
      $('#autoComplete').val(title);
      $('.movie-button').attr('disabled', false);
      if (typeof clearAutoCompleteDropdown === 'function') {
        clearAutoCompleteDropdown();
      }
      triggerSearch(title, mediaType, id);
    }
  });

  // Click outside search container to dismiss dropdown
  $(document).on('click', function(e) {
    if (!$(e.target).closest('.search-container').length) {
      if (typeof clearAutoCompleteDropdown === 'function') {
        clearAutoCompleteDropdown();
      }
    }
  });

  // Press Escape to dismiss dropdown
  $(document).on('keydown', function(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      if (typeof clearAutoCompleteDropdown === 'function') {
        clearAutoCompleteDropdown();
      }
    }
  });
});

const TMDB_API_KEY = 'd47509337b8e8d779853e5b2a838c4db';

function triggerSearch(title, mediaType, id) {
  if (typeof clearAutoCompleteDropdown === 'function') {
    clearAutoCompleteDropdown();
  }
  load_details(title, mediaType, id);
}

// Invoked when clicking on a recommended movie / series card
function recommendcard(e) {
  if (typeof clearAutoCompleteDropdown === 'function') {
    clearAutoCompleteDropdown();
  }
  var title = e.getAttribute('title') || e.getAttribute('data-title');
  var mediaType = e.getAttribute('data-media-type') || '';
  var id = e.getAttribute('data-id') || '';
  if (title) {
    $('html, body').animate({ scrollTop: 0 }, 400);
    load_details(title, mediaType, id);
  }
}

// Main function to fetch details, recommendations, and cast
async function load_details(title, mediaType, id) {
  $("#loader").css('display', 'flex').hide().fadeIn(250);
  $('.fail').fadeOut(200);

  try {
    let selectedId = id;
    let selectedType = mediaType;
    let displayTitle = title;

    // Step 1: If ID or type is missing, search TMDB multi-search
    if (!selectedId || !selectedType) {
      const searchRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
      const searchData = await searchRes.json();
      
      const match = searchData.results && searchData.results.find(item => 
        (item.media_type === 'movie' || item.media_type === 'tv') && (item.title || item.name)
      );

      if (!match) {
        throw new Error("No matching movie or series found");
      }

      selectedId = match.id;
      selectedType = match.media_type;
      displayTitle = match.title || match.name;
    }

    const endpoint = selectedType === 'tv' ? 'tv' : 'movie';

    // Step 2: Fetch Details, Credits, and Recommendations in parallel
    const [detailsRes, creditsRes, recsRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/${endpoint}/${selectedId}?api_key=${TMDB_API_KEY}`),
      fetch(`https://api.themoviedb.org/3/${endpoint}/${selectedId}/credits?api_key=${TMDB_API_KEY}`),
      fetch(`https://api.themoviedb.org/3/${endpoint}/${selectedId}/recommendations?api_key=${TMDB_API_KEY}`)
    ]);

    const details = await detailsRes.json();
    const credits = await creditsRes.json();
    let recsData = await recsRes.json();

    // If recommendations are fewer than 4, fallback to /similar
    if (!recsData.results || recsData.results.length < 4) {
      const similarRes = await fetch(`https://api.themoviedb.org/3/${endpoint}/${selectedId}/similar?api_key=${TMDB_API_KEY}`);
      const similarData = await similarRes.json();
      recsData.results = (recsData.results || []).concat(similarData.results || []);
    }

    // Step 3: Process Recommendations (Top 10)
    const recMovies = [];
    const recPosters = [];
    const recTypes = [];
    const recIds = [];

    const seenIds = new Set([selectedId]);
    for (const item of (recsData.results || [])) {
      if (item && item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        const itemTitle = item.title || item.name;
        const itemPoster = item.poster_path 
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : 'https://via.placeholder.com/240x360?text=No+Poster';
        const itemType = item.media_type || selectedType;

        recMovies.push(itemTitle);
        recPosters.push(itemPoster);
        recTypes.push(itemType);
        recIds.push(item.id);

        if (recMovies.length >= 10) break;
      }
    }

    // Step 4: Process Top Cast (up to 8 cast members)
    const castMembers = (credits.cast || []).slice(0, 8);
    const castIds = [];
    const castNames = [];
    const castChars = [];
    const castProfiles = [];
    const castBdays = [];
    const castBios = [];
    const castPlaces = [];

    // Fetch individual actor details in parallel
    const actorPromises = castMembers.map(cast => 
      fetch(`https://api.themoviedb.org/3/person/${cast.id}?api_key=${TMDB_API_KEY}`)
        .then(r => r.json())
        .catch(() => ({}))
    );
    const actorsData = await Promise.all(actorPromises);

    castMembers.forEach((cast, idx) => {
      const actorInfo = actorsData[idx] || {};
      castIds.push(cast.id);
      castNames.push(cast.name || 'Unknown');
      castChars.push(cast.character || 'Cast');
      castProfiles.push(cast.profile_path ? `https://image.tmdb.org/t/p/w500${cast.profile_path}` : 'https://via.placeholder.com/240x360?text=No+Photo');
      
      const bday = actorInfo.birthday ? new Date(actorInfo.birthday).toDateString().split(' ').slice(1).join(' ') : 'N/A';
      castBdays.push(bday);
      castPlaces.push(actorInfo.place_of_birth || 'N/A');
      castBios.push((actorInfo.biography || '').substring(0, 800));
    });

    // Step 5: Format Media Details
    const poster = details.poster_path 
      ? `https://image.tmdb.org/t/p/original${details.poster_path}` 
      : 'https://via.placeholder.com/260x390?text=No+Poster';
    const overview = details.overview || 'No storyline overview available.';
    const rating = details.vote_average ? Number(details.vote_average).toFixed(1) : 'N/A';
    const voteCount = details.vote_count ? Number(details.vote_count).toLocaleString() : '0';
    const genreList = (details.genres || []).map(g => g.name).join(', ');
    const status = details.status || 'Released';
    const imdbId = details.imdb_id || (details.external_ids ? details.external_ids.imdb_id : '');

    let releaseDate = 'Unknown';
    let runtimeFormatted = '';
    let seasonsCount = '';
    let episodesCount = '';

    if (selectedType === 'tv') {
      if (details.first_air_date) {
        releaseDate = new Date(details.first_air_date).toDateString().split(' ').slice(1).join(' ');
      }
      seasonsCount = details.number_of_seasons ? `${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}` : '';
      episodesCount = details.number_of_episodes ? `${details.number_of_episodes} Episodes` : '';
    } else {
      if (details.release_date) {
        releaseDate = new Date(details.release_date).toDateString().split(' ').slice(1).join(' ');
      }
      const runtimeVal = parseInt(details.runtime) || 0;
      if (runtimeVal > 0) {
        if (runtimeVal % 60 === 0) {
          runtimeFormatted = Math.floor(runtimeVal / 60) + " hr";
        } else {
          runtimeFormatted = Math.floor(runtimeVal / 60) + " hr " + (runtimeVal % 60) + " min";
        }
      } else {
        runtimeFormatted = 'N/A';
      }
    }

    const payload = {
      title: displayTitle,
      media_type: selectedType,
      movie_id: selectedId,
      imdb_id: imdbId,
      poster: poster,
      genres: genreList,
      overview: overview,
      rating: rating,
      vote_count: voteCount,
      release_date: releaseDate,
      runtime: runtimeFormatted,
      seasons: seasonsCount,
      episodes: episodesCount,
      status: status,
      rec_movies: JSON.stringify(recMovies),
      rec_posters: JSON.stringify(recPosters),
      rec_types: JSON.stringify(recTypes),
      rec_ids: JSON.stringify(recIds),
      cast_ids: JSON.stringify(castIds),
      cast_names: JSON.stringify(castNames),
      cast_chars: JSON.stringify(castChars),
      cast_profiles: JSON.stringify(castProfiles),
      cast_bdays: JSON.stringify(castBdays),
      cast_bios: JSON.stringify(castBios),
      cast_places: JSON.stringify(castPlaces)
    };

    // Step 6: Post to Flask for NLP Sentiment Classification and HTML Render
    $.ajax({
      type: 'POST',
      url: "/recommend",
      data: payload,
      dataType: 'html',
      complete: function() {
        $("#loader").fadeOut(300);
      },
      success: function(response) {
        $('#featuredSection').hide();
        $('.results').html(response).fadeIn(350);
        $('#autoComplete').val('');
        $('#autoComplete').removeAttr('data-id');
        $('#autoComplete').removeAttr('data-media-type');
        $('.movie-button').attr('disabled', true);
        
        $('html, body').animate({
          scrollTop: 0
        }, 400);
      },
      error: function(err) {
        console.error("Recommend error:", err);
        $('.fail').fadeIn(300);
      }
    });

  } catch (error) {
    console.error("Error loading movie/series details:", error);
    $("#loader").fadeOut(250);
    $('.fail').fadeIn(300);
    $('.results').fadeOut(200);
  }
}
