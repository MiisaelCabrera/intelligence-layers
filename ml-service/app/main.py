from __future__ import annotations

import logging
import uuid
from typing import Dict, List, Optional

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
  vector: List[float] | None = None


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

  def embed(self, alert: AlertPayload) -> List[float]:
    text = alert_to_text(alert)
    vector = self.embedder.encode(text, normalize_embeddings=True)
    logger.info("Generated embedding for alert label=%s pt=%.2f", alert.alert.label, alert.pt)
    return vector.tolist()

  def predict(self, features: Dict[str, float]) -> float:
    if not self.has_trained:
      return 0.5
    proba = self.model.predict_proba_one(features)
    score = float(proba.get(True, 0.5))
    return score

  def learn(self, sample_id: str, label: str) -> None:
    features = self.samples.get(sample_id)
    if not features:
      raise KeyError(f"Sample {sample_id} not found")
    self.model.learn_one(features, label == "PROCEED")
    self.labels[sample_id] = label
    self.has_trained = True
    logger.info("Updated model with sample=%s label=%s", sample_id, label)


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

