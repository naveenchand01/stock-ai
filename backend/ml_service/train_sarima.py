import os
import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
from preprocess import load_stock_data
from metrics import calculate_metrics, print_metrics
import warnings

# Suppress ConvergenceWarnings from statsmodels
warnings.filterwarnings("ignore")

def fit_sarima_forecast(symbol, forecast_days=30):
    """
    Loads stock data, fits SARIMA models for Open, High, Low, Close, and Volume,
    and returns a list of dictionaries containing future predictions.
    """
    print(f"\n--- Fitting Multivariate SARIMA models for {symbol} ---")
    df = load_stock_data(symbol)
    
    forecasts = {}
    for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
        series = df[col].values
        try:
            model = SARIMAX(series, order=(1, 1, 1), seasonal_order=(1, 0, 0, 12))
            model_fit = model.fit(disp=False)
            forecasts[col] = model_fit.forecast(steps=forecast_days).tolist()
        except Exception as e:
            print(f"SARIMA fit failed for {col}: {str(e)}. Falling back to naive drift...")
            last_val = series[-1]
            drift = (series[-1] - series[0]) / len(series)
            forecasts[col] = [last_val + (i * drift) for i in range(1, forecast_days + 1)]
            
    # Reformat into a list of dictionaries
    forecast_result = []
    for i in range(forecast_days):
        forecast_result.append({
            "open": float(forecasts['Open'][i]),
            "high": float(forecasts['High'][i]),
            "low": float(forecasts['Low'][i]),
            "close": float(forecasts['Close'][i]),
            "volume": float(forecasts['Volume'][i])
        })
        
    print(f"SARIMA multivariate fit completed. Forecasted {forecast_days} steps.")
    return forecast_result

def evaluate_sarima(symbol):
    df = load_stock_data(symbol, last_n_years=5)
    
    # 80% train / 20% test chronological split
    split_idx = int(len(df) * 0.8)
    train_data = df['Close'].values[:split_idx]
    test_data = df['Close'].values[split_idx:]
    
    print(f"\n--- Evaluating SARIMA on {symbol} (Test Size: {len(test_data)}) ---")
    
    try:
        model = SARIMAX(train_data, order=(1, 1, 1), seasonal_order=(1, 0, 0, 12))
        model_fit = model.fit(disp=False)
        predictions = model_fit.forecast(steps=len(test_data))
    except Exception as e:
        print(f"Evaluation fit failed: {str(e)}. Using fallback...")
        last_val = train_data[-1]
        drift = (train_data[-1] - train_data[0]) / len(train_data)
        predictions = [last_val + (i * drift) for i in range(1, len(test_data) + 1)]
        
    y_prev = df['Close'].values[split_idx - 1 : -1]
    metrics = calculate_metrics(test_data, predictions, y_prev)
    print_metrics("SARIMA (Close Price)", metrics)
    return metrics

if __name__ == "__main__":
    evaluate_sarima("RELIANCE")
