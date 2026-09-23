"""Reconciliation and pattern reports, pure over one taxpayer's records.

A report lays numbers side by side; a check concludes something. Reports are
what an officer shows a taxpayer, so every one of them ends in rows that
export to Excel.

`REPORTS` is the registry the API and the screen read. Adding a report is one
module and one entry here - never a change to the runner, the store or the
scorecard.
"""

from __future__ import annotations

from app.reports.base import Point, Report, ReportRow, Series

__all__ = ["Point", "Report", "ReportRow", "Series"]
