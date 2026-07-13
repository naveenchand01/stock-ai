import os
import pandas as pd
from preprocess import load_stock_data
from train_arima import evaluate_arima
from train_lstm import train_model as train_lstm
from train_cnn_lstm import train_cnn_lstm_model
from train_rf import train_rf_model
from train_xgb import train_xgb_model
from train_sarima import evaluate_sarima
from train_sarimax import evaluate_sarimax
from train_arima_lstm import train_arima_lstm_model

def evaluate_all_models(symbol="RELIANCE"):
    print("=" * 60)
    print(f"DISSERTATION EVALUATION PIPELINE: {symbol}")
    print("=" * 60)
    
    # Check data
    try:
        df = load_stock_data(symbol)
        print(f"Found {len(df)} days of historical data for {symbol}.")
    except Exception as e:
        print(f"Error loading data: {e}")
        return
        
    all_metrics = []
    
    print("\n[1/7] Evaluating Statistical Baseline: ARIMA")
    try:
        metrics = evaluate_arima(symbol)
        metrics['Model'] = 'ARIMA'
        all_metrics.append(metrics)
    except Exception as e:
        print(f"ARIMA evaluation failed: {e}")
        
    print("\n[2/7] Evaluating ML Baseline: Random Forest")
    try:
        _, metrics = train_rf_model(symbol)
        metrics['Model'] = 'Random Forest'
        all_metrics.append(metrics)
    except Exception as e:
        print(f"RF evaluation failed: {e}")
        
    print("\n[3/7] Evaluating Advanced ML Baseline: XGBoost")
    try:
        _, metrics = train_xgb_model(symbol)
        metrics['Model'] = 'XGBoost'
        all_metrics.append(metrics)
    except Exception as e:
        print(f"XGBoost evaluation failed: {e}")
        
    print("\n[4/7] Evaluating Deep Learning Model: LSTM")
    try:
        # LSTM auto-trains and evaluates in the train script
        _, metrics = train_lstm(symbol, epochs=5)
        metrics['Model'] = 'LSTM'
        all_metrics.append(metrics)
    except Exception as e:
        print(f"LSTM evaluation failed: {e}")
        
    print("\n[5/7] Evaluating Hybrid Deep Learning Model: CNN-LSTM")
    try:
        _, metrics = train_cnn_lstm_model(symbol, epochs=5)
        metrics['Model'] = 'CNN-LSTM'
        all_metrics.append(metrics)
    except Exception as e:
        print(f"CNN-LSTM evaluation failed: {e}")
        
    print("\n[6/8] Evaluating Hybrid Deep Learning Model: ARIMA-LSTM")
    try:
        _, metrics = train_arima_lstm_model(symbol, epochs=5)
        metrics['Model'] = 'ARIMA-LSTM'
        all_metrics.append(metrics)
    except Exception as e:
        print(f"ARIMA-LSTM evaluation failed: {e}")
        
    print("\n[7/8] Evaluating Statistical Seasonal Baseline: SARIMA")
    try:
        metrics = evaluate_sarima(symbol)
        metrics['Model'] = 'SARIMA'
        all_metrics.append(metrics)
    except Exception as e:
        print(f"SARIMA evaluation failed: {e}")

    print("\n[8/8] Evaluating Statistical Seasonal Exogenous Baseline: SARIMAX")
    try:
        metrics = evaluate_sarimax(symbol)
        metrics['Model'] = 'SARIMAX'
        all_metrics.append(metrics)
    except Exception as e:
        print(f"SARIMAX evaluation failed: {e}")
        
    # Export all metrics to CSV
    if all_metrics:
        results_df = pd.DataFrame(all_metrics)
        # Reorder columns to have Model first
        cols = ['Model'] + [col for col in results_df.columns if col != 'Model']
        results_df = results_df[cols]
        
        export_path = os.path.join("stock_data", f"{symbol}_evaluation_metrics.csv")
        results_df.to_csv(export_path, index=False)
        print(f"\n=> Successfully exported evaluation metrics to: {export_path}")
        
    print("\n" + "=" * 60)
    print("ALL EVALUATIONS COMPLETE.")
    print("Copy the printed metric tables or CSV file into your dissertation paper!")
    print("=" * 60)

if __name__ == "__main__":
    evaluate_all_models("RELIANCE")
