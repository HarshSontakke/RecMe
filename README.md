# Content-Based Movie Recommender System with Sentiment Analysis

A full-stack machine learning application that recommends movies similar to a user's choice and performs sentiment analysis on user reviews.

---

## 📌 Project Overview

This application serves two primary functions:
1. **Movie Recommendation:** Suggests movies similar to the user's search using content-based filtering and Cosine Similarity.
2. **Sentiment Analysis:** Scrapes user reviews from IMDB using BeautifulSoup and runs NLP models to classify reviews as positive or negative.

Movie metadata (title, poster, genre, runtime, rating, cast) is dynamically fetched in real time using the TMDB API.

---

## 🛠️ Tech Stack & Tools

* **Frontend:** HTML5, CSS3, JavaScript, AJAX
* **Backend:** Python (Flask)
* **Machine Learning & NLP:** Scikit-learn, Pandas, NumPy, NLTK
* **Web Scraping:** BeautifulSoup4, Requests
* **External API:** TMDB (The Movie Database) API

---

## 📐 Architecture & How It Works

### **1. Cosine Similarity (Recommendation Engine)**
Cosine similarity measures the similarity between two text vectors in a multi-dimensional space regardless of document size. By calculating the cosine angle between movie feature vectors (genres, keywords, cast, and crew), the engine determines how closely two movies relate on a scale of 0 to 1.

$$\text{Similarity} = \cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$

### **2. Sentiment Analysis (Web Scraping + NLP)**
* Scrapes user reviews from IMDB using BeautifulSoup based on the movie's IMDB ID.
* Preprocesses review text (tokenization, stop-word removal, vectorization).
* Classifies sentiment to provide an aggregate user satisfaction rating alongside recommendations.

---

## 🚀 How to Run the Project

### **1. Prerequisites**
Ensure you have Python installed on your system along with `pip`.

### **2. Clone the Repository**
```bash
git clone [https://github.com/HarshSontakke/Movie-Recommendation-System.git](https://github.com/HarshSontakke/Movie-Recommendation-System.git)
cd Movie-Recommendation-System
