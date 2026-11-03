
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase_client import supabase

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return jsonify({
        "status": "success",
        "message": "Expense Tracker Backend Running!"
    })


# ==========================================
# Test Supabase Connection
# ==========================================

@app.route("/api/test", methods=["GET"])
def test_database():
    try:
        response = supabase.table("transactions").select("*").execute()

        return jsonify({
            "status": "success",
            "message": "Supabase connected successfully!",
            "data": response.data
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ==========================================
# Save Expense
# ==========================================

@app.route("/api/expenses", methods=["POST"])
def add_expense():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No expense data provided"}), 400

        amount = float(data.get("amount", 0))

        if amount <= 0:
            return jsonify({"error": "Amount must be greater than zero"}), 400

        if not data.get("category") or not data.get("date"):
            return jsonify({"error": "Category and date are required"}), 400

        expense = {
            "amount": amount,
            "type": "expense",
            "category": data.get("category"),
            "payment_method": data.get("payment"),
            "account": data.get("account"),
            "transaction_date": data.get("date"),
            "transaction_time": data.get("time") or None,
            "payment_provider": data.get("method"),
            "notes": data.get("notes", ""),
            "is_recurring": bool(data.get("recurring", False)),
            "receipt_filename": data.get("receipt", "")
        }

        response = (
            supabase.table("transactions")
            .insert(expense)
            .execute()
        )

        return jsonify({
            "status": "success",
            "message": "Expense saved successfully!",
            "data": response.data
        }), 201

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ==========================================
# Get Expenses
# ==========================================

@app.route("/api/expenses", methods=["GET"])
def get_expenses():
    try:
        response = (
            supabase.table("transactions")
            .select("*")
            .eq("type", "expense")
            .order("transaction_date", desc=True)
            .execute()
        )

        return jsonify({
            "status": "success",
            "data": response.data
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ==========================================
# Save Income
# ==========================================

@app.route("/api/income", methods=["POST"])
def add_income():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No income data provided"}), 400

        amount = float(data.get("amount", 0))

        if amount <= 0:
            return jsonify({"error": "Amount must be greater than zero"}), 400

        if not data.get("category") or not data.get("date"):
            return jsonify({
                "error": "Income source and date are required"
            }), 400

        income = {
            "amount": amount,
            "type": "income",
            "category": data.get("category"),
            "payment_method": data.get("payment"),
            "account": data.get("account"),
            "transaction_date": data.get("date"),
            "transaction_time": data.get("time") or None,
            "notes": data.get("notes", ""),
            "received_from": data.get("receivedFrom", ""),
            "tags": data.get("tags", ""),
            "is_recurring": bool(data.get("recurring", False)),
            "receipt_filename": data.get("attachment", "")
        }

        response = (
            supabase.table("transactions")
            .insert(income)
            .execute()
        )

        return jsonify({
            "status": "success",
            "message": "Income saved successfully!",
            "data": response.data
        }), 201

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ==========================================
# Get Income
# ==========================================

@app.route("/api/income", methods=["GET"])
def get_income():
    try:
        response = (
            supabase.table("transactions")
            .select("*")
            .eq("type", "income")
            .order("transaction_date", desc=True)
            .execute()
        )

        return jsonify({
            "status": "success",
            "data": response.data
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
