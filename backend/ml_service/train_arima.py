import os
import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from preprocess import load_stock_data
from metrics import calculate_metrics, print_metrics
import warnings

# Suppress ConvergenceWarnings from statsmodels
warnings.filterwarnings("ignore")

def fit_single_arima(series, forecast_days=30):
    order = (5, 1, 0)
    try:
        model = ARIMA(series, order=order)
        model_fit = model.fit()
        return model_fit.forecast(steps=forecast_days).tolist()
    except Exception as e:
        print(f"ARIMA fit failed with order {order}: {str(e)}. Retrying with simpler order (1, 1, 0)...")
        try:
            model = ARIMA(series, order=(1, 1, 0))
            model_fit = model.fit()
            return model_fit.forecast(steps=forecast_days).tolist()
        except Exception as ex:
            print(f"Fallback ARIMA fit failed: {str(ex)}")
            # Fallback to naive drift prediction if ARIMA completely fails
            last_val = series[-1]
            drift = (series[-1] - series[0]) / len(series)
            return [last_val + (i * drift) for i in range(1, forecast_days + 1)]

def fit_arima_forecast(symbol, forecast_days=30):
    """
    Loads stock data, fits ARIMA models for Open, High, Low, Close, and Volume,
    and returns a list of dictionaries containing future predictions.
    """
    print(f"\n--- Fitting Multivariate ARIMA models for {symbol} ---")
    
    # 1. Load Data
    df = load_stock_data(symbol)
    
    forecasts = {}
    for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
        forecasts[col] = fit_single_arima(df[col].values, forecast_days=forecast_days)
        
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
        
    print(f"ARIMA multivariate fit completed. Forecasted {forecast_days} steps.")
    return forecast_result

def evaluate_arima(symbol):
    df = load_stock_data(symbol, last_n_years=7)
    
    # 5-year train / 2-year test chronological split out of 7 years total
    split_idx = int(len(df) * (5/7))
    train_data = df['Close'].values[:split_idx]
    test_data = df['Close'].values[split_idx:]
    
    print(f"\n--- Evaluating ARIMA on {symbol} (Test Size: {len(test_data)}) ---")
    
    try:
        model = ARIMA(train_data, order=(5, 1, 0))
        model_fit = model.fit()
        predictions = model_fit.forecast(steps=len(test_data))
    except:
        model = ARIMA(train_data, order=(1, 1, 0))
        model_fit = model.fit()
        predictions = model_fit.forecast(steps=len(test_data))
        
    y_prev = df['Close'].values[split_idx - 1 : -1]
    
    metrics = calculate_metrics(test_data, predictions, y_prev)
    print_metrics("ARIMA (Close Price)", metrics)
    return metrics

if __name__ == "__main__":
    # Test ARIMA with RELIANCE
    forecast = fit_arima_forecast("RELIANCE", forecast_days=5)
    print("Forecasted prices sample (first step):", forecast[0])
    evaluate_arima("RELIANCE")
