# RecipeAI: A Scalable, Machine Learning-Powered Recipe Recommendation Engine

## Abstract
This document provides an in-depth analysis of the methodologies and technical specifications behind **RecipeAI**, a full-stack, production-grade recipe recommendation system. By leveraging Natural Language Processing (NLP), unsupervised machine learning, and high-performance vector operations, RecipeAI bridges the gap between available pantry ingredients and culinary discovery. The architecture utilizes a decoupled paradigm, pairing a high-performance Python FastAPI backend with a modern, responsive React frontend. This separation of concerns ensures scalability, maintainability, and a seamless user experience capable of querying over 2.2 million recipes in milliseconds.

---

## 1. Introduction
With the proliferation of digital culinary content, finding a suitable dish based on a specific, often arbitrary, set of ingredients presents a complex search and retrieval challenge. Traditional keyword-based search algorithms often fail because they lack semantic understanding (e.g., failing to recognize that "butter," "ghee," and "margarine" share similar culinary roles). 

RecipeAI circumvents this limitation by transforming recipes into dense mathematical vectors (embeddings) and organizing them using clustering algorithms. This approach shifts the paradigm from simple string matching to mathematically rigorous similarity searches across a multi-dimensional continuous vector space.

---

## 2. Machine Learning Methodology
The core intelligence of RecipeAI resides in its Machine Learning pipeline, originally developed in a Jupyter Notebook environment before being exported as serialized models for production inference.

### 2.1. Text Preprocessing and Tokenization
Raw recipe ingredients inherently contain significant noise (e.g., "2 cups of thinly sliced, free-range chicken breast"). To extract the semantic core, the pipeline utilizes the `spaCy` NLP library (specifically the `en_core_web_sm` model) to execute:
- **Lowercasing and Stripping:** Normalizing text to a uniform format.
- **Stop-word Removal:** Filtering out common, non-descriptive syntax and measurement units (e.g., "cups", "tablespoons", "of").
- **Lemmatization:** Converting words to their morphological base form (e.g., "sliced" to "slice", "tomatoes" to "tomato"), reducing the vocabulary size without losing semantic meaning.

### 2.2. Bigram Collocation Extraction
Many culinary terms lose their distinct meaning when split into unigrams (e.g., "olive oil" vs. "olive" and "oil", "soy sauce" vs "soy" and "sauce"). The system employs a **Bigram Model** using `gensim.models.Phrases` to detect statistically significant co-occurring words and bind them into single tokens (e.g., `olive_oil`). This collocation extraction is crucial for preserving semantic integrity prior to vectorization.

### 2.3. Continuous Bag-of-Words (CBOW) Word2Vec Embedding
To capture the contextual and functional relationships between ingredients, the system trains a **Word2Vec** model. 
- The model projects ingredients into a **100-dimensional continuous vector space**. 
- Using the CBOW architecture, the model learns to predict a target ingredient based on its context within a recipe. Consequently, ingredients that are frequently used together or serve similar purposes are positioned closer together in the vector space.
- A single recipe is mathematically represented as the **mean average** of its constituent ingredient vectors. This results in a single 100D vector that accurately encapsulates the recipe's entire culinary profile.

### 2.4. Dimensionality Reduction (PCA)
Operating directly on 100D vectors for clustering can lead to inefficiencies and the "curse of dimensionality." The 100D recipe vectors are passed through **Principal Component Analysis (PCA)** to reduce the dimensionality to **50 dimensions**. This transformation retains the maximum possible variance while stripping out noise, significantly accelerating the clustering algorithm and reducing memory overhead.

### 2.5. K-Means Clustering and Initialization
The 50D reduced vectors are fed into a **K-Means clustering algorithm** (`scikit-learn`). 
- Using the **k-means++** initialization strategy for optimal centroid placement, the model groups the 2.2 million recipes into distinct clusters representing broad culinary themes (e.g., baked goods, savory Asian dishes, sweet desserts).
- This clustering enables the "Explore" feature, allowing users to browse recipes by thematic similarity, expanding the utility of the application beyond direct search.

---

## 3. Data Engineering & Search Infrastructure

