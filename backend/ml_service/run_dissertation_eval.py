"""
===========================================================================
  DISSERTATION EVALUATION PIPELINE
  AI-Driven Stock Market Forecasting - Final Year Project
===========================================================================
  TRAIN / TEST SPLIT: 80% training (≈13 years) | 20% testing (≈2 years)

  Models evaluated:
    1. ARIMA
    2. SARIMA
    3. Random Forest
    4. XGBoost
    5. LSTM
    6. CNN-LSTM

  Metrics reported per model:
    Regression   → RMSE, MAE, MAPE, R²
    Directional  → Accuracy, Precision, Recall, F1-Score

  Usage:
    cd backend/ml_service
    python run_dissertation_eval.py RELIANCE
    python run_dissertation_eval.py TCS
    python run_dissertation_eval.py RELIANCE INFY TCS      (multiple symbols)
===========================================================================
"""

import os
import sys
import warnings
import pandas as pd
import numpy as np

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Helper: Pretty-print the final comparison table
# ---------------------------------------------------------------------------
REGRESSION_COLS    = ["RMSE", "MAE", "MAPE", "R2"]
DIRECTIONAL_COLS   = ["Directional_Accuracy", "Precision", "Recall", "F1_Score"]
ALL_METRIC_COLS    = REGRESSION_COLS + DIRECTIONAL_COLS

def _fmt(val, col):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return "  N/A  "
    if col == "MAPE":
        return f"{val:7.2f}%"
    if col == "Directional_Accuracy":
        return f"{val:6.2f}%"
    if col == "R2":
        return f"{val:7.4f}"
    return f"{val:7.4f}"

def print_comparison_table(symbol, results):
    """
    Prints a nicely formatted ASCII comparison table of all models x all metrics.
    """
    col_w = 14
    metric_labels = {
        "RMSE":                "RMSE       ",
        "MAE":                 "MAE        ",
        "MAPE":                "MAPE (%)   ",
        "R2":                  "R2         ",
        "Directional_Accuracy":"Dir. Acc(%)",
        "Precision":           "Precision  ",
        "Recall":              "Recall     ",
        "F1_Score":            "F1-Score   ",
    }

    models = [r["Model"] for r in results]
    header_line = f"{'Metric':<14}" + "".join(f"{m:>{col_w}}" for m in models)

    print()
    print("=" * (14 + col_w * len(models)))
    print(f"  DISSERTATION RESULTS TABLE --- {symbol}")
    print(f"  Train: 80% (~13 yrs)   |   Test: 20% (~2 yrs)")
    print("=" * (14 + col_w * len(models)))
    print(header_line)
    print("-" * (14 + col_w * len(models)))

    for col in ALL_METRIC_COLS:
        row = f"{metric_labels.get(col, col):<14}"
        for r in results:
            val = r.get(col, None)
            row += f"{_fmt(val, col):>{col_w}}"
        print(row)

    print("=" * (14 + col_w * len(models)))
    print()


def export_csv(symbol, results):
    """Export the metrics table to CSV inside stock_data/."""
    df = pd.DataFrame(results)
    cols = ["Model"] + ALL_METRIC_COLS
    cols = [c for c in cols if c in df.columns]
    df = df[cols]

    out_path = os.path.join("stock_data", f"{symbol}_dissertation_metrics.csv")
    df.to_csv(out_path, index=False)
    print(f"\n  Metrics exported to: {out_path}")
    return out_path


# ---------------------------------------------------------------------------
# Individual model evaluators
# ---------------------------------------------------------------------------

def eval_arima(symbol):
    print("\n[ARIMA] Evaluating ...")
    try:
        from train_arima import evaluate_arima
        m = evaluate_arima(symbol)
        m["Model"] = "ARIMA"
        return m
    except Exception as e:
        print(f"  ARIMA failed: {e}")
        return {"Model": "ARIMA"}


def eval_sarima(symbol):
    print("\n[SARIMA] Evaluating ...")
    try:
        from train_sarima import evaluate_sarima
        m = evaluate_sarima(symbol)
        m["Model"] = "SARIMA"
        return m
    except Exception as e:
        print(f"  SARIMA failed: {e}")
        return {"Model": "SARIMA"}


