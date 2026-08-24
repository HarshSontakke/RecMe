$(function() {
  const source = document.getElementById('autoComplete');
  
  // Enable / disable recommend button based on input value
  if (source) {
    source.addEventListener('input', function(e) {
      if (e.target.value.trim() === "") {
        $('.movie-button').attr('disabled', true);
      } else {
        $('.movie-button').attr('disabled', false);
      }
    });

    // Press Enter to submit search
    source.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        var title = $(source).val().trim();
        if (title !== "") {
          triggerSearch(title);
        }
      }
    });
  }

  // Click on search button
  $('.movie-button').on('click', function() {
    var title = $('#autoComplete').val().trim();
    if (title === "") {
      $('.results').css('display', 'none');
      $('.fail').css('display', 'block');
    } else {
      triggerSearch(title);
    }
  });

  // Click on Quick Suggestion Chips
  $(document).on('click', '.chip-btn', function() {
    var movieName = $(this).data('movie');
    if (movieName) {
      $('#autoComplete').val(movieName);
      $('.movie-button').attr('disabled', false);
      triggerSearch(movieName);
    }
  });
});

function triggerSearch(title) {
  var my_api_key = 'd47509337b8e8d779853e5b2a838c4db';
  load_details(my_api_key, title);
}

// Invoked when clicking on a recommended movie card
function recommendcard(e) {
  var my_api_key = 'd47509337b8e8d779853e5b2a838c4db';
  var title = e.getAttribute('title'); 
  if (title) {
    $('html, body').animate({ scrollTop: 0 }, 400);
    load_details(my_api_key, title);
  }
}

// Fetch basic movie details from TMDB API
function load_details(my_api_key, title) {
  $("#loader").css('display', 'flex').hide().fadeIn(250);
  $('.fail').fadeOut(200);

  $.ajax({
    type: 'GET',
    url: 'https://api.themoviedb.org/3/search/movie?api_key=' + my_api_key + '&query=' + encodeURIComponent(title),
    success: function(movie) {
      if (!movie.results || movie.results.length < 1) {
        $('.fail').fadeIn(300);
        $('.results').fadeOut(200);
        $("#loader").fadeOut(250);
      } else {
        var movie_id = movie.results[0].id;
        var movie_title = movie.results[0].original_title || movie.results[0].title;
        movie_recs(movie_title, movie_id, my_api_key);
      }
    },
    error: function() {
      $('.fail').fadeIn(300);
      $('.results').fadeOut(200);
      $("#loader").fadeOut(250);
    }
  });
}

// Request similarity recommendations from Flask backend
function movie_recs(movie_title, movie_id, my_api_key) {
  $.ajax({
    type: 'POST',
    url: "/similarity",
    data: { 'name': movie_title },
    success: function(recs) {
      if (!recs || recs.indexOf("Sorry!") !== -1) {
        $('.fail').fadeIn(300);
        $('.results').fadeOut(200);
        $("#loader").fadeOut(250);
      } else {
        $('.fail').fadeOut(200);
        var movie_arr = recs.split('---');
        var arr = [];
        for (var idx = 0; idx < movie_arr.length; idx++) {
          if (movie_arr[idx].trim()) {
            arr.push(movie_arr[idx].trim());
          }
        }
        get_movie_details(movie_id, my_api_key, arr, movie_title);
      }
    },
    error: function() {
      $('.fail').fadeIn(300);
      $('.results').fadeOut(200);
      $("#loader").fadeOut(250);
    }
  });
}

// Get full movie details with ID
function get_movie_details(movie_id, my_api_key, arr, movie_title) {
  $.ajax({
    type: 'GET',
    url: 'https://api.themoviedb.org/3/movie/' + movie_id + '?api_key=' + my_api_key,
    success: function(movie_details) {
      show_details(movie_details, arr, movie_title, my_api_key, movie_id);
    },
    error: function() {
      $('.fail').fadeIn(300);
      $("#loader").fadeOut(250);
    }
  });
}

