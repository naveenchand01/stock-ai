import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import generate_forecast
from datetime import datetime, timedelta
import yfinance as yf

app = Flask(__name__)
# Enable CORS so our Express backend or frontend can query the API
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "Stock AI Forecasting Service"}), 200

@app.route('/predict', methods=['POST'])
def predict_endpoint():
    data = request.get_json() or {}
    
    symbol = data.get('symbol')
    model_type = data.get('model_type', 'LSTM')
    forecast_days = int(data.get('forecast_days', 30))
    
    if not symbol:
        return jsonify({"error": "Symbol parameter is required."}), 400
        
    # Clean symbol name (e.g., remove any namespaces if they passed a clean ticker or NSE ticker)
    symbol_cleaned = symbol.upper()
    
    # If the symbol doesn't have .NS suffix but is in stock_data as .NS, we find it.
    # E.g. RELIANCE -> RELIANCE (stored in stock_data as RELIANCE.csv)
    # Let's verify files in stock_data folder to match
    available_files = [f.split('.')[0] for f in os.listdir("stock_data") if f.endswith('.csv')]
    
    matched_symbol = None
    for f in available_files:
        if symbol_cleaned == f or f"{symbol_cleaned}.NS" == f or symbol_cleaned.replace(".NS", "") == f:
            matched_symbol = f
            break
            
    if not matched_symbol:
        # Fallback to try directly
        matched_symbol = symbol_cleaned
        
    try:
        # Run prediction
        predictions = generate_forecast(matched_symbol, model_type, forecast_days)
        
        # Generate future dates (consecutive calendar days starting from tomorrow)
        dates = []
        current_date = datetime.now()
        for i in range(1, forecast_days + 1):
            future_date = current_date + timedelta(days=i)
            # Standardize date output format
            dates.append(future_date.strftime('%Y-%m-%d'))
            
        # Combine date and prediction
        forecast_result = []
        for date, pred in zip(dates, predictions):
            forecast_result.append({
                "date": date,
                "open": round(float(pred['open']), 2),
                "high": round(float(pred['high']), 2),
                "low": round(float(pred['low']), 2),
                "close": round(float(pred['close']), 2),
                "price": round(float(pred['close']), 2),  # Map Close as price for chart compatibility
                "volume": int(pred['volume'])
            })
            
        return jsonify({
            "symbol": symbol,
            "matched_symbol": matched_symbol,
            "model_type": model_type,
            "forecast_days": forecast_days,
            "forecast": forecast_result
        }), 200
        
    except FileNotFoundError as fnf:
        return jsonify({"error": f"Data file for stock {symbol} not found. Please ensure it has been downloaded.", "details": str(fnf)}), 404
    except Exception as e:
        return jsonify({"error": "Failed to generate prediction", "details": str(e)}), 500

@app.route('/intraday', methods=['GET'])
def intraday_endpoint():
    symbol = request.args.get('symbol')
    if not symbol:
        return jsonify({"error": "Symbol parameter is required."}), 400
        
    symbol_cleaned = symbol.upper()
    if not symbol_cleaned.endswith('.NS'):
        symbol_cleaned += '.NS'
        
    try:
        stock = yf.Ticker(symbol_cleaned)
        # 1m data is only available for the last 7 days max.
        df = stock.history(period="5d", interval="1m")
        
        if df.empty:
            return jsonify({"error": f"No intraday data found for {symbol_cleaned}."}), 404
            
        result = []
        for index, row in df.iterrows():
            result.append({
                "time": index.strftime('%Y-%m-%d %H:%M:%S'),
                "open": round(float(row['Open']), 2),
                "high": round(float(row['High']), 2),
                "low": round(float(row['Low']), 2),
                "close": round(float(row['Close']), 2),
                "price": round(float(row['Close']), 2),
                "volume": int(row['Volume'])
            })
            
        return jsonify({
            "symbol": symbol_cleaned,
            "intraday": result
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to fetch intraday data", "details": str(e)}), 500

if __name__ == "__main__":
    # Run the server on port 5000
    print("Starting Flask Stock AI Prediction Server on http://localhost:5000...")
    app.run(host='0.0.0.0', port=5000, debug=False)