def eval_random_forest(symbol):
    print("\n[Random Forest] Training & Evaluating ...")
    try:
        from train_rf import train_rf_model
        _, m = train_rf_model(symbol)
        m["Model"] = "Random Forest"
        return m
    except Exception as e:
        print(f"  Random Forest failed: {e}")
        return {"Model": "Random Forest"}


def eval_xgboost(symbol):
    print("\n[XGBoost] Training & Evaluating ...")
    try:
        from train_xgb import train_xgb_model
        _, m = train_xgb_model(symbol)
        m["Model"] = "XGBoost"
        return m
    except Exception as e:
        print(f"  XGBoost failed: {e}")
        return {"Model": "XGBoost"}


def eval_lstm(symbol, epochs=20):
    print(f"\n[LSTM] Training ({epochs} epochs) & Evaluating ...")
    try:
        from train_lstm import train_model
        _, m = train_model(symbol, epochs=epochs)
        m["Model"] = "LSTM"
        return m
    except Exception as e:
        print(f"  LSTM failed: {e}")
        return {"Model": "LSTM"}


def eval_cnn_lstm(symbol, epochs=20):
    print(f"\n[CNN-LSTM] Training ({epochs} epochs) & Evaluating ...")
    try:
        from train_cnn_lstm import train_cnn_lstm_model
        _, m = train_cnn_lstm_model(symbol, epochs=epochs)
        m["Model"] = "CNN-LSTM"
        return m
    except Exception as e:
        print(f"  CNN-LSTM failed: {e}")
        return {"Model": "CNN-LSTM"}


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_evaluation(symbol, lstm_epochs=20):
    print()
    print("=" * 65)
    print(f"  STARTING DISSERTATION EVALUATION PIPELINE")
    print(f"  Symbol  : {symbol}")
    print(f"  Split   : 80% train (~13 yrs) | 20% test (~2 yrs)")
    print(f"  Metrics : RMSE, MAE, MAPE, R2  +  Dir.Acc, Precision, Recall, F1")
    print("=" * 65)

    data_path = os.path.join("stock_data", f"{symbol}.csv")
    if not os.path.exists(data_path):
        print(f"\n  ERROR: Data file not found: {data_path}")
        print(f"  Run download_data.py first to fetch {symbol}.")
        return

    try:
        from preprocess import load_stock_data
        df_check = load_stock_data(symbol)
        total_days = len(df_check)
        train_days = int(total_days * 0.8)
        test_days  = total_days - train_days
        print(f"\n  Total trading days : {total_days}")
        print(f"  Train set          : {train_days} days  "
              f"({df_check.index[0].date()} to {df_check.index[train_days-1].date()})")
        print(f"  Test set           : {test_days} days  "
              f"({df_check.index[train_days].date()} to {df_check.index[-1].date()})")
    except Exception as e:
        print(f"  WARNING: Could not read date range: {e}")

    results = []
    results.append(eval_arima(symbol))
    results.append(eval_sarima(symbol))
    results.append(eval_random_forest(symbol))
    results.append(eval_xgboost(symbol))
    results.append(eval_lstm(symbol, epochs=lstm_epochs))
    results.append(eval_cnn_lstm(symbol, epochs=lstm_epochs))

    print_comparison_table(symbol, results)
    export_csv(symbol, results)

    print("  EVALUATION COMPLETE. Copy the table above into your dissertation.\n")


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Default symbol is RELIANCE; pass one or more symbols as CLI arguments
    # e.g.:  python run_dissertation_eval.py RELIANCE TCS INFY
    symbols = sys.argv[1:] if len(sys.argv) > 1 else ["RELIANCE"]

    # Increase LSTM_EPOCHS to 50 for better accuracy (takes longer)
    LSTM_EPOCHS = 20

    for sym in symbols:
        run_evaluation(sym.upper().strip(), lstm_epochs=LSTM_EPOCHS)
