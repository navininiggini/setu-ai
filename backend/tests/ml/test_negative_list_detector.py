"""Unit tests for Negative List Prohibited Works Detector.

Tests Annexure-III violations (places of worship, memorials, cash grants, etc.)
and Registered Trust/Society identification under MoSPI Guidelines 2023.
"""

import pytest
from app.ml.features.negative_list_detector import (
    check_negative_list,
    is_trust_society_work,
)


def test_check_negative_list_place_of_worship():
    res = check_negative_list(
        work_title="Renovation of Temple Boundary Wall and Mandir Entrance",
        category="Community Work",
    )
    assert res["is_violation"] is True
    assert "Place of Worship" in res["reason"]


def test_check_negative_list_statue_memorial():
    res = check_negative_list(
        work_title="Erection of Bronze Statue and Memorial Monument",
        category="Others",
    )
    assert res["is_violation"] is True
    assert "Memorial" in res["reason"] or "Statue" in res["reason"]


def test_check_negative_list_private_property():
    res = check_negative_list(
        work_title="Paving of Private Compound and Commercial Building",
        category="Roads",
    )
    assert res["is_violation"] is True
    assert "Private" in res["reason"] or "Commercial" in res["reason"]


def test_check_negative_list_cash_grant():
    res = check_negative_list(
        work_title="Financial Assistance and Cash Grant to Farmers Society",
        category="Grants",
    )
    assert res["is_violation"] is True
    assert "Direct Cash" in res["reason"] or "Grant" in res["reason"]


def test_check_negative_list_compliant_public_asset():
    res = check_negative_list(
        work_title="Installation of Deep Tube Well and Drinking Water Tank",
        category="Drinking Water",
    )
    assert res["is_violation"] is False
    assert res["reason"] is None


def test_is_trust_society_work():
    assert is_trust_society_work("Gram Panchayat", "Grant to Maharishi Education Trust School") is True
    assert is_trust_society_work("Mahila Kalyan Society", "Construction of Vocational Center") is True
    assert is_trust_society_work("Municipal Corporation", "Construction of CC Road") is False
