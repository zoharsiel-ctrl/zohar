import streamlit as st
import os
import google.generativeai as genai
import pandas as pd
import plotly.express as px
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# הגדרת מפתח ה-API ממשתני סביבה
api_key = os.getenv("GEMINI_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    st.error("Missing GEMINI_KEY environment variable. Please set it in your deployment settings.")

st.set_page_config(
    page_title="Neighbor-Share Backend", 
    layout="wide",
    page_icon="🤝",
    initial_sidebar_state="expanded"
)

# Custom CSS for a more polished look
st.markdown("""
    <style>
    .main {
        background-color: #f8fafc;
    }
    .stMetric {
        background-color: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    </style>
    """, unsafe_allow_html=True)

st.title("🚀 Neighbor-Share: Console")
st.write("ממשק הניהול וה-AI של הכלכלה השיתופית המקומית - v1.0.0")

# Top Stats
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric(label="Active Neighbors", value="1,240", delta="12%")
with col2:
    st.metric(label="Inventory Items", value="450", delta="5%")
with col3:
    st.metric(label="Trust Transactions", value="89", delta="18%")
with col4:
    st.metric(label="AI Smart Fill Success", value="94%", delta="2%")

st.divider()

# Charts
c1, c2 = st.columns([2, 1])

with c1:
    st.subheader("📈 צמיחה קהילתית (Weekly)")
    chart_data = pd.DataFrame({
        'Day': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        'Transactions': [12, 18, 15, 25, 30, 10, 8]
    })
    fig = px.line(chart_data, x='Day', y='Transactions', markers=True, 
                 line_shape='spline', color_discrete_sequence=['#059669'])
    fig.update_layout(plot_bgcolor='white', margin=dict(l=0, r=0, t=20, b=0))
    st.plotly_chart(fig, use_container_width=True)

with c2:
    st.subheader("🏷️ קטגוריות פופולריות")
    cat_data = pd.DataFrame({
        'Category': ['כלי עבודה', 'גינון', 'קמפינג', 'אלקטרוניקה'],
        'Volume': [45, 25, 20, 10]
    })
    fig_pie = px.pie(cat_data, values='Volume', names='Category', hole=.4,
                    color_discrete_sequence=['#059669', '#10b981', '#34d399', '#6ee7b7'])
    st.plotly_chart(fig_pie, use_container_width=True)

st.divider()

# Detailed Table
st.subheader("🛠 ניהול מלאי - תצוגה מורחבת")
inventory = [
    {"ID": "i1", "Name": "פטישון DeWalt", "Price": "₪40", "Status": "Available", "Owner": "שרה לוי"},
    {"ID": "i2", "Name": "סולם אלומיניום", "Price": "₪0", "Status": "Active Loan", "Owner": "דוד כהן"},
    {"ID": "i3", "Name": "מכונת שטיפה בלחץ", "Price": "₪60", "Status": "Available", "Owner": "שרה לוי"},
    {"ID": "i4", "Name": "אוהל ל-4 אנשים", "Price": "₪35", "Status": "Maintenance", "Owner": "דוד כהן"},
]
st.dataframe(pd.DataFrame(inventory), use_container_width=True)

# AI Trace
with st.expander("🔍 AI Generation Logs (Trace)"):
    st.code("""
    [2024-03-20 14:22] Request: Generate metadata for "Drill"
    [2024-03-20 14:22] Model: gemini-3-flash-preview
    [2024-03-20 14:22] Tokens: 142
    [2024-03-20 14:22] Response: { "description": "מקדחה עוצמתית...", "price": 45 }
    """, language="text")
