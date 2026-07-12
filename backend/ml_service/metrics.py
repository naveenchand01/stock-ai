import numpy as np

def calculate_metrics(y_true, y_pred, y_prev=None):
    """
    Calculates comprehensive evaluation metrics strictly using raw mathematical formulas
    without relying on external shortcut libraries like sklearn.
    
    y_true: actual price values
    y_pred: predicted price values
    y_prev: (Optional) previous day's actual price values to compute direction. 
            If not provided, directional metrics will not be calculated.
    """
    y_true = np.array(y_true, dtype=np.float64)
    y_pred = np.array(y_pred, dtype=np.float64)
    n = len(y_true)
    
    # ---------------- A. Regression Metrics ----------------

    # 1. MAE: Mean Absolute Error
    mae = np.sum(np.abs(y_true - y_pred)) / n
    
    # 2. MSE: Mean Squared Error
    mse = np.sum((y_true - y_pred) ** 2) / n
    
    # 3. RMSE: Root Mean Square Error
    rmse = np.sqrt(mse)
    
    # 4. MAPE: Mean Absolute Percentage Error
    epsilon = 1e-8 # Prevent division by zero
    mape = (100 / n) * np.sum(np.abs((y_true - y_pred) / (np.abs(y_true) + epsilon)))
    
    # 5. SMAPE: Symmetric Mean Absolute Percentage Error
    smape = (100 / n) * np.sum(np.abs(y_true - y_pred) / ((np.abs(y_true) + np.abs(y_pred)) / 2 + epsilon))
    
    # 6. R²: Coefficient of Determination
    mean_y = np.mean(y_true)
    ss_tot = np.sum((y_true - mean_y) ** 2)
    ss_res = np.sum((y_true - y_pred) ** 2)
    r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0.0

    metrics = {
        "MAE": float(mae),
        "MSE": float(mse),
        "RMSE": float(rmse),
        "MAPE": float(mape),
        "SMAPE": float(smape),
        "R2": float(r2)
    }

    # ---------------- B. Classification Metrics (Directional) ----------------
    if y_prev is not None:
        y_prev = np.array(y_prev, dtype=np.float64)
        
        # Direction logic: 
        # Actual Up = y_true > y_prev
        # Predicted Up = y_pred > y_prev
        actual_up = y_true > y_prev
        pred_up = y_pred > y_prev
        
        # Confusion Matrix components
        TP = np.sum(actual_up & pred_up)
        TN = np.sum((~actual_up) & (~pred_up))
        FP = np.sum((~actual_up) & pred_up)
        FN = np.sum(actual_up & (~pred_up))
        
        # 1. Accuracy (Directional Accuracy)
        total_predictions = TP + TN + FP + FN
        accuracy = (TP + TN) / total_predictions if total_predictions > 0 else 0.0
        
        # 2. Precision
        precision = TP / (TP + FP) if (TP + FP) > 0 else 0.0
        
        # 3. Recall (Sensitivity)
        recall = TP / (TP + FN) if (TP + FN) > 0 else 0.0
        
        # 4. Specificity
        specificity = TN / (TN + FP) if (TN + FP) > 0 else 0.0
        
        # 5. F1-Score
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        
        # 6. False Positive Rate (FPR)
        fpr = FP / (FP + TN) if (FP + TN) > 0 else 0.0
        
        # 7. False Negative Rate (FNR)
        fnr = FN / (FN + TP) if (FN + TP) > 0 else 0.0

        metrics.update({
            "Directional_Accuracy": float(accuracy * 100),  # As percentage
            "Precision": float(precision),
            "Recall": float(recall),
            "Specificity": float(specificity),
            "F1_Score": float(f1),
            "FPR": float(fpr),
            "FNR": float(fnr),
            "TP": int(TP),
            "TN": int(TN),
            "FP": int(FP),
            "FN": int(FN)
        })
        
    return metrics

def print_metrics(model_name, metrics):
    print(f"\n{'='*50}")
    print(f" {model_name} EVALUATION REPORT ".center(50, "="))
    print(f"{'='*50}\n")
    
    print("--- Regression Metrics (Price Prediction) ---")
    print(f"MAE:   {metrics['MAE']:.4f}")
    print(f"MSE:   {metrics['MSE']:.4f}")
    print(f"RMSE:  {metrics['RMSE']:.4f}")
    print(f"MAPE:  {metrics['MAPE']:.4f}%")
    print(f"SMAPE: {metrics['SMAPE']:.4f}%")
    print(f"R²:    {metrics['R2']:.4f}")
    
    if "Directional_Accuracy" in metrics:
        print("\n--- Classification Metrics (Direction Prediction) ---")
        print(f"Confusion Matrix -> TP: {metrics['TP']} | TN: {metrics['TN']} | FP: {metrics['FP']} | FN: {metrics['FN']}")
        print(f"Directional Acc: {metrics['Directional_Accuracy']:.2f}%")
        print(f"Precision:       {metrics['Precision']:.4f}")
        print(f"Recall (Sens.):  {metrics['Recall']:.4f}")
        print(f"Specificity:     {metrics['Specificity']:.4f}")
        print(f"F1-Score:        {metrics['F1_Score']:.4f}")
        print(f"FPR:             {metrics['FPR']:.4f}")
        print(f"FNR:             {metrics['FNR']:.4f}")
        
    print(f"\n{'='*50}\n")
