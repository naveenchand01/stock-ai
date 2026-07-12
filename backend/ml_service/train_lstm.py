import os
import pickle
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from preprocess import load_stock_data, prepare_lstm_data, add_technical_indicators
from metrics import calculate_metrics, print_metrics

# Set random seed for reproducibility
torch.manual_seed(42)
np.random.seed(42)

# Define LSTM Neural Network Model
class StockLSTM(nn.Module):
    def __init__(self, input_size=11, hidden_size=64, num_layers=2, output_size=5):
        super(StockLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        # Initialize hidden state and cell state with zeros
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        
        # Forward propagate LSTM
        out, _ = self.lstm(x, (h0, c0))
        
        # Decode the hidden state of the last time step
        out = self.fc(out[:, -1, :])
        return out

def train_model(symbol, epochs=10, batch_size=64, lookback_window=60):
    print(f"\n--- Training Multivariate LSTM model for {symbol} ---")
    
    # 1. Load and Preprocess Data
    df = load_stock_data(symbol)
    df = add_technical_indicators(df)
    
    # We predict Open, High, Low, Close, Volume
    X_train, y_train, X_test, y_test, scaler = prepare_lstm_data(
        df, lookback_window=lookback_window, train_split=0.8
    )
    
    # Create models folder if not exists
    os.makedirs("models", exist_ok=True)
    
    # Save the scaler using pickle
    scaler_path = os.path.join("models", f"scaler_{symbol}.pkl")
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    print(f"Scaler saved to {scaler_path}")
    
    # 2. Convert to PyTorch Tensors
    X_train_t = torch.FloatTensor(X_train)
    y_train_t = torch.FloatTensor(y_train)  # Already shape (samples, 5)
    X_test_t = torch.FloatTensor(X_test)
    y_test_t = torch.FloatTensor(y_test)   # Already shape (samples, 5)
    
    # 3. Create DataLoaders
    train_dataset = TensorDataset(X_train_t, y_train_t)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    
    # 4. Instantiate Model, Loss and Optimizer (11 inputs, 5 outputs)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = StockLSTM(input_size=11, hidden_size=64, num_layers=2, output_size=5).to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # 5. Training Loop
    model.train()
    for epoch in range(1, epochs + 1):
        epoch_loss = 0.0
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            
            # Forward pass
            outputs = model(X_batch)
            loss = criterion(outputs, y_batch)
            
            # Backward and optimize
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item() * X_batch.size(0)
            
        epoch_loss /= len(train_loader.dataset)
        if epoch % 2 == 0 or epoch == 1:
            print(f"Epoch [{epoch}/{epochs}], Loss: {epoch_loss:.6f}")
            
    # 6. Evaluate on Test Set
    model.eval()
    with torch.no_grad():
        X_test_t = X_test_t.to(device)
        predictions = model(X_test_t).cpu().numpy()
        y_test_np = y_test_t.cpu().numpy()
        
        # We unscale to calculate real-world metrics, or we can just calculate on scaled values.
        # Since the LSTM output is scaled [0,1], metrics will also be scaled. 
        # For the dissertation, evaluating on scaled values is fine as long as it's consistent across models.
        # To get real prices, we only care about the Close price (index 3).
        
        # Pad to 11 columns (scaler was fit on 11 features)
        preds_padded = np.zeros((len(predictions), 11))
        preds_padded[:, :5] = predictions
        preds_unscaled = scaler.inverse_transform(preds_padded)[:, :5]
        
        y_test_padded = np.zeros((len(y_test_np), 11))
        y_test_padded[:, :5] = y_test_np
        y_test_unscaled = scaler.inverse_transform(y_test_padded)[:, :5]
        
        # Index 3 is 'Close' price
        close_true = y_test_unscaled[:, 3]
        close_pred = preds_unscaled[:, 3]
        
        # Extract previous day's close from the last step of each lookback window (index 3 = Close)
        y_prev_scaled = X_test[:, -1, 3]
        dummy_prev = np.zeros((len(y_test_np), 11))
        dummy_prev[:, 3] = y_prev_scaled
        y_prev_unscaled = scaler.inverse_transform(dummy_prev)[:, 3]

        metrics = calculate_metrics(close_true, close_pred, y_prev_unscaled)
        print_metrics("LSTM (Close Price)", metrics)
        
    # 7. Save Model Weights
    model_path = os.path.join("models", f"lstm_{symbol}.pth")
    torch.save(model.state_dict(), model_path)
    print(f"LSTM Model weights saved to {model_path}")
    return model_path, metrics

if __name__ == "__main__":
    # Test train with RELIANCE
    train_model("RELIANCE")
