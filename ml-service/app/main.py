from __future__ import annotations

import logging
import os
import uuid
from collections import deque
from typing import Deque, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from river import compose, linear_model, preprocessing
from sentence_transformers import SentenceTransformer


logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class AlertValue(BaseModel):
  label: str
  value: float


class AlertPayload(BaseModel):
  type: str
  pt: float
  alert: AlertValue
  timestamp: Optional[str] = None


class DecisionRequest(BaseModel):
  alert: AlertPayload


class DecisionResponse(BaseModel):
  sample_id: str
  decision: str
  score: float
  fallback: bool = False
  vector: List[float]
  suggested_speed_kmh: float


class FeedbackRequest(BaseModel):
  sample_id: str
  label: str = Field(..., pattern="^(PROCEED|IGNORE)$")


def alert_to_text(alert: AlertPayload) -> str:
  parts = [
    f"type={alert.type}",
    f"pt={alert.pt:.4f}",
    f"label={alert.alert.label}",
    f"value={alert.alert.value:.4f}",
  ]
  if alert.timestamp:
    parts.append(f"timestamp={alert.timestamp}")
  return "; ".join(parts)


def embedding_to_features(vector: List[float]) -> Dict[str, float]:
  return {f"f{i}": float(value) for i, value in enumerate(vector)}


DEFAULT_SPEED_KMH = float(os.getenv("DEFAULT_SPEED_KMH", "2.0"))
MIN_SPEED_KMH = float(os.getenv("MIN_SPEED_KMH", "0.5"))
MAX_SPEED_KMH = float(os.getenv("MAX_SPEED_KMH", "6.0"))
SPEED_WINDOW = int(os.getenv("SPEED_SUGGESTION_WINDOW", "120"))
SPEED_GAIN = float(os.getenv("SPEED_GAIN", "4.0"))
SPEED_PENALTY = float(os.getenv("SPEED_PENALTY", "2.0"))


class OnlineHaltingModel:
  def __init__(self) -> None:
    self.embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    self.model = compose.Pipeline(
      preprocessing.StandardScaler(),
      linear_model.LogisticRegression()
    )
    self.samples: Dict[str, Dict[str, float]] = {}
    self.labels: Dict[str, str] = {}
    self.has_trained = False
    self.recent_decisions: Deque[bool] = deque(maxlen=SPEED_WINDOW)
    self.recent_scores: Deque[float] = deque(maxlen=SPEED_WINDOW)
    self.recent_feedback: Deque[bool] = deque(maxlen=SPEED_WINDOW)
    self.current_speed = DEFAULT_SPEED_KMH

  def embed(self, alert: AlertPayload) -> List[float]:
    text = alert_to_text(alert)
    vector = self.embedder.encode(text, normalize_embeddings=True)
    return vector.tolist()

  def predict(self, features: Dict[str, float]) -> float:
    if not self.has_trained:
      return 0.5
    proba = self.model.predict_proba_one(features)
    score = float(proba.get(True, 0.5))
    return score

  def record_decision(self, proceed: bool, score: float) -> None:
    self.recent_decisions.append(proceed)
    self.recent_scores.append(score)

  def record_feedback(self, proceed: bool) -> None:
    self.recent_feedback.append(proceed)

  def suggest_speed(self) -> float:
    if self.recent_feedback:
      values = [1.0 if value else 0.0 for value in self.recent_feedback]
    else:
      values = [1.0 if value else 0.0 for value in self.recent_decisions]

    if not values:
      return DEFAULT_SPEED_KMH

    ratio = sum(values) / len(values)
    target = DEFAULT_SPEED_KMH + SPEED_GAIN * (ratio - 0.5)

    if ratio < 0.5:
      target -= SPEED_PENALTY * (0.5 - ratio)

    target = max(MIN_SPEED_KMH, min(MAX_SPEED_KMH, target))
    self.current_speed = target
    return float(target)

  def learn(self, sample_id: str, label: str) -> None:
    features = self.samples.get(sample_id)
    if not features:
      raise KeyError(f"Sample {sample_id} not found")
    self.model.learn_one(features, label == "PROCEED")
    self.labels[sample_id] = label
    self.has_trained = True
    self.record_feedback(label == "PROCEED")
    logger.info("Updated model with sample=%s label=%s", sample_id, label)

  def reinforce_decision(self, sample_id: str, score: float) -> None:
    features = self.samples.get(sample_id)
    if not features:
      return
    self.model.learn_one(features, score >= 0.5)
    self.has_trained = True


app = FastAPI(title="Halting Decision Service", version="0.1.0")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

model = OnlineHaltingModel()


@app.get("/health")
async def health() -> Dict[str, str]:
  return {"status": "ok"}


@app.post("/decision", response_model=DecisionResponse)
async def decision(request: DecisionRequest) -> DecisionResponse:
  try:
    vector = model.embed(request.alert)
  except Exception as exc:
    logger.exception("Failed to embed alert")
    raise HTTPException(status_code=500, detail="Embedding failed") from exc

  features = embedding_to_features(vector)
  score = model.predict(features)
  decision_label = "PROCEED" if score >= 0.5 else "IGNORE"

  sample_id = uuid.uuid4().hex
  model.samples[sample_id] = features
  model.record_decision(decision_label == "PROCEED", score)
  model.reinforce_decision(sample_id, score)
  suggested_speed = model.suggest_speed()

  logger.info(
    "Decision issued sample=%s decision=%s score=%.3f fallback=%s",
    sample_id,
    decision_label,
    score,
    not model.has_trained,
  )

  return DecisionResponse(
    sample_id=sample_id,
    decision=decision_label,
    score=score,
    fallback=not model.has_trained,
    vector=vector,
    suggested_speed_kmh=suggested_speed,
  )


@app.post("/feedback")
async def feedback(request: FeedbackRequest) -> Dict[str, str]:
  try:
    model.learn(request.sample_id, request.label)
    return {"status": "updated"}
  except KeyError as exc:
    raise HTTPException(status_code=404, detail="Unknown sample id") from exc
  except Exception as exc:  # pragma: no cover - safeguard
    logger.exception("Failed to apply feedback")
    raise HTTPException(status_code=500, detail="Feedback update failed") from exc

