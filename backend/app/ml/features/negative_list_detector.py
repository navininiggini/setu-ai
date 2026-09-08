"""
SETU — MPLADS Statutory Compliance Auditing Engine
Negative List / Prohibited Works Detector (MoSPI MPLADS Guidelines 2023, Annexure-III)

Mandate:
The following works are strictly prohibited under MPLADS:
1. Office and residential buildings for private/commercial institutions
2. Memorials, statues, or monuments commemorating individuals
3. Places of religious worship or structures within religious premises
4. Cash grants, individual loans, or personal medical assistance
5. Land acquisition or land purchase
6. Temporary structures or temporary sheds
"""

import re
from typing import Dict, Any, List

NEGATIVE_LIST_RULES = {
    "RELIGIOUS_STRUCTURE": {
        "label": "Place of Worship / Religious Structure",
        "description": "Construction or renovation of religious places or structures within religious premises (Annexure-III, Item 3).",
        "patterns": [
            r"\btemple\b", r"\bmosque\b", r"\bchurch\b", r"\bgurudwara\b", 
            r"\bmasjid\b", r"\bmandir\b", r"\bchapel\b", r"\bashram\b", 
            r"\bprayer hall\b", r"\bdargah\b"
        ]
    },
    "MEMORIAL_MONUMENT": {
        "label": "Memorial / Statue / Monument",
        "description": "Construction of memorials, monuments, or statues commemorating individuals (Annexure-III, Item 2).",
        "patterns": [
            r"\bmemorial\b", r"\bstatue\b", r"\bmonument\b", r"\bbust of\b", 
            r"\bsamadhi\b", r"\bcenotaph\b", r"\bstatues\b"
        ]
    },
    "PRIVATE_COMMERCIAL": {
        "label": "Private / Commercial Infrastructure",
        "description": "Works benefiting private individuals, commercial establishments, or private clubs (Annexure-III, Item 1).",
        "patterns": [
            r"\bprivate residence\b", r"\bcommercial complex\b", r"\bshopping complex\b", 
            r"\bprivate club\b", r"\bcommercial shop\b", r"\bprivate building\b",
            r"\bcommercial building\b", r"\bprivate compound\b", r"\bprivate property\b"
        ]
    },
    "CASH_ASSISTANCE": {
        "label": "Direct Cash / Individual Grant",
        "description": "Cash grants, sponsorships, individual loans, or medical treatment subsidies (Annexure-III, Item 4).",
        "patterns": [
            r"\bcash assistance\b", r"\bdirect cash\b", r"\bindividual loan\b", 
            r"\bprivate medical treatment\b", r"\bpersonal subsidy\b",
            r"\bcash grant\b", r"\bfinancial assistance\b"
        ]
    },
    "TEMPORARY_STRUCTURE": {
        "label": "Temporary Structure",
        "description": "Non-durable assets such as temporary sheds, tents, or non-permanent installations (Annexure-III, Item 6).",
        "patterns": [
            r"\btemporary shed\b", r"\bpandal\b", r"\btemporary tent\b", 
            r"\btemporary shelter\b"
        ]
    },
    "LAND_ACQUISITION": {
        "label": "Land Acquisition / Purchase",
        "description": "Acquisition or purchase of private land or compensation for land (Annexure-III, Item 5).",
        "patterns": [
            r"\bland acquisition\b", r"\bland purchase\b", r"\bland compensation\b", 
            r"\bpurchase of land\b"
        ]
    }
}

def check_negative_list(work_title: str, category: str = "") -> Dict[str, Any]:
    """
    Scans work title and category against statutory prohibited works list.
    Returns:
    {
        "is_violation": bool,
        "rule_key": str or None,
        "reason": str or None,
        "matched_term": str or None,
        "statutory_reference": str
    }
    """
    text = f"{work_title} {category}".lower()
    
    for rule_key, rule_data in NEGATIVE_LIST_RULES.items():
        for pattern in rule_data["patterns"]:
            match = re.search(pattern, text)
            if match:
                return {
                    "is_violation": True,
                    "rule_key": rule_key,
                    "reason": f"{rule_data['label']}: matched '{match.group(0)}' ({rule_data['description']})",
                    "matched_term": match.group(0),
                    "statutory_reference": "MPLADS Guidelines 2023, Annexure-III (Negative List)"
                }
                
    return {
        "is_violation": False,
        "rule_key": None,
        "reason": None,
        "matched_term": None,
        "statutory_reference": "MPLADS Guidelines 2023, Annexure-III"
    }


def is_trust_society_work(ida_name: str, work_title: str) -> bool:
    """
    Check if the implementing or beneficiary agency is a Trust, Society, or NGO.
    Under Para 3.14 of MPLADS Guidelines 2023, expenditure for registered Societies/Trusts
    is subject to a strict ceiling of ₹50.0 Lakhs per MP per financial year.
    """
    text = f"{ida_name} {work_title}".lower()
    trust_indicators = [
        "trust", "society", "samiti", "mandal", "sangh", "foundation", 
        "sansthan", "ngo", "voluntary organisation", "shiksha samiti"
    ]
    return any(ind in text for ind in trust_indicators)
