import traceback
import sys

import streamlit as st
import pandas as pd

# --- Check dependencies upfront ---
dep_errors = []
try:
    import pdfplumber
except ImportError:
    dep_errors.append("pdfplumber is not installed. Run: pip install pdfplumber")

try:
    import pikepdf
except ImportError:
    dep_errors.append("pikepdf is not installed. Run: pip install pikepdf")

try:
    import pandas
except ImportError:
    dep_errors.append("pandas is not installed. Run: pip install pandas")

if dep_errors:
    st.set_page_config(page_title="Bank Statement Analyzer", layout="wide")
    st.title("Missing Dependencies")
    for err in dep_errors:
        st.error(err)
    st.info("Run these commands:\n```\nsource venv/bin/activate\npip install streamlit pdfplumber pikepdf pandas\n```")
    st.stop()

from utils.pdf_loader import load_pdf
from parsers import get_parser

st.set_page_config(page_title="Bank Statement Analyzer", page_icon="🏦", layout="wide")

st.title("Bank Statement Analyzer")
st.markdown("Upload your bank statement PDF and get a clean, organized transaction list.")

# --- Sidebar ---
with st.sidebar:
    st.header("Upload")
    bank = st.selectbox("Select Bank", ["HDFC", "Canara", "Union Bank"])
    uploaded_file = st.file_uploader("Upload PDF Statement", type=["pdf"])
    password = st.text_input("PDF Password (if encrypted)", type="password")
    process_btn = st.button("Process Statement", type="primary", use_container_width=True)

    # Debug toggle
    st.divider()
    show_debug = st.checkbox("Show Debug Logs", value=True)

# --- Processing ---
if process_btn and uploaded_file:
    logs = []

    def log(msg):
        logs.append(msg)
        if show_debug:
            st.write(f"DEBUG: {msg}")

    log(f"Python version: {sys.version}")
    log(f"pdfplumber version: {pdfplumber.__version__}")
    log(f"Bank selected: {bank}")
    log(f"File uploaded: {uploaded_file.name} ({uploaded_file.size} bytes)")
    log(f"Password provided: {'Yes' if password else 'No'}")

    with st.spinner("Processing statement..."):
        try:
            # Step 1: Load PDF
            log("Step 1: Loading PDF...")
            pdf = load_pdf(uploaded_file, password if password else None)
            log(f"Step 1 OK: PDF loaded — {len(pdf.pages)} page(s)")

            # Step 2: Extract raw tables AND raw text for debug
            log("Step 2: Extracting raw tables and text...")
            raw_tables = []
            total_data_rows = 0
            for i, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                log(f"  Page {i+1}: found {len(tables)} table(s)")
                for j, table in enumerate(tables):
                    data_rows = len(table) - 1 if table else 0
                    total_data_rows += data_rows
                    log(f"    Table {j+1}: {len(table)} rows total ({data_rows} data rows), {len(table[0]) if table else 0} cols")
                    if table and len(table) > 0:
                        log(f"    Header row: {table[0]}")
                        if len(table) > 1:
                            log(f"    First data row: {table[1]}")
                    raw_tables.extend(tables)

                # Always show raw text for debugging
                text = page.extract_text()
                if text:
                    log(f"  Page {i+1} RAW TEXT:\n{text[:2000]}")
                else:
                    log(f"  Page {i+1}: No text extracted (might be scanned/image)")

            if total_data_rows == 0:
                log("WARNING: Table extraction found only headers, no data rows. Will try text-based parsing.")

            # Step 3: Parse with bank-specific parser
            log(f"Step 3: Running {bank} parser...")
            parser = get_parser(bank)
            if parser is None:
                st.error(f"No parser found for {bank}")
                log(f"ERROR: No parser for bank '{bank}'")
            else:
                df = parser(pdf)
                log(f"Step 3 OK: Parser returned {len(df)} transactions")

                if df.empty:
                    st.warning(
                        "No transactions found. Possible reasons:\n"
                        "1. Wrong bank selected\n"
                        "2. PDF is scanned (image-based), not text-based\n"
                        "3. PDF layout doesn't match expected format\n\n"
                        "Check the debug logs above for raw table data."
                    )
                    log("RESULT: Empty DataFrame returned")
                else:
                    st.session_state["df"] = df
                    st.session_state["bank"] = bank
                    st.session_state["logs"] = logs
                    log(f"RESULT: Successfully parsed {len(df)} transactions")
                    st.success(f"Extracted {len(df)} transactions!")
            pdf.close()

        except ValueError as e:
            st.error(f"Value Error: {e}")
            log(f"VALUE ERROR: {e}")
        except ImportError as e:
            st.error(f"Import Error: {e}. A required package is missing.")
            log(f"IMPORT ERROR: {e}")
        except Exception as e:
            st.error(f"Error processing statement: {e}")
            log(f"EXCEPTION: {type(e).__name__}: {e}")
            tb = traceback.format_exc()
            log(f"TRACEBACK:\n{tb}")
            if show_debug:
                with st.expander("Full Traceback", expanded=True):
                    st.code(tb)

    # Always show debug logs
    if show_debug and logs:
        with st.expander("Debug Logs", expanded=True):
            for line in logs:
                st.text(line)

elif process_btn:
    st.warning("Please upload a PDF file first.")

# --- Results ---
if "df" in st.session_state:
    df = st.session_state["df"]
    bank = st.session_state["bank"]

    # --- Summary Cards ---
    credits = df[df["Type"] == "Credit"]["Amount"].sum()
    debits = df[df["Type"] == "Debit"]["Amount"].sum()
    net = credits - debits

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Transactions", f"{len(df)}")
    c2.metric("Total Credits", f"₹{credits:,.2f}")
    c3.metric("Total Debits", f"₹{debits:,.2f}")
    c4.metric("Net Flow", f"₹{net:,.2f}", delta=f"{'Surplus' if net >= 0 else 'Deficit'}")

    st.divider()

    # --- Filters ---
    col1, col2, col3 = st.columns([2, 2, 3])
    with col1:
        type_filter = st.selectbox("Type", ["All", "Credit", "Debit"])
    with col2:
        categories = ["All"] + sorted(df["Category"].unique().tolist())
        cat_filter = st.selectbox("Category", categories)
    with col3:
        search = st.text_input("Search Payee")

    # Apply filters
    filtered = df.copy()
    if type_filter != "All":
        filtered = filtered[filtered["Type"] == type_filter]
    if cat_filter != "All":
        filtered = filtered[filtered["Category"] == cat_filter]
    if search:
        filtered = filtered[filtered["Payee"].str.contains(search, case=False, na=False)]

    st.caption(f"Showing {len(filtered)} of {len(df)} transactions")

    # --- Table ---
    display_cols = ["Date", "Payee", "Category", "Type", "Amount", "Balance"]
    st.dataframe(
        filtered[display_cols],
        use_container_width=True,
        hide_index=True,
        column_config={
            "Date": st.column_config.DateColumn("Date", format="DD MMM YYYY"),
            "Amount": st.column_config.NumberColumn("Amount (₹)", format="₹%.2f"),
            "Balance": st.column_config.NumberColumn("Balance (₹)", format="₹%.2f"),
        },
    )

    # --- Download ---
    csv = filtered.to_csv(index=False).encode("utf-8")
    st.download_button(
        "Download as CSV",
        data=csv,
        file_name=f"{bank.replace(' ', '_')}_transactions.csv",
        mime="text/csv",
    )
else:
    st.info("Upload a bank statement PDF and click **Process Statement** to get started.")
