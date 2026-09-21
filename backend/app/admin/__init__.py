"""Governance of the values the engine runs on.

Kept out of ``app/engine`` deliberately: the engine is pure -- no clock, no
database, no randomness -- and a test enforces that. Administering a threshold
is all three.
"""
