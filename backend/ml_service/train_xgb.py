import os
import pickle
import numpy as np
from xgboost import XGBRegressor
from preprocess import load_stock_data, prepare_lstm_data, add_technical_indicators
from metrics import calculate_metrics, print_metrics

def train_xgb_model(symbol, lookback_window=60):
    print(f"\n--- Training XGBoost model for {symbol} ---")
    
    df = load_stock_data(symbol, last_n_years=12)
    df = add_technical_indicators(df)
    
    X_train, y_train, X_test, y_test, scaler = prepare_lstm_data(
        df, lookback_window=lookback_window, train_split=0.8
    )
    
    X_train_flat = X_train.reshape(X_train.shape[0], -1)
    X_test_flat = X_test.reshape(X_test.shape[0], -1)
    
    y_train_close = y_train[:, 3]
    y_test_close = y_test[:, 3]
    
    model = XGBRegressor(n_estimators=100, learning_rate=0.1, random_state=42, n_jobs=-1)
    model.fit(X_train_flat, y_train_close)
    
    predictions = model.predict(X_test_flat)
    
    # Pad to 11 columns (scaler was fit on 11 features: OHLCV + 6 indicators)
    dummy_preds = np.zeros((len(y_test), 11))
    dummy_preds[:, 3] = predictions
    preds_unscaled = scaler.inverse_transform(dummy_preds)[:, 3]
    
    dummy_test = np.zeros((len(y_test), 11))
    dummy_test[:, 3] = y_test_close
    y_test_unscaled = scaler.inverse_transform(dummy_test)[:, 3]
    
    y_prev_scaled = X_test[:, -1, 3]
    dummy_prev = np.zeros((len(y_test), 11))
    dummy_prev[:, 3] = y_prev_scaled
    y_prev_unscaled = scaler.inverse_transform(dummy_prev)[:, 3]
    
    metrics = calculate_metrics(y_test_unscaled, preds_unscaled, y_prev_unscaled)
    print_metrics("XGBoost", metrics)
    
    os.makedirs("models", exist_ok=True)
    model_path = os.path.join("models", f"xgb_{symbol}.pkl")
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
        
    return model_path, metrics

if __name__ == "__main__":
    train_xgb_model("RELIANCE")
