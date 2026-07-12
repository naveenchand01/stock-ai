import os
import yfinance as yf
import pandas as pd
from datetime import datetime

# The indices the user requested
INDICES = [
    "^NSEI",     # NIFTY 50
    "^BSESN",    # SENSEX
    "^NSEBANK",  # BANK NIFTY
    "^CNXIT",    # NIFTY IT
    "^IXIC",     # NASDAQ
    "^GSPC",     # S&P 500
    "^DJI"       # DOW JONES
]

def download_indices():
    output_folder = "stock_data"
    os.makedirs(output_folder, exist_ok=True)
    
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - pd.DateOffset(years=15)).strftime('%Y-%m-%d')
    
    print(f"Downloading historical data from {start_date} to {end_date}...")
    
    success_count = 0
    for symbol in INDICES:
        print(f"Downloading {symbol}...")
        try:
            data = yf.download(symbol, start=start_date, end=end_date)
            if not data.empty:
                filename = symbol + ".csv"
                filepath = os.path.join(output_folder, filename)
                data.to_csv(filepath)
                print(f"  --> Saved {len(data)} rows to {filepath}")
                success_count += 1
            else:
                print(f"  [WARNING] No data found for {symbol}")
        except Exception as e:
            print(f"  [ERROR] Failed to download {symbol}: {str(e)}")
            
    print(f"\nDownload Summary: {success_count}/{len(INDICES)} indices downloaded.")

if __name__ == "__main__":
    download_indices()
