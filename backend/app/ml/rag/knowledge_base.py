"""External Domain Knowledge Base for Real-World RAG Grounding.

Maintains statutory procurement rules, environmental/monsoon moratoriums,
Election Commission statutory freezes, implementing agency taxonomy, and
Schedule of Rates (SoR) benchmarks outside the tabular ML model.
"""

from typing import Dict, Any, List


class RAGKnowledgeBase:
    """Central repository of external statutory, environmental, and institutional knowledge."""

    # --------------------------------------------------------------------------
    # 1. STATUTORY PROCUREMENT & MPLADS REGULATORY COMPENDIUM
    # --------------------------------------------------------------------------
    STATUTORY_RULES: Dict[str, Dict[str, Any]] = {
        "GFR_RULE_149": {
            "title": "General Financial Rules (GFR 2017) Rule 149 - GeM Procurement Mandate",
            "threshold": "All standard goods and services",
            "statutory_mandate": (
                "Mandatory procurement of common-use goods and services through the Government e-Marketplace (GeM). "
                "Direct purchase on GeM up to Rs. 25,000; comparison of at least 3 manufacturers between Rs. 25,000 and "
                "Rs. 5,00,000; mandatory online bidding/reverse auction above Rs. 5,00,000."
            ),
            "violation_indicator": "Offline manual quotations obtained for GeM-listed commodities without non-availability certificate."
        },
        "GFR_RULE_154": {
            "title": "GFR 2017 Rule 154 - Direct Purchase Without Quotations",
            "threshold": "Up to Rs. 25,000 per occasion",
            "statutory_mandate": (
                "Purchase of goods up to the value of Rs. 25,000 on each occasion may be made without inviting quotations "
                "or bids on the basis of a certificate recorded by the competent authority."
            ),
            "violation_indicator": "Splitting invoices into Rs. 24,000 increments to bypass quotation committees."
        },
        "GFR_RULE_155": {
            "title": "GFR 2017 Rule 155 - Local Purchase Committee / Limited Quotations",
            "threshold": "Rs. 25,001 to Rs. 5,00,000",
            "statutory_mandate": (
                "Purchase of goods and minor works costing between Rs. 25,000 and Rs. 5,00,000 may be carried out by a "
                "three-member Local Purchase Committee on the basis of minimum 3 physical or e-quotations without mandatory "
                "open newspaper/national portal advertisement."
            ),
            "violation_indicator": (
                "Artificial splitting of large civil contracts into multiple sub-Rs. 5 Lakh packages (smurfing) to evade "
                "mandatory open competitive e-tendering under Rule 161."
            )
        },
        "GFR_RULE_161": {
            "title": "GFR 2017 Rule 161 - Mandatory Open Competitive E-Tendering",
            "threshold": "Exceeding Rs. 5,00,000",
            "statutory_mandate": (
                "Mandatory execution of open competitive e-tendering through the Central Public Procurement Portal (CPPP) "
                "or State e-procurement portals for all works and procurements estimated above Rs. 5,00,000."
            ),
            "violation_indicator": "Awarding civil works exceeding Rs. 5 Lakhs on nomination or limited quotation basis."
        },
        "GFR_RULE_173": {
            "title": "GFR 2017 Rule 173 - Single Tender / Proprietary Article Procurement",
            "threshold": "Any value (Specialized / Emergency)",
            "statutory_mandate": (
                "Single tender procurement is permissible ONLY when standardized equipment is required from an OEM or in "
                "cases of certified emergency, accompanied by a Proprietary Article Certificate (PAC) approved by the District Magistrate."
            ),
            "violation_indicator": "Awarding routine civil construction to private single bidders without PAC justification."
        },
        "MPLADS_2023_ELIGIBILITY": {
            "title": "MPLADS Guidelines 2023 Revision - Permissible & Prohibited Works",
            "statutory_mandate": (
                "MPLADS funds can only be utilized for creating durable community public assets (drinking water, sanitation, "
                "education, roads, primary healthcare). Creation of private, commercial, or religious structures is strictly prohibited."
            ),
            "violation_indicator": "Funding gated residential access, commercial enterprise compounds, or places of worship."
        },
        "MPLADS_2023_CALAMITY": {
            "title": "MPLADS Guidelines 2023 - Natural Calamity Emergency Relief (Para 3.2)",
            "threshold": "Up to Rs. 1.0 Crore per MP recommendation",
            "statutory_mandate": (
                "In case of a severe natural calamity (floods, cyclones, earthquakes) notified by the State or Central Disaster "
                "Management Authority, MPs can recommend up to Rs. 1.0 Crore for rehabilitation works outside their normal "
                "constituency boundaries, exempt from routine pre-sanction milestone pacing."
            ),
            "mitigation_factor": "Work executed under notified disaster relief is exempt from standard peer delivery delays."
        }
    }

    # --------------------------------------------------------------------------
    # 2. ENVIRONMENTAL, SEASONAL & NATURAL DISASTER CALENDAR
    # --------------------------------------------------------------------------
    FLOOD_PRONE_DISTRICTS: List[str] = [
        "darbhanga", "madhubani", "samastipur", "saran", "muzaffarpur",
        "saharsa", "supaul", "khagaria", "bhagalpur", "katihar",
        "purnia", "araria", "kishanganj", "sitamarhi", "sheohar",
        "east champaran", "west champaran", "gopalganj", "vaishali",
        "gorakhpur", "deoria", "ballia", "cachar", "barpeta", "dhubri"
    ]

    SEASONAL_MORATORIUM_WINDOW = {
        "start_month": 6,
        "start_day": 15,
        "end_month": 10,
        "end_day": 15,
        "reason": (
            "Statutory Monsoon and Gangetic flood inundation window recognized by State PWD Codes. "
            "Mandatory suspension of all earthwork, bitumen laying, and deep foundation casting in riverine floodplains."
        )
    }

    # --------------------------------------------------------------------------
    # 3. STATUTORY ELECTION BLACKOUT WINDOWS (MODEL CODE OF CONDUCT)
    # --------------------------------------------------------------------------
    ELECTION_MCC_WINDOWS: List[Dict[str, Any]] = [
        {
            "event": "2024 Lok Sabha Parliamentary General Elections",
            "start_date": "2024-03-16",
            "end_date": "2024-06-06",
            "duration_days": 82,
            "statutory_authority": "Election Commission of India (ECI) Model Code of Conduct",
            "mandate": (
                "Statutory freeze on all new administrative sanctions, publication of new tenders, execution of work orders, "
                "and non-emergency tranche disbursements. All routine developmental milestones legally placed on administrative hold."
            )
        }
    ]

    # --------------------------------------------------------------------------
    # 4. IMPLEMENTING AGENCY (IDA) INSTITUTIONAL TAXONOMY
    # --------------------------------------------------------------------------
    STATUTORY_PUBLIC_AGENCIES: Dict[str, str] = {
        "pwd": "State Public Works Department (Statutory Civil Engineering Line Department)",
        "public works": "Public Works Department (Statutory Civil Engineering Line Department)",
        "cpwd": "Central Public Works Department (Government of India Apex Engineering Agency)",
        "drda": "District Rural Development Agency (Statutory Magisterial Planning Agency)",
        "rdd": "Rural Development Department (State Line Department)",
        "rural development": "Rural Development Department (State Line Department)",
        "rwd": "Rural Works Department (State Rural Infrastructure Line Department)",
        "rural works": "Rural Works Department (State Rural Infrastructure Line Department)",
        "pul nirman": "Bihar Rajya Pul Nirman Nigam Limited (State Public Sector Bridge Corporation)",
        "brpnnl": "Bihar Rajya Pul Nirman Nigam Limited (State Public Sector Bridge Corporation)",
        "nbcc": "National Buildings Construction Corporation Limited (Central PSU)",
        "zp": "Zila Parishad (Constitutional Panchayati Raj Local Body)",
        "zila parishad": "Zila Parishad (Constitutional Panchayati Raj Local Body)",
        "mc": "Municipal Corporation / Nagar Nigam (Constitutional Urban Local Body)",
        "municipal corporation": "Municipal Corporation (Constitutional Urban Local Body)",
        "nagar nigam": "Nagar Nigam (Constitutional Urban Local Body)",
        "phed": "Public Health Engineering Department (Statutory Water Supply Agency)",
        "public health": "Public Health Engineering Department (Statutory Water Supply Agency)",
        "bsidc": "State Infrastructure Development Corporation (Government Enterprise)",
        "forest department": "Department of Environment & Forests (Statutory Custodian)",
    }

    # --------------------------------------------------------------------------
    # 5. SCHEDULE OF RATES (SoR) STANDARD RURAL ASSET BENCHMARKS
    # --------------------------------------------------------------------------
    SOR_BENCHMARKS: Dict[str, Dict[str, Any]] = {
        "solar_high_mast": {
            "keywords": ["solar", "high mast", "street light", "led light", "solar light"],
            "standard_cost_min": 450000.0,
            "standard_cost_max": 499000.0,
            "typical_units": "15 to 20 solar poles per village unit",
            "sor_code": "State Schedule of Rates - Rural Electrification Benchmark",
            "verdict": "Legitimate single-unit standardized community asset; sub-Rs. 5L cost is driven by approved SoR schedule, not contract fragmentation."
        },
        "anganwadi_sanitation": {
            "keywords": ["anganwadi", "shauchalay", "toilet", "drinking water", "balvatika"],
            "standard_cost_min": 460000.0,
            "standard_cost_max": 498000.0,
            "typical_units": "Single child-friendly sanitation & deep-well facility",
            "sor_code": "MoWCD / State PWD Standard Norm",
            "verdict": "Standard single-sanction public facility; allocation matches prescribed state ceiling."
        },
        "community_handpump_solar": {
            "keywords": ["handpump", "hand pump", "borewell", "chapakal", "tube well", "submersible"],
            "standard_cost_min": 450000.0,
            "standard_cost_max": 495000.0,
            "typical_units": "Community drinking water point with overhead storage",
            "sor_code": "PHED Schedule of Rates",
            "verdict": "Standard rural drinking water unit cost."
        }
    }
