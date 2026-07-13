
import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler

def load_stock_data(symbol, base_dir="stock_data"):
    """
    Loads stock data from CSV file, cleaning up multi-row headers if present.
    """
    filepath = os.path.join(base_dir, f"{symbol}.csv")
    if not os.path.exists(filepath):
        # Fallback to check without .csv extension if needed
        filepath = os.path.join(base_dir, symbol)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"No stock data CSV found for symbol: {symbol}")
            
    # Read the data, skipping the secondary headers (skiprow index 1 and 2)
    df = pd.read_csv(filepath, skiprows=[1, 2])
    
    # Rename 'Price' column to 'Date'
    df = df.rename(columns={'Price': 'Date'})
    
    # Clean up Date column and set as index
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values('Date')
    df.set_index('Date', inplace=True)
    
    return df

def prepare_lstm_data(series, lookback_window=60, train_split=0.8):
    """
    Preprocesses time series data for LSTM model training.
    Scales the values to [0, 1] and creates sliding window sequences.
    """
    # Reshape series for scaler
    values = series.values.reshape(-1, 1)
    
    # Scale values to [0, 1]
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_values = scaler.fit_transform(values)
    
    X, y = [], []
    for i in range(lookback_window, len(scaled_values)):
        X.append(scaled_values[i - lookback_window:i, 0])
        y.append(scaled_values[i, 0])
        
    X, y = np.array(X), np.array(y)
    
    # Reshape X to be [samples, time steps, features]
    X = np.reshape(X, (X.shape[0], X.shape[1], 1))
    
    # Split into train and test sets
    split_idx = int(len(X) * train_split)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    return X_train, y_train, X_test, y_test, scaler
