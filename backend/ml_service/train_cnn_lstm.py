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

class CNN_LSTM(nn.Module):
    def __init__(self, input_size=11, cnn_filters=64, lstm_hidden=64, num_layers=2, output_size=5):
        super(CNN_LSTM, self).__init__()
        
        # CNN layer expects (batch, channels, length)
        # So input should be permuted before CNN
        self.conv1 = nn.Conv1d(in_channels=input_size, out_channels=cnn_filters, kernel_size=3, padding=1)
        self.relu = nn.ReLU()
        self.pool = nn.MaxPool1d(kernel_size=2)
        
        self.lstm = nn.LSTM(cnn_filters, lstm_hidden, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(lstm_hidden, output_size)

    def forward(self, x):
        # x is (batch, lookback, input_size)
        # Permute for CNN: (batch, input_size, lookback)
        x = x.permute(0, 2, 1)
        
        c = self.conv1(x)
        c = self.relu(c)
        c = self.pool(c)
        
        # Permute back for LSTM: (batch, length, channels)
        c = c.permute(0, 2, 1)
        
        out, _ = self.lstm(c)
        out = self.fc(out[:, -1, :])
        return out

def train_cnn_lstm_model(symbol, epochs=10, batch_size=64, lookback_window=60):
    print(f"\n--- Training CNN-LSTM Hybrid model for {symbol} ---")
    
    df = load_stock_data(symbol)
    df = add_technical_indicators(df)
    
    X_train, y_train, X_test, y_test, scaler = prepare_lstm_data(
        df, lookback_window=lookback_window, train_split=0.8
    )
    
    os.makedirs("models", exist_ok=True)
    scaler_path = os.path.join("models", f"scaler_{symbol}.pkl")
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
        
    X_train_t = torch.FloatTensor(X_train)
    y_train_t = torch.FloatTensor(y_train)
    X_test_t = torch.FloatTensor(X_test)
    y_test_t = torch.FloatTensor(y_test)
    
    train_dataset = TensorDataset(X_train_t, y_train_t)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = CNN_LSTM(input_size=11, output_size=5).to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    model.train()
    for epoch in range(1, epochs + 1):
        epoch_loss = 0.0
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            
            optimizer.zero_grad()
            outputs = model(X_batch)
            loss = criterion(outputs, y_batch)
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item() * X_batch.size(0)
            
        epoch_loss /= len(train_loader.dataset)
        if epoch % 2 == 0 or epoch == 1:
            print(f"Epoch [{epoch}/{epochs}], Loss: {epoch_loss:.6f}")
            
    model.eval()
    with torch.no_grad():
        X_test_t = X_test_t.to(device)
        predictions = model(X_test_t).cpu().numpy()
        y_test_np = y_test_t.cpu().numpy()
        
        # Pad to 11 columns (scaler was fit on 11 features)
        preds_padded = np.zeros((len(predictions), 11))
        preds_padded[:, :5] = predictions
        preds_unscaled = scaler.inverse_transform(preds_padded)[:, :5]
        
        y_test_padded = np.zeros((len(y_test_np), 11))
        y_test_padded[:, :5] = y_test_np
        y_test_unscaled = scaler.inverse_transform(y_test_padded)[:, :5]
        
        close_true = y_test_unscaled[:, 3]
        close_pred = preds_unscaled[:, 3]
        
        y_prev_scaled = X_test[:, -1, 3]
        dummy_prev = np.zeros((len(y_test_np), 11))
        dummy_prev[:, 3] = y_prev_scaled
        y_prev_unscaled = scaler.inverse_transform(dummy_prev)[:, 3]
        
        metrics = calculate_metrics(close_true, close_pred, y_prev_unscaled)
        print_metrics("CNN-LSTM (Close Price)", metrics)
        
    model_path = os.path.join("models", f"cnnlstm_{symbol}.pth")
    torch.save(model.state_dict(), model_path)
    return model_path, metrics

if __name__ == "__main__":
    train_cnn_lstm_model("RELIANCE")
