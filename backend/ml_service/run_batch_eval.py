"""
===========================================================================
  NIFTY 50 BATCH DISSERTATION EVALUATION PIPELINE
  AI-Driven Stock Market Forecasting - Final Year Project
===========================================================================
  Runs all 6 models on every Nifty 50 stock found in stock_data/.
  
  Output folders created automatically:
    processed_data/          - Feature-engineered CSVs (OHLCV + indicators)
    dissertation_results/    - Per-stock metrics CSVs + master summary

  Usage:
    cd backend/ml_service

    # Run ALL Nifty 50 stocks found in stock_data/:
    python run_batch_eval.py

    # Run specific stocks only:
    python run_batch_eval.py RELIANCE TCS INFY

    # Re-run skipping already-completed stocks:
    python run_batch_eval.py --skip-done

  Options:
    --epochs N       LSTM/CNN-LSTM training epochs (default: 20)
    --skip-done      Skip symbols already in the master summary CSV
    --only-stats     Only run ARIMA + SARIMA (fast, no deep learning)
    --only-classic   Only run ARIMA, SARIMA, RF, XGBoost (no deep learning)
    --only-trees     Only run RF and XGBoost
===========================================================================
"""

import os
import sys
import warnings
import time
import pandas as pd
import numpy as np

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
STOCK_DATA_DIR     = "stock_data"
PROCESSED_DATA_DIR = "processed_data"
RESULTS_DIR        = "dissertation_results"
MASTER_CSV         = os.path.join(RESULTS_DIR, "NIFTY50_master_dissertation_metrics.csv")

# Nifty 50 canonical symbol list (as downloaded from Yahoo Finance .NS)
NIFTY50_SYMBOLS = [
    "ADANIENT", "ADANIPORTS", "APOLLOHOSP", "ASIANPAINT", "AXISBANK",
    "BAJAJ-AUTO", "BAJAJFINSV", "BAJFINANCE", "BHARTIARTL", "BPCL",
    "BRITANNIA", "CIPLA", "COALINDIA", "DIVISLAB", "DRREDDY",
    "EICHERMOT", "GRASIM", "HCLTECH", "HDFCBANK", "HDFCLIFE",
    "HEROMOTOCO", "HINDALCO", "HINDUNILVR", "ICICIBANK", "INDUSINDBK",
    "INFY", "ITC", "JSWSTEEL", "KOTAKBANK", "LT",
    "M&M", "MARUTI", "NESTLEIND", "NTPC", "ONGC",
    "POWERGRID", "RELIANCE", "SBIN", "SBILIFE", "SHRIRAMFIN",
    "SUNPHARMA", "TATACONSUM", "TATASTEEL", "TCS", "TECHM",
    "TITAN", "ULTRACEMCO", "WIPRO", "LTM", "TMPV",
]

# ---------------------------------------------------------------------------
# Metric columns in order
# ---------------------------------------------------------------------------
REGRESSION_COLS  = ["RMSE", "MAE", "MAPE", "R2"]
DIRECTION_COLS   = ["Directional_Accuracy", "Precision", "Recall", "F1_Score"]
ALL_METRIC_COLS  = REGRESSION_COLS + DIRECTION_COLS

# ---------------------------------------------------------------------------
# Auto-detect available stocks from the stock_data folder
# ---------------------------------------------------------------------------
def detect_available_symbols():
    """Return all stock symbols with a CSV file in stock_data/, excluding indices."""
    found = []
    for fname in sorted(os.listdir(STOCK_DATA_DIR)):
        if fname.endswith(".csv") and not fname.startswith("^") and "_processed" not in fname:
            sym = fname.replace(".csv", "")
            found.append(sym)
    return found


# ---------------------------------------------------------------------------
# Table printing helper
# ---------------------------------------------------------------------------
def _fmt(val, col):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return "   N/A "
    if col == "MAPE":
        return f"{val:6.2f}%"
    if col == "Directional_Accuracy":
        return f"{val:5.2f}%"
    if col == "R2":
        return f"{val:7.4f}"
    return f"{val:7.4f}"

