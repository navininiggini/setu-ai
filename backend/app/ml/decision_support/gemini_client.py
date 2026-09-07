"""Thin wrapper around google.genai.Client with timeout and exponential backoff.

MoSPI SETU MPLADS Platform.
"""

import os
import time
import logging
from typing import Optional, Dict, Any

from app.core.config import settings

logger = logging.getLogger("setu.decision_support.gemini")

# Lazy import to avoid loading issues when package is optional
try:
    from google import genai
    # pyrefly: ignore [missing-import]
    from google.genai import types
    # pyrefly: ignore [missing-import]
    from google.genai.errors import APIError
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    genai = None
    types = None
    APIError = Exception


class GeminiDecisionSupportClient:
    """Client for generating grounded structured recommendations via Gemini API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
        max_retries: int = 3,
        initial_backoff: float = 1.0,
    ):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL_NAME or "gemini-2.5-flash"
        self.timeout_seconds = timeout_seconds or settings.DECISION_SUPPORT_TIMEOUT_SECONDS or 5.0
        self.max_retries = max_retries
        self.initial_backoff = initial_backoff
        self._client: Optional[Any] = None

    def _get_client(self) -> Any:
        if not HAS_GENAI:
            raise RuntimeError("google-genai package is not installed. Install with `pip install google-genai`.")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not configured.")
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def is_available(self) -> bool:
        """Check if Gemini client has API key configured and library available."""
        return bool(HAS_GENAI and self.api_key)

    def generate_structured(
        self,
        contents: str,
        system_instruction: str,
        response_schema: Dict[str, Any],
    ) -> str:
        """Call Gemini generate_content with structured output, timeout, and retry on 429."""
        client = self._get_client()

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=0.2,  # Low temperature for deterministic, strictly grounded procedural text
            max_output_tokens=8192,
        )

        models_to_try = [self.model_name]
        for alt_model in ["gemini-3.5-flash", "gemini-3.7-flash", "gemini-flash-latest"]:
            if alt_model not in models_to_try:
                models_to_try.append(alt_model)

        last_exception = None

        for active_model in models_to_try:
            backoff = self.initial_backoff
            for attempt in range(1, self.max_retries + 1):
                try:
                    response = client.models.generate_content(
                        model=active_model,
                        contents=contents,
                        config=config,
                    )
                    if response and response.text:
                        return response.text
                    raise RuntimeError("Empty response received from Gemini API.")
                except Exception as e:
                    last_exception = e
                    err_str = str(e)
                    is_rate_limit = "429" in err_str or "RESOURCE_EXHAUSTED" in err_str.upper()

                    if is_rate_limit:
                        logger.warning(
                            "Model %s hit 429 quota exhaustion on attempt %d/%d. Backing off %.1fs...",
                            active_model, attempt, self.max_retries, backoff
                        )
                        if attempt < self.max_retries:
                            time.sleep(backoff)
                            backoff *= 2.0
                            continue
                        else:
                            logger.info("Failing over from %s to next available Gemini model...", active_model)
                            break
                    else:
                        logger.warning("Gemini call on %s failed: %s", active_model, err_str)
                        break

        raise last_exception or RuntimeError("All Gemini models exhausted or failed.")
