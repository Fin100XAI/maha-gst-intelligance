# GST Intelligence
#
# Every gate in docs/04 is reachable from here, and CI runs exactly these
# targets.  If a check is not in this file it is not a standard.

SHELL := /bin/bash
BACKEND := backend
FRONTEND := frontend

# Prefer the committed virtualenv; fall back to whatever python is on PATH so a
# clean clone can still run `make install`.
PY := $(BACKEND)/.venv/Scripts/python.exe
ifeq (,$(wildcard $(BACKEND)/.venv/Scripts/python.exe))
  PY := $(BACKEND)/.venv/bin/python
endif
ifeq (,$(wildcard $(BACKEND)/.venv/bin/python))
  ifeq (,$(wildcard $(BACKEND)/.venv/Scripts/python.exe))
    PY := python
  endif
endif

.DEFAULT_GOAL := help
.PHONY: help install dev down test test-backend test-frontend lint lint-backend \
        lint-frontend types gates g1 g2 g11 migrate seed demo clean

help:  ## List the targets
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[1m%-16s\033[0m %s\n", $$1, $$2}'

install:  ## Create the backend venv and install both toolchains
	python -m venv $(BACKEND)/.venv
	$(PY) -m pip install --upgrade pip
	$(PY) -m pip install -e "$(BACKEND)[dev]"
	cd $(FRONTEND) && npm install

dev:  ## Bring the stack up (postgres, redis, minio, api, web)
	docker compose up --build

down:  ## Stop the stack
	docker compose down

migrate:  ## Apply the migrations to the configured database
	cd $(BACKEND) && ../$(PY) -m alembic upgrade head

# ---------------------------------------------------------------------------
# checks
# ---------------------------------------------------------------------------

lint: lint-backend lint-frontend  ## ruff + mypy + tsc + eslint

lint-backend:
	cd $(BACKEND) && ../$(PY) -m ruff check .
	cd $(BACKEND) && ../$(PY) -m ruff format --check .
	cd $(BACKEND) && ../$(PY) -m mypy app

lint-frontend:
	cd $(FRONTEND) && npx tsc --noEmit
	cd $(FRONTEND) && npx eslint . --max-warnings 0

types: lint-backend  ## Gate G4: mypy --strict on the engine

test: test-backend test-frontend  ## The full suite

test-backend:
	cd $(BACKEND) && ../$(PY) -m pytest -q

test-frontend:
	cd $(FRONTEND) && npx vitest run

cov:  ## Gate G6: engine coverage
	cd $(BACKEND) && ../$(PY) -m pytest -q --cov=app --cov-report=term-missing

# ---------------------------------------------------------------------------
# the global gates, runnable one at a time
# ---------------------------------------------------------------------------

gates: g1 g2 g11  ## Every gate this phase has implemented

g1:  ## No float literal or float() under any tree that computes a figure
	cd $(BACKEND) && ../$(PY) tools/lint_no_float.py

g2:  ## No money column is floating point
	cd $(BACKEND) && ../$(PY) -m pytest -q tests/migration/test_money_columns.py

g11:  ## The audit chain verifies from genesis
	cd $(BACKEND) && ../$(PY) -m pytest -q tests/unit/test_audit_chain.py

# ---------------------------------------------------------------------------
# the synthetic dataset -- twelve taxpayers, one of them clean
# ---------------------------------------------------------------------------

seed: demo  ## Alias: the synthetic dataset is what `demo` builds

demo:  ## Generate portal-shaped workbooks, ingest them, and run the engine
	cd $(BACKEND) && DRISHTI_DATABASE_URL=sqlite:///./demo.db ../$(PY) -m app.seed.demo
	@echo
	@echo "Serve it:  cd backend && DRISHTI_DATABASE_URL=sqlite:///./demo.db \"
	@echo "           .venv/Scripts/python -m uvicorn app.main:app --port 8000"
	@echo "Then:      cd frontend && npm run dev"

clean:
	find . -name __pycache__ -type d -prune -exec rm -rf {} + 2>/dev/null || true
	rm -rf $(BACKEND)/.pytest_cache $(BACKEND)/.mypy_cache $(BACKEND)/.ruff_cache \
	       $(BACKEND)/.hypothesis $(FRONTEND)/dist