def print_comparison_table(symbol, results):
    col_w = 14
    metric_labels = {
        "RMSE":                "RMSE       ",
        "MAE":                 "MAE        ",
        "MAPE":                "MAPE (%)   ",
        "R2":                  "R2         ",
        "Directional_Accuracy":"Dir.Acc(%) ",
        "Precision":           "Precision  ",
        "Recall":              "Recall     ",
        "F1_Score":            "F1-Score   ",
    }
    models = [r["Model"] for r in results]
    width  = 14 + col_w * len(models)
    header = f"{'Metric':<14}" + "".join(f"{m:>{col_w}}" for m in models)

    print()
    print("=" * width)
    print(f"  RESULTS TABLE --- {symbol}")
    print(f"  Train: 80%  |  Test: 20% (last ~2 yrs)")
    print("=" * width)
    print(header)
    print("-" * width)
    for col in ALL_METRIC_COLS:
        row = f"{metric_labels.get(col, col):<14}"
        for r in results:
            row += f"{_fmt(r.get(col), col):>{col_w}}"
        print(row)
    print("=" * width)
    print()


# ---------------------------------------------------------------------------
# Per-model evaluators (all imports inside try/except)
# ---------------------------------------------------------------------------

def eval_arima(symbol):
    print("  [ARIMA]   ...", end=" ", flush=True)
    try:
        from train_arima import evaluate_arima
        m = evaluate_arima(symbol)
        m["Model"] = "ARIMA"
        print("OK")
        return m
    except Exception as e:
        print(f"FAILED ({e})")
        return {"Model": "ARIMA"}

def eval_sarima(symbol):
    print("  [SARIMA]  ...", end=" ", flush=True)
    try:
        from train_sarima import evaluate_sarima
        m = evaluate_sarima(symbol)
        m["Model"] = "SARIMA"
        print("OK")
        return m
    except Exception as e:
        print(f"FAILED ({e})")
        return {"Model": "SARIMA"}

def eval_rf(symbol):
    print("  [RF]      ...", end=" ", flush=True)
    try:
        from train_rf import train_rf_model
        _, m = train_rf_model(symbol)
        m["Model"] = "Random Forest"
        print("OK")
        return m
    except Exception as e:
        print(f"FAILED ({e})")
        return {"Model": "Random Forest"}

def eval_xgb(symbol):
    print("  [XGBoost] ...", end=" ", flush=True)
    try:
        from train_xgb import train_xgb_model
        _, m = train_xgb_model(symbol)
        m["Model"] = "XGBoost"
        print("OK")
        return m
    except Exception as e:
        print(f"FAILED ({e})")
        return {"Model": "XGBoost"}

def eval_lstm(symbol, epochs):
    print(f"  [LSTM]    ... ({epochs} epochs)", end=" ", flush=True)
    try:
        from train_lstm import train_model
        _, m = train_model(symbol, epochs=epochs)
        m["Model"] = "LSTM"
        print("OK")
        return m
    except Exception as e:
        print(f"FAILED ({e})")
        return {"Model": "LSTM"}

def eval_cnn_lstm(symbol, epochs):
    print(f"  [CNN-LSTM]... ({epochs} epochs)", end=" ", flush=True)
    try:
        from train_cnn_lstm import train_cnn_lstm_model
        _, m = train_cnn_lstm_model(symbol, epochs=epochs)
        m["Model"] = "CNN-LSTM"
        print("OK")
        return m
    except Exception as e:
        print(f"FAILED ({e})")
        return {"Model": "CNN-LSTM"}


# ---------------------------------------------------------------------------
# Per-symbol evaluation
# ---------------------------------------------------------------------------

