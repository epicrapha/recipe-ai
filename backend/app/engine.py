"""
ML inference engine for recipe recommendations.
Loads Word2Vec, PCA, KMeans, bigram model and search index.
Provides ingredient-based recipe recommendation via cosine similarity.
"""

import os
import pickle
import time
from typing import Optional

import joblib
import numpy as np
from gensim.models import KeyedVectors


MODEL_DIR = os.environ.get("MODEL_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "recipe_model"))

WORD2VEC_PATH = os.path.join(MODEL_DIR, "recipe_engine.kv")
KMEANS_PATH = os.path.join(MODEL_DIR, "recipe_clusterer.joblib")
PCA_PATH = os.path.join(MODEL_DIR, "recipe_pca.joblib")
BIGRAM_PATH = os.path.join(MODEL_DIR, "bigram_model.pkl")
SEARCH_INDEX_PATH = os.path.join(MODEL_DIR, "recipe_search_index.npy")
COMPRESSED_INDEX_PATH = os.path.join(MODEL_DIR, "search_index_f16.npz")


class RecipeEngine:
    """Encapsulates the full inference pipeline."""

    def __init__(self):
        self.wv: Optional[KeyedVectors] = None
        self.kmeans = None
        self.pca = None
        self.bigram = None
        self.search_index: Optional[np.ndarray] = None
        self._loaded = False

    def load(self) -> None:
        """Load all models into memory. Call once at startup."""
        if self._loaded:
            return

        start = time.time()
        print("[engine] Loading models...")

        # Word2Vec keyed vectors
        print("  - Word2Vec...")
        self.wv = KeyedVectors.load(WORD2VEC_PATH, mmap="r")

        # KMeans clusterer
        print("  - KMeans...")
        self.kmeans = joblib.load(KMEANS_PATH)
        if not hasattr(self.kmeans, "_n_threads"):
            self.kmeans._n_threads = 1

        # PCA reducer
        print("  - PCA...")
        self.pca = joblib.load(PCA_PATH)

        # Bigram phraser
        print("  - Bigram model...")
        with open(BIGRAM_PATH, "rb") as f:
            self.bigram = pickle.load(f)

        # Search index — prefer compressed version
        if os.path.exists(COMPRESSED_INDEX_PATH):
            print("  - Search index (compressed)...")
            data = np.load(COMPRESSED_INDEX_PATH)
            self.search_index = data["index"].astype(np.float32)
        elif os.path.exists(SEARCH_INDEX_PATH):
            print("  - Search index (raw)...")
            self.search_index = np.load(SEARCH_INDEX_PATH).astype(np.float32)
        else:
            raise FileNotFoundError("No search index found. Run prepare_data.py first.")

        self._loaded = True
        elapsed = time.time() - start
        print(f"[engine] All models loaded in {elapsed:.1f}s")
        print(f"  Index shape: {self.search_index.shape}")

    def _tokenize(self, ingredients: list[str]) -> list[str]:
        """Tokenize and apply bigram model to ingredient list."""
        tokens = []
        for ingredient in ingredients:
            words = ingredient.lower().strip().split()
            tokens.extend(words)

        # Apply bigram
        if self.bigram is not None:
            tokens = list(self.bigram[tokens])

        return tokens

    def _embed(self, tokens: list[str]) -> np.ndarray:
        """Convert tokens to a mean Word2Vec vector."""
        vecs = [self.wv[t] for t in tokens if t in self.wv]
        if not vecs:
            return np.zeros(self.wv.vector_size, dtype=np.float32)
        return np.mean(vecs, axis=0).astype(np.float32)

    def recommend(
        self,
        ingredients: list[str],
        top_n: int = 20,
        cluster_filter: Optional[int] = None,
    ) -> list[dict]:
        """
        Given a list of ingredient strings, return top-N recipe recommendations.

        Returns list of dicts: [{ "recipe_id": int, "score": float, "cluster": int }]
        Recipe IDs are 1-indexed (matching SQLite AUTOINCREMENT).
        """
        if not self._loaded:
            raise RuntimeError("Engine not loaded. Call engine.load() first.")

        # Tokenize → embed → PCA
        tokens = self._tokenize(ingredients)
        if not tokens:
            return []

        vec_100d = self._embed(tokens)
        vec_50d = self.pca.transform(vec_100d.reshape(1, -1))[0]

        # Predict cluster
        cluster = int(self.kmeans.predict(vec_50d.reshape(1, -1))[0])

        # Cosine similarity against the full search index (100D, pre-PCA)
        query = vec_100d.reshape(1, -1)
        index = self.search_index

        # Normalize for cosine sim
        query_norm = query / (np.linalg.norm(query, axis=1, keepdims=True) + 1e-10)
        index_norm = index / (np.linalg.norm(index, axis=1, keepdims=True) + 1e-10)

        scores = (index_norm @ query_norm.T).flatten()

        # Optional cluster filter
        if cluster_filter is not None:
            # We'd need cluster labels for all recipes — skip for now
            pass

        # Top-N
        top_indices = np.argsort(scores)[::-1][:top_n]

        results = []
        for idx in top_indices:
            results.append({
                "recipe_id": int(idx) + 1,  # 1-indexed for SQLite
                "score": float(scores[idx]),
                "cluster": cluster,
            })

        return results

    def get_similar(self, recipe_id: int, top_n: int = 10) -> list[dict]:
        """Find recipes similar to a given recipe by its index in the search array."""
        if not self._loaded:
            raise RuntimeError("Engine not loaded.")

        idx = recipe_id - 1  # Convert to 0-indexed
        if idx < 0 or idx >= len(self.search_index):
            return []

        query = self.search_index[idx].reshape(1, -1)
        query_norm = query / (np.linalg.norm(query, axis=1, keepdims=True) + 1e-10)
        index_norm = self.search_index / (np.linalg.norm(self.search_index, axis=1, keepdims=True) + 1e-10)

        scores = (index_norm @ query_norm.T).flatten()
        top_indices = np.argsort(scores)[::-1][1 : top_n + 1]  # Skip self

        cluster = int(self.kmeans.predict(
            self.pca.transform(self.search_index[idx].reshape(1, -1))
        )[0])

        return [
            {
                "recipe_id": int(i) + 1,
                "score": float(scores[i]),
                "cluster": cluster,
            }
            for i in top_indices
        ]


# Singleton
engine = RecipeEngine()
