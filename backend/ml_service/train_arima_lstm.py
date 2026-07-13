import os
import pickle
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import MinMaxScaler
from statsmodels.tsa.arima.model import ARIMA
from preprocess import load_stock_data
from metrics import calculate_metrics, print_metrics

# Set random seed for reproducibility
torch.manual_seed(42)
np.random.seed(42)

class ResidualLSTM(nn.Module):
    """
    Univariate LSTM model (1-50-1 architecture) to forecast nonlinear residuals.
    """
    def __init__(self, input_size=1, hidden_size=50, num_layers=1, output_size=1):
        super(ResidualLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :])
        return out

def prepare_residual_data(residuals, lookback=1):
    X, y = [], []
    for i in range(lookback, len(residuals)):
        X.append(residuals[i - lookback:i])
        y.append(residuals[i])
    return np.array(X), np.array(y)

def train_arima_lstm_model(symbol, epochs=50, batch_size=16):
    print(f"\n--- Training Strict 80/20 ARIMA-LSTM model for {symbol} ---")
    df = load_stock_data(symbol, last_n_years=10)
    cols = ['Open', 'High', 'Low', 'Close', 'Volume']
    
    os.makedirs("models", exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    final_metrics = {}
    
    for col in cols:
        series = df[col].values
        split_idx = int(len(series) * 0.8)
        
        train_series = series[:split_idx]
        test_series = series[split_idx:]
        
        # 1. Fit base ARIMA model on TRAIN data
        try:
            arima_model = ARIMA(train_series, order=(1, 1, 1))
            arima_fit = arima_model.fit()
        except Exception as e:
            print(f"ARIMA(1,1,1) failed for {col}, falling back to (1,1,0)...")
            arima_model = ARIMA(train_series, order=(1, 1, 0))
            arima_fit = arima_model.fit()
            
        train_fitted = arima_fit.fittedvalues
        train_residuals = train_series - train_fitted
        
        # Apply fitted parameters to get 1-step ahead predictions for the TEST data without data leakage
        try:
            full_model = ARIMA(series, order=arima_model.order)
            full_fit = full_model.smooth(arima_fit.params)
            all_fitted = full_fit.fittedvalues
            test_fitted = all_fitted[split_idx:]
        except:
            # Fallback if smooth() fails
            print("Fallback to slow rolling prediction for test set...")
            test_fitted = []
            history = list(train_series)
            for t in range(len(test_series)):
                tmp_model = ARIMA(history, order=arima_model.order)
                tmp_fit = tmp_model.fit()
                test_fitted.append(tmp_fit.forecast()[0])
                history.append(test_series[t])
            test_fitted = np.array(test_fitted)
            
        test_residuals = test_series - test_fitted
        
        # 2. Scale residuals using MinMaxScaler (FIT ON TRAIN ONLY)
        scaler = MinMaxScaler(feature_range=(0, 1))
        train_residuals_scaled = scaler.fit_transform(train_residuals.reshape(-1, 1)).flatten()
        test_residuals_scaled = scaler.transform(test_residuals.reshape(-1, 1)).flatten()
        
        # Save the scaler
        scaler_path = os.path.join("models", f"arima_lstm_scaler_{symbol}_{col}.pkl")
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
            
        # Prepare datasets with lookback = 1
        X_train, y_train = prepare_residual_data(train_residuals_scaled, lookback=1)
        X_train = X_train.reshape(-1, 1, 1)
        y_train = y_train.reshape(-1, 1)
        
        X_test, y_test_scaled = prepare_residual_data(test_residuals_scaled, lookback=1)
        X_test = X_test.reshape(-1, 1, 1)
        
        dataset = TensorDataset(torch.FloatTensor(X_train), torch.FloatTensor(y_train))
        loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
        
        # 3. Train Residual LSTM
        model = ResidualLSTM(input_size=1, hidden_size=50, num_layers=1, output_size=1).to(device)
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)
        
        model.train()
        for epoch in range(1, epochs + 1):
            epoch_loss = 0.0
            for X_batch, y_batch in loader:
                X_batch, y_batch = X_batch.to(device), y_batch.to(device)
                outputs = model(X_batch)
                loss = criterion(outputs, y_batch)
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                epoch_loss += loss.item() * X_batch.size(0)
            epoch_loss /= len(loader.dataset)
            if epoch % 10 == 0 or epoch == 1:
                print(f"[{col}] Epoch [{epoch}/{epochs}], Residual Loss: {epoch_loss:.6f}")
                
        # Save the LSTM model
        model_path = os.path.join("models", f"arima_lstm_{symbol}_{col}.pth")
        torch.save(model.state_dict(), model_path)
        print(f"--> Saved ARIMA-LSTM for {col} to {model_path}")
        
        # 4. Evaluate on Test Set (only care about outputting metrics for 'Close' price)
        if col == 'Close':
            model.eval()
            with torch.no_grad():
                preds_scaled = model(torch.FloatTensor(X_test).to(device)).cpu().numpy()
            
            preds_unscaled = scaler.inverse_transform(preds_scaled).flatten()
            
            lookback = 1
            y_test_pred = test_fitted[lookback:] + preds_unscaled
            y_test_actual = test_series[lookback:]
            y_prev_actual = test_series[lookback-1:-1]
            
            final_metrics = calculate_metrics(y_test_actual, y_test_pred, y_prev_actual)
            print_metrics("ARIMA-LSTM (Close Price)", final_metrics)

    return model_path, final_metrics

if __name__ == "__main__":
    import sys
    symbol = sys.argv[1] if len(sys.argv) > 1 else "RELIANCE"
    train_arima_lstm_model(symbol, epochs=10) # 10 epochs for faster testing
