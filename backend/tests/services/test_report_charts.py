"""Unit tests for Phase 1: Programmatic Visual Chart Engine (report_charts.py)."""

import io
import pytest
from app.services.report_charts import (
    generate_spider_radar_chart,
    generate_smurfing_histogram,
    generate_lifecycle_waterfall,
    generate_cartel_network_diagram,
    generate_equity_spread_chart,
)

PNG_MAGIC_BYTES = b"\x89PNG\r\n\x1a\n"


def test_spider_radar_chart_generation():
    """Verify 7-domain radar chart produces high-resolution PNG image bytes."""
    sample_sub_scores = {
        "financial": 76.8,
        "geospatial": 94.9,
        "procurement": 36.9,
        "contractor": 100.0,
        "payment": 79.3,
        "progress": 73.3,
        "graph": 100.0
    }
    buf = generate_spider_radar_chart(sample_sub_scores)
    assert isinstance(buf, io.BytesIO)
    data = buf.getvalue()
    assert len(data) > 15000, "PNG output must be high resolution (>15KB)"
    assert data.startswith(PNG_MAGIC_BYTES), "Must have valid PNG magic header"


def test_smurfing_histogram_generation():
    """Verify GFR 155 contract splitting histogram generates valid PNG."""
    clusters = [
        {"amount": 498000.0},
        {"amount": 485000.0},
        {"amount": 492000.0},
        {"amount": 490000.0},
        {"amount": 320000.0},
        {"amount": 550000.0},
    ]
    buf = generate_smurfing_histogram(clusters)
    assert isinstance(buf, io.BytesIO)
    data = buf.getvalue()
    assert len(data) > 15000
    assert data.startswith(PNG_MAGIC_BYTES)


def test_lifecycle_waterfall_generation():
    """Verify 4-stage statutory lifecycle waterfall generates valid PNG."""
    stages = {
        "recommended": {"works": 128, "capital": 52114800.0},
        "sanctioned": {"works": 20, "capital": 8140000.0},
        "pending": {"works": 108, "capital": 43974800.0},
        "completed": {"works": 0, "capital": 0.0}
    }
    buf = generate_lifecycle_waterfall(stages)
    assert isinstance(buf, io.BytesIO)
    data = buf.getvalue()
    assert len(data) > 15000
    assert data.startswith(PNG_MAGIC_BYTES)


def test_cartel_network_diagram_generation():
    """Verify cartel and agency monopoly conduit diagram generates valid PNG."""
    syndicates = [
        {"name": "Eastern PWD Syndicate", "capital": 482500000.0, "states": ["Bihar", "UP", "WB"], "risk_score": 88.5},
        {"name": "Northern Roadways Ring", "capital": 314000000.0, "states": ["Punjab", "Haryana"], "risk_score": 79.2},
    ]
    buf = generate_cartel_network_diagram(syndicates)
    assert isinstance(buf, io.BytesIO)
    data = buf.getvalue()
    assert len(data) > 15000
    assert data.startswith(PNG_MAGIC_BYTES)


def test_equity_spread_chart_generation():
    """Verify inter-district equity spread chart generates valid PNG."""
    matrix = [
        {"name": "Darbhanga", "capital": 52114800.0, "risk": 84.5},
        {"name": "Patna Sahib", "capital": 41800000.0, "risk": 72.0},
        {"name": "Gaya", "capital": 34500000.0, "risk": 65.3},
    ]
    buf = generate_equity_spread_chart(matrix)
    assert isinstance(buf, io.BytesIO)
    data = buf.getvalue()
    assert len(data) > 15000
    assert data.startswith(PNG_MAGIC_BYTES)


def test_chart_generators_with_empty_inputs():
    """Verify all chart generators gracefully handle None and empty collections."""
    for fn, arg in [
        (generate_spider_radar_chart, None),
        (generate_smurfing_histogram, None),
        (generate_lifecycle_waterfall, None),
        (generate_cartel_network_diagram, None),
        (generate_equity_spread_chart, None),
        (generate_smurfing_histogram, []),
        (generate_cartel_network_diagram, []),
        (generate_equity_spread_chart, []),
    ]:
        buf = fn(arg)
        assert isinstance(buf, io.BytesIO)
        assert len(buf.getvalue()) > 10000
        assert buf.getvalue().startswith(PNG_MAGIC_BYTES)
