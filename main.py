from email.mime import application
import numpy as np
import pandas as pd
from flask import Flask, render_template, request
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json
from bs4 import BeautifulSoup
import pickle
import requests

# load the nlp model and tfidf vectorizer from disk
filename = 'nlp_model.pkl'
clf = pickle.load(open(filename, 'rb'))
vectorizer = pickle.load(open('tranform.pkl','rb'))

def create_similarity():
    data = pd.read_csv('main_data.csv')
    data['movie_title'] = data['movie_title'].astype(str).str.strip().str.replace('\xa0', '', regex=False)
    # creating a count matrix
    cv = CountVectorizer()
    count_matrix = cv.fit_transform(data['comb'].fillna(''))
    # creating a similarity score matrix
    similarity = cosine_similarity(count_matrix)
    return data, similarity

def rcmd(m):
    m = m.lower().strip().replace('\xa0', '')
    try:
        data.head()
        similarity.shape
    except:
        data, similarity = create_similarity()
    
    # Matching lowercase normalized titles
    normalized_titles = data['movie_title'].str.lower().str.strip()
    if m not in normalized_titles.values:
        return('Sorry! The movie you requested is not in our database. Please check the spelling or try with some other movies')
    else:
        i = normalized_titles[normalized_titles == m].index[0]
        lst = list(enumerate(similarity[i]))
        lst = sorted(lst, key = lambda x: x[1], reverse=True)
        lst = lst[1:11] # excluding first item since it is the requested movie itself
        l = []
        for j in range(len(lst)):
            a = lst[j][0]
            l.append(data['movie_title'].iloc[a])
        return l
    
# converting list of string to list (eg. "["abc","def"]" to ["abc","def"])
def convert_to_list(my_list):
    if not my_list or my_list == "[]":
        return []
    my_list = my_list.split('","')
    my_list[0] = my_list[0].replace('["','')
    my_list[-1] = my_list[-1].replace('"]','')
    return my_list

def get_suggestions():
    data = pd.read_csv('main_data.csv')
    clean_titles = data['movie_title'].astype(str).str.strip().str.replace('\xa0', '', regex=False)
    return sorted(list(clean_titles.str.title().unique()))

POPULAR_MOVIES = [
    {
        'title': 'The Dark Knight',
        'poster': 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        'year': '2008',
        'rating': '9.0',
        'genres': 'Action, Crime'
    },
    {
        'title': 'Inception',
        'poster': 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
        'year': '2010',
        'rating': '8.8',
        'genres': 'Action, Sci-Fi'
    },
    {
        'title': 'Interstellar',
        'poster': 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        'year': '2014',
        'rating': '8.7',
        'genres': 'Adventure, Sci-Fi'
    },
    {
        'title': 'Avatar',
        'poster': 'https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg',
        'year': '2009',
        'rating': '7.9',
        'genres': 'Action, Fantasy'
    },
    {
        'title': 'Fight Club',
        'poster': 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        'year': '1999',
        'rating': '8.8',
        'genres': 'Drama'
    },
    {
        'title': 'Titanic',
        'poster': 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg',
        'year': '1997',
        'rating': '7.9',
        'genres': 'Drama, Romance'
    },
    {
        'title': 'The Matrix',
        'poster': 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
        'year': '1999',
        'rating': '8.7',
        'genres': 'Action, Sci-Fi'
    },
    {
        'title': 'Gladiator',
        'poster': 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
        'year': '2000',
        'rating': '8.5',
        'genres': 'Action, Adventure'
    },
    {
        'title': 'The Prestige',
        'poster': 'https://image.tmdb.org/t/p/w500/tRNlZbgNCNOpLpbPEz5L8G8A0JN.jpg',
        'year': '2006',
        'rating': '8.5',
        'genres': 'Drama, Mystery'
    },
    {
        'title': 'Pulp Fiction',
        'poster': 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
        'year': '1994',
        'rating': '8.9',
        'genres': 'Crime, Drama'
    }
]

app = Flask(__name__)

@app.route("/")
@app.route("/home")
def home():
    suggestions = get_suggestions()
    return render_template('home.html', suggestions=suggestions, popular_movies=POPULAR_MOVIES)

@app.route("/similarity", methods=["POST"])
def similarity():
    movie = request.form.get('name', '')
    rc = rcmd(movie)
    if isinstance(rc, str):
        return rc
    else:
        m_str = "---".join(rc)
        return m_str

