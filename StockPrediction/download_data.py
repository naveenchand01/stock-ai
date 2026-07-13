import os
import yfinance as yf
import pandas as pd
from datetime import datetime

# Define Nifty 50 tickers with .NS suffix (NSE stocks)
# Note: LTIM.NS changed to LTM.NS in 2026. TATAMOTORS.NS demerged into TMPV.NS (passenger) and TMCV.NS (commercial) in 2025.
NIFTY_50_TICKERS = [
    "ADANIENT.NS", "ADANIPORTS.NS", "APOLLOHOSP.NS", "ASIANPAINT.NS", "AXISBANK.NS",
    "BAJAJ-AUTO.NS", "BAJAJFINSV.NS", "BAJFINANCE.NS", "BHARTIARTL.NS", "BPCL.NS",
    "BRITANNIA.NS", "CIPLA.NS", "COALINDIA.NS", "DIVISLAB.NS", "DRREDDY.NS",
    "EICHERMOT.NS", "GRASIM.NS", "HCLTECH.NS", "HDFCBANK.NS", "HDFCLIFE.NS",
    "HEROMOTOCO.NS", "HINDALCO.NS", "HINDUNILVR.NS", "ICICIBANK.NS", "ITC.NS",
    "INDUSINDBK.NS", "INFY.NS", "JSWSTEEL.NS", "KOTAKBANK.NS", "LT.NS",
    "LTM.NS", "M&M.NS", "MARUTI.NS", "NTPC.NS", "NESTLEIND.NS",
    "ONGC.NS", "POWERGRID.NS", "RELIANCE.NS", "SBILIFE.NS", "SBIN.NS",
    "SUNPHARMA.NS", "TCS.NS", "TATACONSUM.NS", "TMPV.NS", "TMCV.NS", "TATASTEEL.NS",
    "TECHM.NS", "TITAN.NS", "ULTRACEMCO.NS", "WIPRO.NS", "SHRIRAMFIN.NS"
]

def download_stock_data():
    # Create the output folder if it doesn't exist
    output_folder = "stock_data"
    os.makedirs(output_folder, exist_ok=True)
    
    # Define time period (15 years ago to today)
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - pd.DateOffset(years=15)).strftime('%Y-%m-%d')
    
    print(f"Downloading historical data from {start_date} to {end_date}...")
    print(f"Total Tickers to download: {len(NIFTY_50_TICKERS)}")
    
    success_count = 0
    failed_tickers = []
    
    for idx, ticker in enumerate(NIFTY_50_TICKERS, 1):
        print(f"[{idx}/{len(NIFTY_50_TICKERS)}] Downloading {ticker}...")
        try:
            # Download daily data
            data = yf.download(ticker, start=start_date, end=end_date)
            
            if not data.empty:
                # Save to CSV
                # Clean ticker name for filename (remove .NS)
                filename = ticker.replace(".NS", "") + ".csv"
                filepath = os.path.join(output_folder, filename)
                data.to_csv(filepath)
                print(f"  --> Saved {len(data)} rows to {filepath}")
                success_count += 1
            else:
                print(f"  [WARNING] No data found for {ticker}")
                failed_tickers.append(ticker)
        except Exception as e:
            print(f"  [ERROR] Failed to download {ticker}: {str(e)}")
            failed_tickers.append(ticker)
            
    print("\n" + "="*40)
    print("Download Summary:")
    print(f"Successfully downloaded: {success_count}/{len(NIFTY_50_TICKERS)}")
    if failed_tickers:
        print(f"Failed tickers: {', '.join(failed_tickers)}")
    print("="*40)

if __name__ == "__main__":
    download_stock_data()