### 3.1. The Data Preparation Pipeline (ETL)
Processing a 2.1GB raw CSV file containing millions of rows is unfeasible for real-time cloud environments due to strict memory constraints. The `prepare_data.py` script functions as a critical ETL (Extract, Transform, Load) pipeline:
1. **SQLite Database Construction:** The script parses the massive CSV, cleans JSON strings representing ingredients and directions, and inserts them into an indexed SQLite database (`recipes.db`). This strategy allows the backend to perform extremely fast `O(log N)` primary key lookups, bypassing the need to keep human-readable text in RAM.
2. **Float16 Index Compression:** The raw 100D search index (which requires nearly 2GB of RAM as float32) is downcast and compressed into a `.npz` file using `float16` precision. This drastically reduces the memory footprint to ~30MB, making the application highly deployable on free-tier or memory-constrained cloud hosting.

### 3.2. Optimized Cosine Similarity Search
When a user requests a recommendation, the inference engine (`engine.py`) executes the following operations:
1. Tokenizes and embeds the user's input ingredients into a unified 100D query vector.
2. Calculates the **Cosine Similarity** between the query vector and the entire compressed 100D recipe index matrix. This is achieved via highly optimized NumPy matrix multiplication, utilizing vector norms to ensure scale invariance.
3. Sorts the resulting similarity scores via `np.argsort` to retrieve the top `N` highest-scoring recipe IDs.
4. Queries the SQLite database using these IDs to fetch the human-readable recipe details for the frontend.

---

## 4. Backend System Architecture

RecipeAI utilizes a highly optimized Python backend tailored for machine learning inference.

### 4.1. FastAPI and Asynchronous Execution
- **Framework:** `FastAPI` combined with the `Uvicorn` ASGI server provides high throughput.
- **Lifecycle Management:** Machine learning models (Word2Vec, PCA, KMeans, and the Numpy Index) are computationally expensive to load. They are loaded into memory exactly once during the application's startup phase using the `@asynccontextmanager lifespan` hook, ensuring zero latency overhead during actual user requests.
- **CORS and Middleware:** Configured with robust `CORSMiddleware` to accept cross-origin requests specifically from the frontend environments, ensuring security while maintaining interoperability.
- **Dependency Handling and Validation:** Utilizes `Pydantic` models (e.g., `RecommendRequest`, `RecommendResponse`) to automatically validate incoming JSON payloads, ensuring the ML engine only receives clean, typed data.

---

## 5. Frontend Architecture and UI/UX Design

The frontend is designed to be as responsive and engaging as the backend is powerful.

### 5.1. Component Ecosystem and State Management
- **Framework:** React 19 built with Vite for rapid Hot Module Replacement (HMR) and optimized production builds.
- **State Management:** Employs `@tanstack/react-query` for asynchronous data fetching. This abstracts away loading states, handles request deduplication, and provides seamless caching mechanisms.
- **Routing:** Handled via `react-router-dom`, providing a Single Page Application (SPA) experience with client-side routing.

### 5.2. UI Design and "Intentional Minimalism"
- **Design System:** Built using **Tailwind CSS v4** and **Shadcn UI** component primitives.
- **Aesthetic Philosophy:** The application employs an "Intentional Minimalism" design language. It utilizes an Avant-Garde dark mode, glassmorphism (`backdrop-blur`) effects, and vibrant saffron/amber accents to create a premium, immersive user experience.
- **Perceived Performance:** Integrates UI skeleton loaders (`Skeleton` components) during network requests to prevent layout shift and improve perceived performance while the backend computes vector similarities.

---

## 6. Challenges and Technical Resolutions

### 6.1. Scikit-Learn Version Compatibility
During development, a critical failure occurred when unpickling the `KMeans` and `PCA` models. The models were originally trained and serialized (`joblib.dump`) using `scikit-learn` version `1.6.1`. When the production environment installed version `1.8.0`, structural changes to the internal class attributes (specifically the `_n_threads` attribute) caused a fatal `AttributeError` during inference. 
**Resolution:** The virtual environment was strictly pinned to `scikit-learn==1.6.1` to ensure perfect serialization compatibility, highlighting the importance of immutable dependency locking in ML deployments.

---

## 7. Conclusion and Future Scope
RecipeAI represents a robust intersection of modern web development and applied data science. By utilizing an optimized ETL pipeline, a decoupled FastAPI/React architecture, and a sophisticated NLP/K-Means inference engine, the system successfully categorizes and searches over 2 million recipes with sub-second latency. 

**Future Scope:**
- Integration of a user authentication system to save favorite recipes.
- Fine-tuning the Word2Vec embeddings using larger, domain-specific culinary datasets.
- Implementing dynamic, incremental updates to the SQLite database without requiring a full ETL pipeline rebuild.
