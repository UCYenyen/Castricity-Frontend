/**
 * Hardcoded model evaluation metrics on the held-out **test split** (2023).
 *
 * Source: output of `python Scripts/hybrid_model.py` in the FindITDataset repo.
 * Update these values after each retrain — they are the only honest
 * generalisation numbers; the global `/api/metrics` average is dominated
 * by in-sample training rows and is too optimistic to surface.
 *
 * Last updated: 2026-05-14 — hybrid_model.py run with FORCE_RETUNE=1.
 */
export const TEST_SET_METRICS = {
  mae: 22871.91,
  rmse: 54870.41,
  mape: 3.65,
  n_samples: 285,
} as const;
