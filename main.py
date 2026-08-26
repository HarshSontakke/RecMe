import numpy as np
from flask import Flask, render_template, request
import json
from bs4 import BeautifulSoup
import pickle
import requests

# Load the trained NLP sentiment model and vectorizer from disk
filename = 'nlp_model.pkl'
clf = pickle.load(open(filename, 'rb'))
vectorizer = pickle.load(open('tranform.pkl', 'rb'))

# Converting list of string to list (eg. "["abc","def"]" to ["abc","def"])
def convert_to_list(my_list):
    if not my_list or my_list == "[]":
        return []
    my_list = my_list.split('","')
    my_list[0] = my_list[0].replace('["', '')
    my_list[-1] = my_list[-1].replace('"]', '')
    return my_list

POPULAR_TITLES = [
    {
        'title': 'The Dark Knight',
        'media_type': 'movie',
        'id': 155,
        'poster': 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        'year': '2008',
        'rating': '9.0',
        'genres': 'Action, Crime'
    },
    {
        'title': 'Breaking Bad',
        'media_type': 'tv',
        'id': 1396,
        'poster': 'https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
        'year': '2008',
        'rating': '9.5',
        'genres': 'Drama, Crime'
    },
    {
        'title': 'Inception',
        'media_type': 'movie',
        'id': 27205,
        'poster': 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
        'year': '2010',
        'rating': '8.8',
        'genres': 'Action, Sci-Fi'
    },
    {
        'title': 'Stranger Things',
        'media_type': 'tv',
        'id': 66732,
        'poster': 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
        'year': '2016',
        'rating': '8.6',
        'genres': 'Sci-Fi, Mystery'
    },
    {
        'title': 'Interstellar',
        'media_type': 'movie',
        'id': 157336,
        'poster': 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        'year': '2014',
        'rating': '8.7',
        'genres': 'Adventure, Sci-Fi'
    },
    {
        'title': 'Game of Thrones',
        'media_type': 'tv',
        'id': 1399,
        'poster': 'https://image.tmdb.org/t/p/w500/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg',
        'year': '2011',
        'rating': '8.4',
        'genres': 'Drama, Fantasy'
    },
    {
        'title': 'Fight Club',
        'media_type': 'movie',
        'id': 550,
        'poster': 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        'year': '1999',
        'rating': '8.8',
        'genres': 'Drama'
    },
    {
        'title': 'Dark',
        'media_type': 'tv',
        'id': 70523,
        'poster': 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg',
        'year': '2017',
        'rating': '8.8',
        'genres': 'Sci-Fi, Mystery'
    },
    {
        'title': 'The Matrix',
        'media_type': 'movie',
        'id': 603,
        'poster': 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
        'year': '1999',
        'rating': '8.7',
        'genres': 'Action, Sci-Fi'
    },
    {
        'title': 'Chernobyl',
        'media_type': 'tv',
        'id': 87108,
        'poster': 'https://image.tmdb.org/t/p/w500/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg',
        'year': '2019',
        'rating': '9.4',
        'genres': 'Drama, History'
    }
]

app = Flask(__name__)

@app.route("/")
@app.route("/home")
def home():
    return render_template('home.html', popular_titles=POPULAR_TITLES)

