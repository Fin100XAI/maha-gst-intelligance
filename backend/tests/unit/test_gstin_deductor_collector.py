"""Position 14 of a GSTIN is not always ``Z``.

``Z`` is the normal taxpayer. **``D`` is a section 51 deductor and ``C`` is a
section 52 collector**, and a validator hard-coded to ``Z`` rejects every
government department in India.

This is not hypothetical. `docs/07` Part C3 records it happening on the real
SSR Marine workbook: checksum validation across 483 counterparties flagged two
as structurally invalid --

    24RKTO00351B1DX   OC Water Wing, BSF Bhuj
    24AAAGD0803M1D2   DDO 153 Bn, BSF

Both are genuine TDS-deductor registrations, and neither is a supplier at all:
they appear in GSTR-2A TDS, having deducted tax on Rs 8.00 crore of payments
**to** this taxpayer. Rejecting them does not merely lose two rows - it
discards the third-party corroboration of declared turnover that G-14 and
X-10 are built on.

`docs/05` Phase 0 makes this a gate: ``validate_gstin`` must accept
``27AAPCS8928R1Z1`` **and** ``24AAAGD0803M1D2``.
"""

from __future__ import annotations

import pytest

from app.canonical import GstinError, gstin_checksum, validate_gstin


class TestTheThreeRegistrationClasses:
    def test_a_normal_taxpayer_carries_z(self) -> None:
        assert validate_gstin("27AAPCS8928R1Z1") == "27AAPCS8928R1Z1"

    @pytest.mark.golden
    def test_a_section_51_deductor_carries_d(self) -> None:
        """The regression. BSF DDO 153 Bn, from the real workbook."""
        assert validate_gstin("24AAAGD0803M1D2") == "24AAAGD0803M1D2"

    def test_a_section_52_collector_carries_c(self) -> None:
        """An e-commerce operator collecting TCS under s.52."""
        # Constructed to be checksum-valid with C at position 14.
        body = "27AAPCS8928R1C"
        assert validate_gstin(body + gstin_checksum(body))


class TestTheValidatorHasNotBecomeAnythingGoes:
    """Widening position 14 must not widen anything else."""

    def test_a_letter_that_is_not_z_d_or_c_is_refused(self) -> None:
        for wrong in "ABEFGHIJKLMNOPQRSTUVWXY":
            body = f"27AAPCS8928R1{wrong}"
            with pytest.raises(GstinError):
                validate_gstin(body + gstin_checksum(body))

    def test_a_flipped_character_still_fails_the_checksum(self) -> None:
        with pytest.raises(GstinError, match="checksum"):
            validate_gstin("27AAPCS8928R1Z2")

    def test_the_reason_names_the_three_classes(self) -> None:
        """An officer reading the quarantine reason should learn the rule."""
        body = "27AAPCS8928R1X"
        with pytest.raises(GstinError) as caught:
            validate_gstin(body + gstin_checksum(body))
        assert "Z" in str(caught.value)
        assert "D" in str(caught.value)
        assert "C" in str(caught.value)

    def test_length_and_state_checks_are_untouched(self) -> None:
        with pytest.raises(GstinError, match="length"):
            validate_gstin("27AAPCS8928R1D")
        # 88 is unassigned. 99 is NOT a good example: it is Centre
        # Jurisdiction, a real code that the validator rightly accepts.
        with pytest.raises(GstinError, match="State code"):
            validate_gstin("88AAAGD0803M1D2")
