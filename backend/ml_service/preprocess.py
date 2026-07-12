import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler

def load_stock_data(symbol, base_dir="stock_data", last_n_years=None):
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
    
    # Keep track of the original symbol for saving later
    df.attrs['symbol'] = symbol
    
    # Filter to last N years if specified
    if last_n_years is not None and not df.empty:
        cutoff_date = df.index[-1] - pd.DateOffset(years=last_n_years)
        df = df[df.index >= cutoff_date]
        
    return df

def add_technical_indicators(df, save_to_csv=True):
    """
    Adds RSI, MACD, EMA, SMA, and Bollinger Bands to the DataFrame.
    The mathematical formulas are executed using native pandas vectorized math.
    """
    # 1. SMA (50-day Simple Moving Average)
    # Math: (1/n) * sum_{i=1}^n(Close_i)
    df['SMA_50'] = df['Close'].rolling(window=50).mean()
    
    # 2. EMA (20-day Exponential Moving Average)
    # Math: Close_t * (2 / (1+N)) + EMA_{t-1} * (1 - (2 / (1+N)))
    df['EMA_20'] = df['Close'].ewm(span=20, adjust=False).mean()
    
    # 3. RSI (14-day Relative Strength Index)
    # Math: RSI = 100 - (100 / (1 + RS)), where RS = Average Gain / Average Loss
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI_14'] = 100 - (100 / (1 + rs))
    df['RSI_14'] = df['RSI_14'].fillna(50) # Fill NaNs
    
    # 4. MACD (Moving Average Convergence Divergence)
    # Math: MACD = EMA_12(Close) - EMA_26(Close)
    ema_12 = df['Close'].ewm(span=12, adjust=False).mean()
    ema_26 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = ema_12 - ema_26
    
    # 5. Bollinger Bands
    # Math: SMA_20 +/- (2 * Standard Deviation)
    sma_20 = df['Close'].rolling(window=20).mean()
    std_20 = df['Close'].rolling(window=20).std()
    df['BB_up'] = sma_20 + (2 * std_20)
    df['BB_low'] = sma_20 - (2 * std_20)
    
    # Drop rows with NaN (due to 50-day rolling windows)
    df.dropna(inplace=True)
    
    # Export the engineered dataframe to the processed_data/ folder
    if save_to_csv and 'symbol' in df.attrs:
        symbol = df.attrs['symbol']
        os.makedirs("processed_data", exist_ok=True)
        export_path = os.path.join("processed_data", f"{symbol}_processed.csv")
        df.to_csv(export_path)
        
    return df

def prepare_lstm_data(df, columns=['Open', 'High', 'Low', 'Close', 'Volume', 'SMA_50', 'EMA_20', 'RSI_14', 'MACD', 'BB_up', 'BB_low'], lookback_window=60, train_split=0.8):
    """
    Preprocesses time series data (multiple columns) for LSTM model training.
    Scales the values to [0, 1] and creates sliding window sequences.
    """
    df_selected = df[columns]
    
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_values = scaler.fit_transform(df_selected.values)
    
    X, y = [], []
    for i in range(lookback_window, len(scaled_values)):
        X.append(scaled_values[i - lookback_window:i, :])
        y.append(scaled_values[i, :5])
        
    X, y = np.array(X), np.array(y)
    
    split_idx = int(len(X) * train_split)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    return X_train, y_train, X_test, y_test, scaler
