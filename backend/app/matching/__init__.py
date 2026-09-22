"""The match engine: 21 named joins over an L1-L5 key ladder.

Single-sheet checks find clerical error. Every material finding in
`docs/07` came from a join -- the Rule 37A exposure from a supplier-status
column joined to a claim, and the Rs 1.91 crore from an invoice joined to a
credit note joined to an HSN summary.

Matching is the product. docs/02 Part B.
"""

from app.matching.keys import Candidate, MatchLevel, match_level, normalise_doc_no

__all__ = ["Candidate", "MatchLevel", "match_level", "normalise_doc_no"]