def evaluate_symbol(symbol, lstm_epochs=20, only_stats=False, only_classic=False, only_trees=False):
    """
    Runs all models on a single stock symbol.
    Returns a list of metric dicts (one per model) + prints the summary table.
    """
    data_path = os.path.join(STOCK_DATA_DIR, f"{symbol}.csv")
    if not os.path.exists(data_path):
        print(f"  SKIP: {symbol}.csv not found in {STOCK_DATA_DIR}/")
        return []

    # Confirm data range
    try:
        from preprocess import load_stock_data
        df_check = load_stock_data(symbol)
        total_days = len(df_check)
        train_days = int(total_days * 0.8)
        test_days  = total_days - train_days
        date_start = df_check.index[0].date()
        date_split = df_check.index[train_days - 1].date()
        date_end   = df_check.index[-1].date()
        print(f"  Data: {total_days} days  "
              f"Train: {date_start} to {date_split}  "
              f"Test: {date_split} to {date_end} ({test_days} days)")
        if total_days < 500:
            print(f"  WARNING: Only {total_days} trading days — results may be unreliable.")
    except Exception as e:
        print(f"  WARNING: Could not read date range: {e}")

    results = []
    
    if not only_trees:
        results.append(eval_arima(symbol))
        results.append(eval_sarima(symbol))

    if not only_stats:
        results.append(eval_rf(symbol))
        results.append(eval_xgb(symbol))
        if not only_classic and not only_trees:
            results.append(eval_lstm(symbol, lstm_epochs))
            results.append(eval_cnn_lstm(symbol, lstm_epochs))

    print_comparison_table(symbol, results)

    # --- Save per-stock CSV to dissertation_results/ ---
    os.makedirs(RESULTS_DIR, exist_ok=True)
    stock_csv = os.path.join(RESULTS_DIR, f"{symbol}_metrics.csv")
    df_out = pd.DataFrame(results)
    cols_out = ["Model"] + [c for c in ALL_METRIC_COLS if c in df_out.columns]
    df_out[cols_out].to_csv(stock_csv, index=False)
    print(f"  Saved: {stock_csv}")

    return results


# ---------------------------------------------------------------------------
# Master summary builder
# ---------------------------------------------------------------------------

def append_to_master(symbol, results):
    """
    Appends this symbol's best-model row (and all model rows) to the master CSV.
    Each row has Symbol + Model + all metrics.
    """
    rows = []
    for r in results:
        row = {"Symbol": symbol}
        row.update(r)
        rows.append(row)

    new_df = pd.DataFrame(rows)
    cols   = ["Symbol", "Model"] + [c for c in ALL_METRIC_COLS if c in new_df.columns]
    new_df = new_df[[c for c in cols if c in new_df.columns]]

    if os.path.exists(MASTER_CSV):
        existing = pd.read_csv(MASTER_CSV)
        # Only overwrite rows for the exact models we just ran for this symbol
        models_run = [r["Model"] for r in results]
        mask = (existing["Symbol"] == symbol) & (existing["Model"].isin(models_run))
        existing = existing[~mask]
        combined = pd.concat([existing, new_df], ignore_index=True)
    else:
        combined = new_df

    combined.to_csv(MASTER_CSV, index=False)