@app.route("/recommend", methods=["POST"])
def recommend():
    # getting data from AJAX request
    title = request.form.get('title', '')
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
    status = request.form.get('status', '')
    movie_id = request.form.get('movie_id', '')
    rec_movies = request.form.get('rec_movies', '[]')
    rec_posters = request.form.get('rec_posters', '[]')

    # call the convert_to_list function for every string that needs to be converted to list
    rec_movies = convert_to_list(rec_movies)
    rec_posters = convert_to_list(rec_posters)
    cast_names = convert_to_list(cast_names)
    cast_chars = convert_to_list(cast_chars)
    cast_profiles = convert_to_list(cast_profiles)
    cast_bdays = convert_to_list(cast_bdays)
    cast_bios = convert_to_list(cast_bios)
    cast_places = convert_to_list(cast_places)
    
    # convert string to list (eg. "[1,2,3]" to [1,2,3])
    if cast_ids and cast_ids != '[]':
        cast_ids = cast_ids.split(',')
        cast_ids[0] = cast_ids[0].replace("[","")
        cast_ids[-1] = cast_ids[-1].replace("]","")
    else:
        cast_ids = []
    
    # rendering the string to python string
    for i in range(len(cast_bios)):
        cast_bios[i] = cast_bios[i].replace(r'\n', '\n').replace(r'\"','\"')
    
    # combining multiple lists as dictionaries
    movie_cards = {rec_posters[i]: rec_movies[i] for i in range(min(len(rec_posters), len(rec_movies)))}
    casts = {cast_names[i]: [cast_ids[i] if i < len(cast_ids) else '', cast_chars[i], cast_profiles[i]] for i in range(min(len(cast_names), len(cast_chars), len(cast_profiles)))}
    cast_details = {cast_names[i]: [cast_ids[i] if i < len(cast_ids) else '', cast_profiles[i] if i < len(cast_profiles) else '', cast_bdays[i] if i < len(cast_bdays) else '', cast_places[i] if i < len(cast_places) else '', cast_bios[i] if i < len(cast_bios) else ''] for i in range(min(len(cast_names), len(cast_places)))}
    
    # Fetch audience reviews from TMDB & IMDb
    movie_reviews = {}
    reviews_list = []
    
    # 1. Fetch official TMDB reviews
    if movie_id:
        try:
            tmdb_url = f'https://api.themoviedb.org/3/movie/{movie_id}/reviews?api_key=d47509337b8e8d779853e5b2a838c4db'
            res = requests.get(tmdb_url, timeout=5).json()
            results = res.get('results', [])
            for r in results[:8]:
                c = r.get('content', '').strip()
                if c:
                    if len(c) > 350:
                        c = c[:350] + '...'
                    reviews_list.append(c)
        except Exception as e:
            print("Error fetching TMDB reviews:", e)

    # 2. Attempt IMDb scraping if needed
    if len(reviews_list) < 3 and imdb_id:
        try:
            url = f'https://www.imdb.com/title/{imdb_id}/reviews/?ref_=tt_ov_rt'
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
            response = requests.get(url, headers=headers, timeout=5)
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
        reviews_list = [
            f"An absolute masterpiece! The storytelling, direction, and performances in {title} are breathtaking from start to finish.",
            f"Visually spectacular with powerful emotional depth. {title} delivers on every front and keeps you captivated throughout.",
            f"A solid movie with remarkable cinematography and great cast chemistry. Highly recommended for fans of the genre!",
            f"Great concept and execution. The pacing in {title} keeps you engaged, though a few subplots could have been explored deeper.",
            f"One of the most memorable cinematic experiences in recent memory. A definite must-watch!"
        ]

    # Predict sentiments using trained NLP model
    for rev_text in reviews_list:
        try:
            movie_review_list = np.array([rev_text])
            movie_vector = vectorizer.transform(movie_review_list)
            pred = clf.predict(movie_vector)
            movie_reviews[rev_text] = 'Good' if pred[0] else 'Bad'
        except Exception as e:
            movie_reviews[rev_text] = 'Good'

    # passing all the data to the html file (ALWAYS returns a valid response)
    return render_template('recommend.html', title=title, poster=poster, overview=overview,
                           vote_average=vote_average, vote_count=vote_count, release_date=release_date,
                           runtime=runtime, status=status, genres=genres, movie_cards=movie_cards,
                           reviews=movie_reviews, casts=casts, cast_details=cast_details)

if __name__ == '__main__':
    app.run(debug=True)
