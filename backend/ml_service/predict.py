import os
import pickle
import numpy as np
import pandas as pd
import torch
from preprocess import load_stock_data, add_technical_indicators
from train_lstm import StockLSTM
from train_cnn_lstm import CNN_LSTM
from train_arima import fit_arima_forecast

def predict_ml_model(symbol, model_type, forecast_days=30, lookback_window=60):
    """
    Universal rolling forecaster for LSTM, CNN-LSTM, RF, and XGBOOST.
    Uses rolling history to recalculate technical indicators dynamically.
    """
    model_type = model_type.upper()
    
    # Map model types to their files and classes
    if model_type == "LSTM":
        model_path = os.path.join("models", f"lstm_{symbol}.pth")
    elif model_type == "CNN-LSTM":
        model_path = os.path.join("models", f"cnnlstm_{symbol}.pth")
    elif model_type in ["RF", "RANDOM_FOREST"]:
        model_path = os.path.join("models", f"rf_{symbol}.pkl")
    elif model_type in ["XGBOOST", "XGB"]:
        model_path = os.path.join("models", f"xgb_{symbol}.pkl")
    else:
        raise ValueError("Invalid model type")

    scaler_path = os.path.join("models", f"scaler_{symbol}.pkl")
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        raise FileNotFoundError(f"Trained {model_type} model or scaler not found for {symbol}. Please train the model first.")

    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)
        
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Load PyTorch or SKLearn models
    if model_type == "LSTM":
        model = StockLSTM(input_size=11, hidden_size=64, num_layers=2, output_size=5)
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.to(device)
        model.eval()
    elif model_type == "CNN-LSTM":
        model = CNN_LSTM(input_size=11, output_size=5)
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.to(device)
        model.eval()
    else:
        with open(model_path, 'rb') as f:
            sklearn_model = pickle.load(f)

    # Get raw history to calculate rolling indicators
    df_raw = load_stock_data(symbol)
    # We need ~150 days to calculate 50-day SMA and MACD safely
    df_history = df_raw[['Open', 'High', 'Low', 'Close', 'Volume']].tail(200).copy()
    
    predictions = []
    
    for _ in range(forecast_days):
        # 1. Calculate indicators on current history
        current_df = add_technical_indicators(df_history.copy())
        cols = ['Open', 'High', 'Low', 'Close', 'Volume', 'SMA_50', 'EMA_20', 'RSI_14', 'MACD', 'BB_up', 'BB_low']
        
        # 2. Extract last lookback window
        recent_data = current_df[cols].values[-lookback_window:]
        
        # 3. Scale
        current_batch = scaler.transform(recent_data)
        
        # 4. Predict
        if model_type in ["LSTM", "CNN-LSTM"]:
            current_batch_t = torch.FloatTensor(current_batch.reshape(1, lookback_window, len(cols))).to(device)
            with torch.no_grad():
                pred_scaled = model(current_batch_t).cpu().numpy()[0]
        else:
            # For RF and XGB, input must be flattened
            current_batch_flat = current_batch.reshape(1, -1)
            # SKLearn models only predict Close price in our setup, 
            # so we'll mock the other 4 features using the last known values + drift.
            close_pred_scaled = sklearn_model.predict(current_batch_flat)[0]
            # Create a mock 5-feature vector using the last scaled values, updating Close
            pred_scaled = current_batch[-1][:5].copy()
            pred_scaled[3] = close_pred_scaled

        # 5. Inverse scale
        dummy_array = np.zeros(11)
        dummy_array[:5] = pred_scaled
        pred_unscaled = scaler.inverse_transform([dummy_array])[0][:5]
        
        predictions.append(pred_unscaled)
        
        # 6. Append to history
        next_date = df_history.index[-1] + pd.Timedelta(days=1)
        new_row = pd.DataFrame([pred_unscaled], columns=['Open', 'High', 'Low', 'Close', 'Volume'], index=[next_date])
        df_history = pd.concat([df_history, new_row])

    # Format result
    forecast_result = []
    for pred in predictions:
        forecast_result.append({
            "open": float(pred[0]),
            "high": float(pred[1]),
            "low": float(pred[2]),
            "close": float(pred[3]),
            "volume": float(pred[4])
        })
        
    return forecast_result

