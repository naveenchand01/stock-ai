import os
import pickle
import numpy as np
import pandas as pd
import torch
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from preprocess import load_stock_data, prepare_lstm_data, add_technical_indicators
from train_lstm import StockLSTM
from train_cnn_lstm import CNN_LSTM
from train_arima_lstm import ResidualLSTM
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX

symbol = "RELIANCE"
print(f"Generating graphs for {symbol}...")

df = load_stock_data(symbol)
df = add_technical_indicators(df)

lookback_window = 60
train_split = 0.8
df_clean = df.dropna()
dates = df_clean.index[lookback_window:]

with open(f"models/scaler_{symbol}.pkl", 'rb') as f:
    scaler = pickle.load(f)

columns = ['Open', 'High', 'Low', 'Close', 'Volume', 'SMA_50', 'EMA_20', 'RSI_14', 'MACD', 'BB_up', 'BB_low']
df_selected = df_clean[columns]
scaled_values = scaler.transform(df_selected.values)

X, y = [], []
for i in range(lookback_window, len(scaled_values)):
    X.append(scaled_values[i - lookback_window:i, :])
    y.append(scaled_values[i, :5])
    
X, y = np.array(X), np.array(y)
split_idx_arr = int(len(X) * train_split)
X_test = X[split_idx_arr:]
y_test_scaled = y[split_idx_arr:]

split_idx = int(len(dates) * train_split)
train_dates = dates[:split_idx]
test_dates = dates[split_idx:]

PLOT_LAST_N_DAYS = 150
plot_dates = test_dates[-PLOT_LAST_N_DAYS:]
plot_y_test_scaled = y_test_scaled[-PLOT_LAST_N_DAYS:]

