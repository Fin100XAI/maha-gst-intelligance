"""The departmental 141-check matrix, and this platform's answer to it.

Three parts. `catalogue` holds the matrix as the department wrote it, loaded
from versioned JSON. `mapping` records which built checks honestly answer
which row. `run` projects one taxpayer's findings onto the matrix and reports
five outcomes, of which two - "we have not built this" and "we could not check
this" - are deliberately distinct, because they are fixed by different people.
"""

from __future__ import annotations

from app.matrix.catalogue import APPLICABILITY, INDUSTRIES, MATRIX
from app.matrix.run import MatrixResult, MatrixRow, run_matrix

__all__ = ["APPLICABILITY", "INDUSTRIES", "MATRIX", "MatrixResult", "MatrixRow", "run_matrix"]