def print_master_summary():
    """Prints a condensed best-model-per-stock summary table at the end."""
    if not os.path.exists(MASTER_CSV):
        return

    df = pd.read_csv(MASTER_CSV)
    # Pick CNN-LSTM row per symbol (or best available by RMSE)
    preferred = ["CNN-LSTM", "LSTM", "XGBoost", "Random Forest", "SARIMA", "ARIMA"]
    rows = []
    for sym, grp in df.groupby("Symbol"):
        for model in preferred:
            match = grp[grp["Model"] == model]
            if not match.empty and not pd.isna(match.iloc[0].get("RMSE")):
                rows.append(match.iloc[0])
                break

    summary = pd.DataFrame(rows).reset_index(drop=True)
    print()
    print("=" * 100)
    print("  NIFTY 50 MASTER SUMMARY  —  Best Model Per Stock (preferring CNN-LSTM)")
    print("=" * 100)
    cols_show = ["Symbol", "Model", "RMSE", "MAE", "MAPE", "R2",
                 "Directional_Accuracy", "Precision", "Recall", "F1_Score"]
    cols_show = [c for c in cols_show if c in summary.columns]
    print(summary[cols_show].to_string(index=False))
    print("=" * 100)
    print(f"\n  Full master CSV: {MASTER_CSV}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def parse_args():
    args   = sys.argv[1:]
    epochs = 20
    skip   = False
    only_s = False
    only_c = False
    only_t = False
    syms   = []

    i = 0
    while i < len(args):
        a = args[i]
        if a == "--epochs" and i + 1 < len(args):
            epochs = int(args[i + 1]); i += 2
        elif a == "--skip-done":
            skip = True; i += 1
        elif a == "--only-stats":
            only_s = True; i += 1
        elif a == "--only-classic":
            only_c = True; i += 1
        elif a == "--only-trees":
            only_t = True; i += 1
        elif not a.startswith("--"):
            syms.append(a.upper()); i += 1
        else:
            i += 1

    return syms, epochs, skip, only_s, only_c, only_t


if __name__ == "__main__":
    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
    os.makedirs(RESULTS_DIR, exist_ok=True)

    requested_syms, lstm_epochs, skip_done, only_stats, only_classic, only_trees = parse_args()

    # Determine symbol list
    if requested_syms:
        symbols = requested_syms
    else:
        # Auto-detect all CSVs in stock_data that match Nifty 50 list
        available = set(detect_available_symbols())
        symbols   = [s for s in NIFTY50_SYMBOLS if s in available]
        # Also include any extras in stock_data that are real stocks (not indices)
        extras = [s for s in available if s not in NIFTY50_SYMBOLS]
        if extras:
            print(f"\n  Also found extra symbols: {extras} — adding to run.")
            symbols += extras

    # Skip already-done symbols if requested
    if skip_done and os.path.exists(MASTER_CSV):
        done = set(pd.read_csv(MASTER_CSV)["Symbol"].unique())
        symbols = [s for s in symbols if s not in done]
        print(f"\n  --skip-done: {len(symbols)} symbols remaining.")

    total = len(symbols)
    print()
    print("=" * 70)
    print(f"  NIFTY 50 BATCH DISSERTATION EVALUATION")
    print(f"  Total symbols : {total}")
    print(f"  LSTM epochs   : {lstm_epochs}")
    print(f"  Only stats    : {only_stats}")
    print(f"  Only classic  : {only_classic}")
    print(f"  Only trees    : {only_trees}")
    print(f"  Results dir   : {RESULTS_DIR}/")
    print(f"  Processed dir : {PROCESSED_DATA_DIR}/")
    print("=" * 70)

    t0_total = time.time()
    completed = 0
    failed_syms = []

    for idx, sym in enumerate(symbols, 1):
        print()
        print(f"{'='*70}")
        print(f"  [{idx}/{total}] {sym}")
        print(f"{'='*70}")
        t0 = time.time()

        try:
            results = evaluate_symbol(sym, lstm_epochs=lstm_epochs, only_stats=only_stats, only_classic=only_classic, only_trees=only_trees)
            if results:
                append_to_master(sym, results)
                completed += 1
                elapsed = time.time() - t0
                remaining = (time.time() - t0_total) / idx * (total - idx)
                print(f"  Done in {elapsed:.1f}s  |  Est. remaining: {remaining/60:.1f} min")
        except Exception as e:
            print(f"  ERROR processing {sym}: {e}")
            failed_syms.append(sym)

    # Final summary
    elapsed_total = (time.time() - t0_total) / 60
    print()
    print("=" * 70)
    print(f"  BATCH COMPLETE")
    print(f"  Processed : {completed}/{total} symbols")
    print(f"  Failed    : {failed_syms if failed_syms else 'None'}")
    print(f"  Total time: {elapsed_total:.1f} min")
    print("=" * 70)

    print_master_summary()