// Compile all details and request sentiment scraping + render from Flask
function show_details(movie_details, arr, movie_title, my_api_key, movie_id) {
  var imdb_id = movie_details.imdb_id || '';
  var poster = movie_details.poster_path 
    ? 'https://image.tmdb.org/t/p/original' + movie_details.poster_path 
    : 'https://via.placeholder.com/260x390?text=No+Poster';
  var overview = movie_details.overview || 'No overview available.';
  var genres = movie_details.genres || [];
  var rating = movie_details.vote_average ? Number(movie_details.vote_average).toFixed(1) : 'N/A';
  var vote_count = movie_details.vote_count ? Number(movie_details.vote_count).toLocaleString() : '0';
  var release_date = movie_details.release_date ? new Date(movie_details.release_date).toDateString().split(' ').slice(1).join(' ') : 'Unknown';
  var runtimeVal = parseInt(movie_details.runtime) || 0;
  var status = movie_details.status || 'Released';
  
  var genre_list = [];
  for (var g in genres) {
    genre_list.push(genres[g].name);
  }
  var my_genre = genre_list.join(", ");

  var runtime = '';
  if (runtimeVal > 0) {
    if (runtimeVal % 60 === 0) {
      runtime = Math.floor(runtimeVal / 60) + " hr";
    } else {
      runtime = Math.floor(runtimeVal / 60) + " hr " + (runtimeVal % 60) + " min";
    }
  } else {
    runtime = 'N/A';
  }

  var arr_poster = get_movie_posters(arr, my_api_key);
  var movie_cast = get_movie_cast(movie_id, my_api_key);
  var ind_cast = get_individual_cast(movie_cast, my_api_key);

  var details = {
    'title': movie_title,
    'cast_ids': JSON.stringify(movie_cast.cast_ids),
    'cast_names': JSON.stringify(movie_cast.cast_names),
    'cast_chars': JSON.stringify(movie_cast.cast_chars),
    'cast_profiles': JSON.stringify(movie_cast.cast_profiles),
    'cast_bdays': JSON.stringify(ind_cast.cast_bdays),
    'cast_bios': JSON.stringify(ind_cast.cast_bios),
    'cast_places': JSON.stringify(ind_cast.cast_places),
    'imdb_id': imdb_id,
    'poster': poster,
    'genres': my_genre,
    'overview': overview,
    'rating': rating,
    'vote_count': vote_count,
    'release_date': release_date,
    'runtime': runtime,
    'status': status,
    'movie_id': movie_id,
    'rec_movies': JSON.stringify(arr),
    'rec_posters': JSON.stringify(arr_poster)
  };

  $.ajax({
    type: 'POST',
    data: details,
    url: "/recommend",
    dataType: 'html',
    complete: function() {
      $("#loader").fadeOut(300);
    },
    success: function(response) {
      $('#featuredSection').fadeOut(250);
      $('.results').html(response).fadeIn(350);
      $('#autoComplete').val('');
      $('.movie-button').attr('disabled', true);
      
      // Smooth scroll into results view
      $('html, body').animate({
        scrollTop: $('.results').offset().top - 20
      }, 500);
    },
    error: function() {
      $('.fail').fadeIn(300);
    }
  });
}

// Fetch individual actor details (biography, birthday, birthplace)
function get_individual_cast(movie_cast, my_api_key) {
  var cast_bdays = [];
  var cast_bios = [];
  var cast_places = [];
  for (var i = 0; i < movie_cast.cast_ids.length; i++) {
    $.ajax({
      type: 'GET',
      url: 'https://api.themoviedb.org/3/person/' + movie_cast.cast_ids[i] + '?api_key=' + my_api_key,
      async: false,
      success: function(cast_details) {
        var bday = cast_details.birthday ? (new Date(cast_details.birthday)).toDateString().split(' ').slice(1).join(' ') : 'Not Available';
        cast_bdays.push(bday);
        cast_bios.push(cast_details.biography || 'Biography not available.');
        cast_places.push(cast_details.place_of_birth || 'Not Available');
      },
      error: function() {
        cast_bdays.push('Not Available');
        cast_bios.push('Biography not available.');
        cast_places.push('Not Available');
      }
    });
  }
  return { cast_bdays: cast_bdays, cast_bios: cast_bios, cast_places: cast_places };
}

// Fetch top cast list
function get_movie_cast(movie_id, my_api_key) {
  var cast_ids = [];
  var cast_names = [];
  var cast_chars = [];
  var cast_profiles = [];

  $.ajax({
    type: 'GET',
    url: "https://api.themoviedb.org/3/movie/" + movie_id + "/credits?api_key=" + my_api_key,
    async: false,
    success: function(my_movie) {
      if (my_movie && my_movie.cast) {
        var limit = Math.min(my_movie.cast.length, 8);
        for (var i = 0; i < limit; i++) {
          var c = my_movie.cast[i];
          cast_ids.push(c.id);
          cast_names.push(c.name || 'Unknown');
          cast_chars.push(c.character || 'Actor');
          var profileUrl = c.profile_path 
            ? "https://image.tmdb.org/t/p/original" + c.profile_path 
            : "https://via.placeholder.com/240x360?text=No+Photo";
          cast_profiles.push(profileUrl);
        }
      }
    },
    error: function() {
      // Graceful fallback
    }
  });

  return { cast_ids: cast_ids, cast_names: cast_names, cast_chars: cast_chars, cast_profiles: cast_profiles };
}

// Fetch posters for recommended movies
function get_movie_posters(arr, my_api_key) {
  var arr_poster_list = [];
  for (var i = 0; i < arr.length; i++) {
    $.ajax({
      type: 'GET',
      url: 'https://api.themoviedb.org/3/search/movie?api_key=' + my_api_key + '&query=' + encodeURIComponent(arr[i]),
      async: false,
      success: function(m_data) {
        if (m_data && m_data.results && m_data.results.length > 0 && m_data.results[0].poster_path) {
          arr_poster_list.push('https://image.tmdb.org/t/p/original' + m_data.results[0].poster_path);
        } else {
          arr_poster_list.push('https://via.placeholder.com/240x360?text=No+Poster');
        }
      },
      error: function() {
        arr_poster_list.push('https://via.placeholder.com/240x360?text=No+Poster');
      }
    });
  }
  return arr_poster_list;
}
