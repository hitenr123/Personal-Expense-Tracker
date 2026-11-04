
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase_client import supabase

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://127.0.0.1:5500",
                "http://localhost:5500"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False
        }
    }
)

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



# ==========================================
# Edit Expense
# ==========================================

@app.route("/api/expenses/<expense_id>", methods=["PUT"])
def update_expense(expense_id):
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No update data provided"}), 400

        updates = {}

        if "amount" in data:
            amount = float(data["amount"])

            if amount <= 0:
                return jsonify({"error": "Amount must be greater than zero"}), 400

            updates["amount"] = amount

        if "category" in data:
            category = str(data["category"]).strip()

            if not category:
                return jsonify({"error": "Category is required"}), 400

            updates["category"] = category

        if "description" in data:
            updates["notes"] = data["description"]

        if "date" in data:
            if not data["date"]:
                return jsonify({"error": "Date is required"}), 400

            updates["transaction_date"] = data["date"]

        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400

        response = (
            supabase.table("transactions")
            .update(updates)
            .eq("id", expense_id)
            .eq("type", "expense")
            .execute()
        )

        if not response.data:
            return jsonify({"error": "Expense not found"}), 404

        return jsonify({
            "status": "success",
            "message": "Expense updated successfully!",
            "data": response.data
        })

    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# Delete Expense
# ==========================================

@app.route("/api/expenses/<expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    try:
        response = (
            supabase.table("transactions")
            .delete()
            .eq("id", expense_id)
            .eq("type", "expense")
            .execute()
        )

        if not response.data:
            return jsonify({"error": "Expense not found"}), 404

        return jsonify({
            "status": "success",
            "message": "Expense deleted successfully!"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# Edit Income
# ==========================================

@app.route("/api/income/<income_id>", methods=["PUT"])
def update_income(income_id):
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No update data provided"}), 400

        updates = {}

        if "amount" in data:
            amount = float(data["amount"])

            if amount <= 0:
                return jsonify({"error": "Amount must be greater than zero"}), 400

            updates["amount"] = amount

        if "category" in data:
            category = str(data["category"]).strip()

            if not category:
                return jsonify({"error": "Category is required"}), 400

            updates["category"] = category

        if "description" in data:
            updates["received_from"] = data["description"]

        if "date" in data:
            if not data["date"]:
                return jsonify({"error": "Date is required"}), 400

            updates["transaction_date"] = data["date"]

        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400

        response = (
            supabase.table("transactions")
            .update(updates)
            .eq("id", income_id)
            .eq("type", "income")
            .execute()
        )

        if not response.data:
            return jsonify({"error": "Income not found"}), 404

        return jsonify({
            "status": "success",
            "message": "Income updated successfully!",
            "data": response.data
        })

    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# Delete Income
# ==========================================

@app.route("/api/income/<income_id>", methods=["DELETE"])
def delete_income(income_id):
    try:
        response = (
            supabase.table("transactions")
            .delete()
            .eq("id", income_id)
            .eq("type", "income")
            .execute()
        )

        if not response.data:
            return jsonify({"error": "Income not found"}), 404

        return jsonify({
            "status": "success",
            "message": "Income deleted successfully!"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# ==========================================
# Save Financial Goal
# ==========================================

@app.route("/api/goals", methods=["POST"])
def add_goal():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No goal data provided"}), 400

        name = str(data.get("name", "")).strip()
        amount = float(data.get("amount", 0))

        if not name:
            return jsonify({"error": "Goal name is required"}), 400

        if amount <= 0:
            return jsonify({
                "error": "Target amount must be greater than zero"
            }), 400

        goal = {
            "goal_name": name,
            "target_amount": amount,
            "current_saving": float(data.get("current_saving", 0)),
            "target_date": data.get("date") or None
        }

        response = (
            supabase.table("financial_goals")
            .insert(goal)
            .execute()
        )

        return jsonify({
            "status": "success",
            "message": "Goal added successfully!",
            "data": response.data
        }), 201

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ==========================================
# Get Financial Goals
# ==========================================

@app.route("/api/goals", methods=["GET"])
def get_goals():
    try:
        response = (
            supabase.table("financial_goals")
            .select("*")
            .order("created_at", desc=True)
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
# Edit Financial Goal
# ==========================================

@app.route("/api/goals/<goal_id>", methods=["PUT"])
def update_goal(goal_id):
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No update data provided"}), 400

        updates = {}

        if "name" in data:
            name = str(data["name"]).strip()

            if not name:
                return jsonify({"error": "Goal name is required"}), 400

            updates["goal_name"] = name

        if "amount" in data:
            amount = float(data["amount"])

            if amount <= 0:
                return jsonify({
                    "error": "Target amount must be greater than zero"
                }), 400

            updates["target_amount"] = amount

        if "date" in data:
            updates["target_date"] = data["date"] or None

        if "current_saving" in data:
            saving = float(data["current_saving"])

            if saving < 0:
                return jsonify({
                    "error": "Current saving cannot be negative"
                }), 400

            updates["current_saving"] = saving

        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400

        response = (
            supabase.table("financial_goals")
            .update(updates)
            .eq("id", goal_id)
            .execute()
        )

        if not response.data:
            return jsonify({"error": "Goal not found"}), 404

        return jsonify({
            "status": "success",
            "message": "Goal updated successfully!",
            "data": response.data
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ==========================================
# Delete Financial Goal
# ==========================================

@app.route("/api/goals/<goal_id>", methods=["DELETE"])
def delete_goal(goal_id):
    try:
        response = (
            supabase.table("financial_goals")
            .delete()
            .eq("id", goal_id)
            .execute()
        )

        if not response.data:
            return jsonify({"error": "Goal not found"}), 404

        return jsonify({
            "status": "success",
            "message": "Goal deleted successfully!"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == "__main__":
    import os
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )