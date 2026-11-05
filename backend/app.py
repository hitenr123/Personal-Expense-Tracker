import os
import secrets
import hashlib
from datetime import date, datetime, timedelta, timezone

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from supabase_client import supabase
from dotenv import load_dotenv


load_dotenv()

app = Flask(__name__)

app.secret_key = os.getenv("FLASK_SECRET_KEY")

if not app.secret_key:
    raise ValueError("FLASK_SECRET_KEY is missing from .env")

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_SAMESITE="None",
    PERMANENT_SESSION_LIFETIME=timedelta(days=7)
)


CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://127.0.0.1:5500",
                "http://localhost:5500",
                "https://hitenr123.github.io"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
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
# Authentication Helper Functions
# ==========================================

def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


def get_current_user():
    token = request.cookies.get("auth_token")

    if not token:
        return None

    token_hash = hash_token(token)

    result = (
        supabase.table("auth_sessions")
        .select("user_id, expires_at")
        .eq("token_hash", token_hash)
        .execute()
    )

    if not result.data:
        return None

    auth_session = result.data[0]

    expires_at = datetime.fromisoformat(
        auth_session["expires_at"].replace("Z", "+00:00")
    )

    if expires_at <= datetime.now(timezone.utc):
        supabase.table("auth_sessions").delete().eq(
            "token_hash", token_hash
        ).execute()
        return None

    user_result = (
        supabase.table("app_users")
        .select("id, full_name, email")
        .eq("id", auth_session["user_id"])
        .execute()
    )

    return user_result.data[0] if user_result.data else None


# ==========================================
# SIGNUP API
# ==========================================

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()

    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not full_name or not email or not password:
        return jsonify({
            "status": "error",
            "message": "All fields are required"
        }), 400

    if len(password) < 8:
        return jsonify({
            "status": "error",
            "message": "Password must be at least 8 characters"
        }), 400

    existing_user = (
        supabase.table("app_users")
        .select("id")
        .ilike("email", email)
        .execute()
    )

    if existing_user.data:
        return jsonify({
            "status": "error",
            "message": "Email is already registered"
        }), 409

    password_hash = generate_password_hash(password)

    result = (
        supabase.table("app_users")
        .insert({
            "full_name": full_name,
            "email": email,
            "password_hash": password_hash
        })
        .execute()
    )

    return jsonify({
        "status": "success",
        "message": "Account created successfully"
    }), 201



# ==========================================
# LOGIN API
# ==========================================

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "status": "error",
            "message": "Email and password are required"
        }), 400

    result = (
        supabase.table("app_users")
        .select("id, full_name, email, password_hash")
        .ilike("email", email)
        .execute()
    )

    if not result.data:
        return jsonify({
            "status": "error",
            "message": "Invalid email or password"
        }), 401

    user = result.data[0]

    if not check_password_hash(user["password_hash"], password):
        return jsonify({
            "status": "error",
            "message": "Invalid email or password"
        }), 401

    # Create a secure random login token
    token = secrets.token_urlsafe(32)
    token_hash = hash_token(token)

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    supabase.table("auth_sessions").insert({
        "token_hash": token_hash,
        "user_id": user["id"],
        "expires_at": expires_at.isoformat()
    }).execute()

    response = jsonify({
        "status": "success",
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"]
        }
    })

    response.set_cookie(
        "auth_token",
        token,
        httponly=True,
        secure=True,
        samesite="None",
        max_age=7 * 24 * 60 * 60
    )

    return response


# ==========================================
# LOGOUT API
# ==========================================

@app.route("/api/logout", methods=["POST"])
def logout():
    token = request.cookies.get("auth_token")

    if token:
        token_hash = hash_token(token)

        supabase.table("auth_sessions").delete().eq(
            "token_hash", token_hash
        ).execute()

    response = jsonify({
        "status": "success",
        "message": "Logged out successfully"
    })

    response.delete_cookie(
        "auth_token",
        httponly=True,
        secure=True,
        samesite="None"
    )

    return response



# ==========================================
# CHECK LOGIN API
# ==========================================

@app.route("/api/me", methods=["GET"])
def get_profile():
    user = get_current_user()

    if not user:
        return jsonify({
            "status": "error",
            "message": "Not logged in"
        }), 401

    return jsonify({
        "status": "success",
        "user": user
    }), 200


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



# ==========================================
# Budget Helpers
# ==========================================

def get_budget_month_range(month_value=None):
    if month_value:
        start = date.fromisoformat(month_value + "-01")
    else:
        start = date.today().replace(day=1)

    if start.month == 12:
        next_month = date(start.year + 1, 1, 1)
    else:
        next_month = date(start.year, start.month + 1, 1)

    return start.isoformat(), next_month.isoformat()


# ==========================================
# Get Monthly Budget and Spending
# ==========================================

@app.route("/api/budget", methods=["GET"])
def get_budget():
    try:
        month = request.args.get("month")
        month_start, next_month = get_budget_month_range(month)

        # Get saved monthly budget
        budget_response = (
            supabase.table("budgets")
            .select("*")
            .eq("category", "Overall")
            .eq("month", month_start)
            .limit(1)
            .execute()
        )

        budget_data = (
            budget_response.data[0]
            if budget_response.data
            else None
        )

        budget_amount = (
            float(budget_data["amount"])
            if budget_data
            else 0
        )

        # Get expenses for the selected month
        expense_response = (
            supabase.table("transactions")
            .select("amount")
            .eq("type", "expense")
            .gte("transaction_date", month_start)
            .lt("transaction_date", next_month)
            .execute()
        )

        spent = sum(
            float(expense.get("amount", 0))
            for expense in expense_response.data
        )

        remaining = max(budget_amount - spent, 0)

        percentage = (
            round((spent / budget_amount) * 100, 2)
            if budget_amount > 0
            else 0
        )

        return jsonify({
            "status": "success",
            "data": {
                "budget": budget_amount,
                "spent": spent,
                "remaining": remaining,
                "percentage": percentage,
                "month": month_start,
                "budget_id": budget_data["id"] if budget_data else None
            }
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


# ==========================================
# Save or Update Monthly Budget
# ==========================================

@app.route("/api/budget", methods=["POST"])
def save_budget():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No budget data provided"}), 400

        amount = float(data.get("amount", 0))

        if amount <= 0:
            return jsonify({
                "error": "Budget must be greater than zero"
            }), 400

        month_start, _ = get_budget_month_range(
            data.get("month")
        )

        # Check whether this month's budget already exists
        existing = (
            supabase.table("budgets")
            .select("id")
            .eq("category", "Overall")
            .eq("month", month_start)
            .limit(1)
            .execute()
        )

        budget_record = {
            "category": "Overall",
            "amount": amount,
            "month": month_start
        }

        if existing.data:
            # Update existing budget
            response = (
                supabase.table("budgets")
                .update(budget_record)
                .eq("id", existing.data[0]["id"])
                .execute()
            )
        else:
            # Insert new budget
            response = (
                supabase.table("budgets")
                .insert(budget_record)
                .execute()
            )

        return jsonify({
            "status": "success",
            "message": "Monthly budget saved successfully!",
            "data": response.data
        }), 201

    except ValueError:
        return jsonify({
            "error": "Invalid budget amount or month"
        }), 400

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