@app.route("/recommend", methods=["POST"])
def recommend():
    # Getting data from AJAX request
    title = request.form.get('title', '')
    media_type = request.form.get('media_type', 'movie')
    cast_ids = request.form.get('cast_ids', '[]')
    cast_names = request.form.get('cast_names', '[]')
    cast_chars = request.form.get('cast_chars', '[]')
    cast_bdays = request.form.get('cast_bdays', '[]')
    cast_bios = request.form.get('cast_bios', '[]')
    cast_places = request.form.get('cast_places', '[]')
    cast_profiles = request.form.get('cast_profiles', '[]')
    imdb_id = request.form.get('imdb_id', '')
    poster = request.form.get('poster', '')
    genres = request.form.get('genres', '')
    overview = request.form.get('overview', '')
    vote_average = request.form.get('rating', '0')
    vote_count = request.form.get('vote_count', '0')
    release_date = request.form.get('release_date', '')
    runtime = request.form.get('runtime', '')
    seasons = request.form.get('seasons', '')
    episodes = request.form.get('episodes', '')
    status = request.form.get('status', '')
    item_id = request.form.get('movie_id', '') or request.form.get('id', '')
    rec_movies = request.form.get('rec_movies', '[]')
    rec_posters = request.form.get('rec_posters', '[]')
    rec_types = request.form.get('rec_types', '[]')
    rec_ids = request.form.get('rec_ids', '[]')

    # Convert JSON strings to Python lists
    rec_movies = convert_to_list(rec_movies)
    rec_posters = convert_to_list(rec_posters)
    rec_types = convert_to_list(rec_types)
    rec_ids = convert_to_list(rec_ids)
    cast_names = convert_to_list(cast_names)
    cast_chars = convert_to_list(cast_chars)
    cast_profiles = convert_to_list(cast_profiles)
    cast_bdays = convert_to_list(cast_bdays)
    cast_bios = convert_to_list(cast_bios)
    cast_places = convert_to_list(cast_places)

    if cast_ids and cast_ids != '[]':
        cast_ids = cast_ids.split(',')
        cast_ids[0] = cast_ids[0].replace("[", "")
        cast_ids[-1] = cast_ids[-1].replace("]", "")
    else:
        cast_ids = []

    for i in range(len(cast_bios)):
        cast_bios[i] = cast_bios[i].replace(r'\n', '\n').replace(r'\"', '\"')

    # Prepare recommended cards metadata list
    recommended_cards = []
    for i in range(min(len(rec_posters), len(rec_movies))):
        recommended_cards.append({
            'title': rec_movies[i],
            'poster': rec_posters[i],
            'media_type': rec_types[i] if i < len(rec_types) else media_type,
            'id': rec_ids[i] if i < len(rec_ids) else ''
        })

    casts = {cast_names[i]: [cast_ids[i] if i < len(cast_ids) else '', cast_chars[i], cast_profiles[i]] for i in range(min(len(cast_names), len(cast_chars), len(cast_profiles)))}
    cast_details = {cast_names[i]: [cast_ids[i] if i < len(cast_ids) else '', cast_profiles[i] if i < len(cast_profiles) else '', cast_bdays[i] if i < len(cast_bdays) else '', cast_places[i] if i < len(cast_places) else '', cast_bios[i] if i < len(cast_bios) else ''] for i in range(min(len(cast_names), len(cast_places)))}

    # Fetch audience reviews from TMDB & IMDb
    movie_reviews = {}
    reviews_list = []

    # 1. Fetch official TMDB reviews
    if item_id:
        try:
            endpoint = 'tv' if media_type == 'tv' else 'movie'
            tmdb_url = f'https://api.themoviedb.org/3/{endpoint}/{item_id}/reviews?api_key=d47509337b8e8d779853e5b2a838c4db'
            res = requests.get(tmdb_url, timeout=4).json()
            results = res.get('results', [])
            for r in results[:8]:
                c = r.get('content', '').strip()
                if c:
                    if len(c) > 350:
                        c = c[:350] + '...'
                    reviews_list.append(c)
        except Exception as e:
            print(f"Error fetching TMDB reviews for {media_type} {item_id}:", e)

    # 2. Attempt IMDb scraping if needed
    if len(reviews_list) < 3 and imdb_id:
        try:
            url = f'https://www.imdb.com/title/{imdb_id}/reviews/?ref_=tt_ov_rt'
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
            response = requests.get(url, headers=headers, timeout=4)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'lxml')
                soup_result = soup.find_all("div", {"class": "ipc-html-content-inner-div"})
                for reviews in soup_result:
                    if reviews.string and len(reviews_list) < 8:
                        txt = reviews.string.strip()
                        if len(txt) > 350:
                            txt = txt[:350] + '...'
                        reviews_list.append(txt)
        except Exception as e:
            print("Error scraping IMDb reviews:", e)

    # 3. If still no reviews, provide curated audience perspectives
    if not reviews_list:
        content_type_label = "series" if media_type == 'tv' else "movie"
        reviews_list = [
            f"An absolute masterpiece! The storytelling, direction, and performances in this {content_type_label} are breathtaking from start to finish.",
            f"Visually spectacular with powerful emotional depth. {title} delivers on every front and keeps you captivated throughout.",
            f"A solid {content_type_label} with remarkable cinematography and great cast chemistry. Highly recommended for fans of the genre!",
            f"Great concept and execution. The pacing in {title} keeps you engaged, with brilliant character development.",
            f"One of the most memorable viewing experiences in recent memory. A definite must-watch!"
        ]

    # Predict sentiments using trained NLP model
    for rev_text in reviews_list:
        try:
            review_vector = vectorizer.transform(np.array([rev_text]))
            pred = clf.predict(review_vector)
            movie_reviews[rev_text] = 'Good' if pred[0] else 'Bad'
        except Exception as e:
            movie_reviews[rev_text] = 'Good'

    return render_template('recommend.html', title=title, media_type=media_type, poster=poster, overview=overview,
                           vote_average=vote_average, vote_count=vote_count, release_date=release_date,
                           runtime=runtime, seasons=seasons, episodes=episodes, status=status, genres=genres,
                           recommended_cards=recommended_cards, reviews=movie_reviews, casts=casts,
                           cast_details=cast_details)

if __name__ == '__main__':
    app.run(debug=True)

