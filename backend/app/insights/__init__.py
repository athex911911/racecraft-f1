"""Insights provider factory.

Returns the deterministic template provider. A ClaudeProvider (natural-language
answers) could be returned here when `settings.anthropic_api_key` is set — the
router and schemas would not change. This build is template-only by design.
"""

from functools import lru_cache

from app.insights.base import InsightProvider
from app.insights.template_provider import TemplateProvider


@lru_cache
def get_provider() -> InsightProvider:
    return TemplateProvider()