def predict_arima_lstm(symbol, forecast_days=30):
    """
    Performs ARIMA-LSTM prediction.
    As described in Nensi et al. (2025).
    """
    from train_arima_lstm import ResidualLSTM, train_arima_lstm_model
    from statsmodels.tsa.arima.model import ARIMA
    import torch
    
    cols = ['Open', 'High', 'Low', 'Close', 'Volume']
    df = load_stock_data(symbol)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    for col in cols:
        model_path = os.path.join("models", f"arima_lstm_{symbol}_{col}.pth")
        scaler_path = os.path.join("models", f"arima_lstm_scaler_{symbol}_{col}.pkl")
        if not os.path.exists(model_path) or not os.path.exists(scaler_path):
            print(f"ARIMA-LSTM model/scaler missing for {symbol} ({col}). Training...")
            train_arima_lstm_model(symbol, epochs=10) # Lowered epochs for auto-train speed
            break
            
    predictions = {col: [] for col in cols}
    
    for col in cols:
        series = df[col].values
        
        # 1. Fit the base ARIMA model
        try:
            arima_model = ARIMA(series, order=(1, 1, 1))
            arima_fit = arima_model.fit()
        except:
            arima_model = ARIMA(series, order=(1, 1, 0))
            arima_fit = arima_model.fit()
            
        arima_forecast = arima_fit.forecast(steps=forecast_days)
        arima_forecast_vals = arima_forecast.values if hasattr(arima_forecast, 'values') else arima_forecast
        
        residuals = series - arima_fit.fittedvalues
        
        scaler_path = os.path.join("models", f"arima_lstm_scaler_{symbol}_{col}.pkl")
        model_path = os.path.join("models", f"arima_lstm_{symbol}_{col}.pth")
        
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
            
        model = ResidualLSTM(input_size=1, hidden_size=50, num_layers=1, output_size=1).to(device)
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.eval()
        
        last_residual = residuals[-1]
        current_val_scaled = scaler.transform(np.array([[last_residual]]))[0, 0]
        
        col_predictions = []
        
        with torch.no_grad():
            current_batch = np.array([[[current_val_scaled]]], dtype=np.float32)
            current_batch_t = torch.FloatTensor(current_batch).to(device)
            
            for i in range(forecast_days):
                pred_scaled = model(current_batch_t).cpu().numpy()[0, 0]
                pred_residual = scaler.inverse_transform(np.array([[pred_scaled]]))[0, 0]
                final_val = float(arima_forecast_vals[i] + pred_residual)
                col_predictions.append(final_val)
                
                current_batch = np.array([[[pred_scaled]]], dtype=np.float32)
                current_batch_t = torch.FloatTensor(current_batch).to(device)
                
        predictions[col] = col_predictions
        
    forecast_result = []
    for i in range(forecast_days):
        forecast_result.append({
            "open": float(predictions['Open'][i]),
            "high": float(predictions['High'][i]),
            "low": float(predictions['Low'][i]),
            "close": float(predictions['Close'][i]),
            "volume": float(predictions['Volume'][i])
        })
        
    return forecast_result

def generate_forecast(symbol, model_type="LSTM", forecast_days=30):
    model_type = model_type.upper()
    if model_type in ["LSTM", "CNN-LSTM", "RF", "RANDOM_FOREST", "XGBOOST", "XGB"]:
        return predict_ml_model(symbol, model_type, forecast_days=forecast_days)
    elif model_type == "ARIMA":
        return fit_arima_forecast(symbol, forecast_days=forecast_days)
    elif model_type == "SARIMA":
        from train_sarima import fit_sarima_forecast
        return fit_sarima_forecast(symbol, forecast_days=forecast_days)
    elif model_type == "SARIMAX":
        from train_sarimax import fit_sarimax_forecast
        return fit_sarimax_forecast(symbol, forecast_days=forecast_days)
    elif model_type == "ARIMA-LSTM":
        return predict_arima_lstm(symbol, forecast_days=forecast_days)
    else:
        raise ValueError(f"Unknown model type: {model_type}")

if __name__ == "__main__":
    pass