dummy = np.zeros((len(plot_y_test_scaled), 11))
dummy[:, :5] = plot_y_test_scaled
actual_close = scaler.inverse_transform(dummy)[:, 3]

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def plot_graph(model_name, predictions, filename):
    plt.figure(figsize=(12, 6))
    plt.plot(plot_dates, actual_close, label="Test Data (Actual)", color='red', alpha=0.7)
    plt.plot(plot_dates, predictions, label=f"Prediction of {model_name} Architecture", color='blue', alpha=0.7)
    
    # Train/test split line would normally be earlier, but we're only plotting the end of the test set.
    # To mimic the screenshot, let's put the line at the very beginning of the plotted period.
    plt.axvline(x=plot_dates[0], color='green', linestyle='--', label="Train/Test Split")
    
    plt.title(f"A Comparison Between Actual Data and Forecasts from the {model_name} Model (on the Original Scale)")
    plt.xlabel("Date")
    plt.ylabel("Stock Index / Share Price Index")
    plt.grid(True, linestyle='-', alpha=0.7)
    plt.legend()
    
    os.makedirs('graphs', exist_ok=True)
    out_path = os.path.join('graphs', filename)
    plt.savefig(out_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved {out_path}")

try:
    lstm = StockLSTM(input_size=11, hidden_size=64, num_layers=2, output_size=5).to(device)
    lstm.load_state_dict(torch.load(f"models/lstm_{symbol}.pth", map_location=device))
    lstm.eval()
    with torch.no_grad():
        preds = lstm(torch.FloatTensor(X_test[-PLOT_LAST_N_DAYS:]).to(device)).cpu().numpy()
    dummy[:, :5] = preds
    lstm_close = scaler.inverse_transform(dummy)[:, 3]
    plot_graph("LSTM", lstm_close, "lstm_plot.png")
except Exception as e:
    print("LSTM error:", e)

try:
    cnnlstm = CNN_LSTM(input_size=11, output_size=5).to(device)
    cnnlstm.load_state_dict(torch.load(f"models/cnnlstm_{symbol}.pth", map_location=device))
    cnnlstm.eval()
    with torch.no_grad():
        preds = cnnlstm(torch.FloatTensor(X_test[-PLOT_LAST_N_DAYS:]).to(device)).cpu().numpy()
    dummy[:, :5] = preds
    cnnlstm_close = scaler.inverse_transform(dummy)[:, 3]
    plot_graph("CNN-LSTM", cnnlstm_close, "cnnlstm_plot.png")
except Exception as e:
    print("CNN-LSTM error:", e)

try:
    with open(f"models/rf_{symbol}.pkl", 'rb') as f:
        rf = pickle.load(f)
    X_test_flat = X_test[-PLOT_LAST_N_DAYS:].reshape(PLOT_LAST_N_DAYS, -1)
    preds = rf.predict(X_test_flat)
    dummy[:, 3] = preds
    rf_close = scaler.inverse_transform(dummy)[:, 3]
    plot_graph("Random Forest", rf_close, "rf_plot.png")
except Exception as e:
    print("RF error:", e)

try:
    with open(f"models/xgb_{symbol}.pkl", 'rb') as f:
        xgb = pickle.load(f)
    preds = xgb.predict(X_test_flat)
    dummy[:, 3] = preds
    xgb_close = scaler.inverse_transform(dummy)[:, 3]
    plot_graph("XGBoost", xgb_close, "xgb_plot.png")
except Exception as e:
    print("XGB error:", e)

try:
    series = df_clean['Close'].values
    train_data = list(series[:split_idx + lookback_window])
    test_data = list(series[split_idx + lookback_window:])
    
    # We only predict the PLOT_LAST_N_DAYS
    history = train_data + test_data[:-PLOT_LAST_N_DAYS]
    
    print("Running ARIMA rolling forecast (this may take a minute)...")
    arima_preds = []
    for t in range(PLOT_LAST_N_DAYS):
        model_a = ARIMA(history, order=(5,1,0))
        model_a_fit = model_a.fit()
        yhat = model_a_fit.forecast()[0]
        arima_preds.append(yhat)
        history.append(test_data[-PLOT_LAST_N_DAYS + t])
    plot_graph("ARIMA", arima_preds, "arima_plot.png")
except Exception as e:
    print("ARIMA error:", e)

try:
    history = train_data + test_data[:-PLOT_LAST_N_DAYS]
    print("Running SARIMA rolling forecast (this may take a minute)...")
    sarima_preds = []
    for t in range(PLOT_LAST_N_DAYS):
        model_s = SARIMAX(history, order=(1,1,1), seasonal_order=(0,0,0,0))
        model_s_fit = model_s.fit(disp=False)
        yhat = model_s_fit.forecast()[0]
        sarima_preds.append(yhat)
        history.append(test_data[-PLOT_LAST_N_DAYS + t])
    plot_graph("SARIMA", sarima_preds, "sarima_plot.png")
except Exception as e:
    print("SARIMA error:", e)

try:
    print("Running ARIMA-LSTM forecast...")
    # Base ARIMA for hybrid model is (1,1,0) based on fallback logic in train_arima_lstm
    al_history = train_data + test_data[:-PLOT_LAST_N_DAYS]
    
    # Load scaler
    with open(f"models/arima_lstm_scaler_{symbol}_Close.pkl", 'rb') as f:
        res_scaler = pickle.load(f)
        
    # Load ResidualLSTM
    res_lstm = ResidualLSTM(input_size=1, hidden_size=50, num_layers=1, output_size=1).to(device)
    res_lstm.load_state_dict(torch.load(f"models/arima_lstm_{symbol}_Close.pth", map_location=device))
    res_lstm.eval()
    
    al_preds = []
    # We need the previous day's residual. 
    # To get the previous day's residual (t-1), we quickly fit ARIMA for t-1.
    tmp_model = ARIMA(al_history[:-1], order=(1,1,0))
    tmp_fit = tmp_model.fit()
    prev_yhat = tmp_fit.forecast()[0]
    prev_residual = al_history[-1] - prev_yhat
    
    for t in range(PLOT_LAST_N_DAYS):
        # 1. Base ARIMA prediction
        model_a = ARIMA(al_history, order=(1,1,0))
        model_a_fit = model_a.fit()
        base_yhat = model_a_fit.forecast()[0]
        
        # 2. LSTM Residual prediction
        prev_res_scaled = res_scaler.transform(np.array([[prev_residual]]))[0][0]
        # input shape: (1, 1, 1) -> batch, seq, feature
        res_input = torch.FloatTensor([[[prev_res_scaled]]]).to(device)
        with torch.no_grad():
            pred_res_scaled = res_lstm(res_input).cpu().numpy()[0][0]
            
        pred_res = res_scaler.inverse_transform(np.array([[pred_res_scaled]]))[0][0]
        
        # 3. Final prediction
        final_yhat = base_yhat + pred_res
        al_preds.append(final_yhat)
        
        # Update history and true residual for next step
        actual_val = test_data[-PLOT_LAST_N_DAYS + t]
        prev_residual = actual_val - base_yhat
        al_history.append(actual_val)
        
    plot_graph("ARIMA-LSTM", al_preds, "arima_lstm_plot.png")
except Exception as e:
    print("ARIMA-LSTM error:", e)

print("Done generating all graphs.")
