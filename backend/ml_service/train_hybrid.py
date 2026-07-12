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

# Set random seed for reproducibility
torch.manual_seed(42)
np.random.seed(42)

class ResidualLSTM(nn.Module):
    """
    Univariate LSTM model (1-50-1 architecture) to forecast nonlinear residuals.
    As described in Nensi et al. (2025).
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

def train_hybrid_model(symbol, epochs=50, batch_size=16):
    print(f"\n--- Training Hybrid ARIMA-LSTM model for {symbol} ---")
    df = load_stock_data(symbol)
    cols = ['Open', 'High', 'Low', 'Close', 'Volume']
    
    os.makedirs("models", exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    for col in cols:
        series = df[col].values
        
        # 1. Fit base ARIMA model to extract residuals
        try:
            arima_model = ARIMA(series, order=(1, 1, 1))
            arima_fit = arima_model.fit()
            fitted = arima_fit.fittedvalues
        except Exception as e:
            print(f"ARIMA(1,1,1) failed for {col}: {str(e)}. Falling back to ARIMA(1,1,0)...")
            arima_model = ARIMA(series, order=(1, 1, 0))
            arima_fit = arima_model.fit()
            fitted = arima_fit.fittedvalues
            
        residuals = series - fitted
        
        # 2. Scale residuals using MinMaxScaler
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_residuals = scaler.fit_transform(residuals.reshape(-1, 1)).flatten()
        
        # Save the scaler
        scaler_path = os.path.join("models", f"hybrid_scaler_{symbol}_{col}.pkl")
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
            
        # Prepare datasets with lookback = 1
        X, y = prepare_residual_data(scaled_residuals, lookback=1)
        X = X.reshape(-1, 1, 1) # reshape for LSTM: (samples, time_steps, features)
        y = y.reshape(-1, 1)
        
        X_t = torch.FloatTensor(X)
        y_t = torch.FloatTensor(y)
        
        dataset = TensorDataset(X_t, y_t)
        loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
        
        # 3. Train Residual LSTM (1-50-1)
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
        model_path = os.path.join("models", f"hybrid_lstm_{symbol}_{col}.pth")
        torch.save(model.state_dict(), model_path)
        print(f"--> Saved hybrid LSTM for {col} to {model_path}")

if __name__ == "__main__":
    import sys
    symbol = sys.argv[1] if len(sys.argv) > 1 else "RELIANCE"
    train_hybrid_model(symbol, epochs=50)
