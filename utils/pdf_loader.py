import tempfile

import pikepdf
import pdfplumber


def load_pdf(uploaded_file, password: str = None) -> pdfplumber.PDF:
    """Decrypt PDF if needed, return pdfplumber object."""
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(uploaded_file.read())
        tmp_path = tmp.name

    if password:
        decrypted_path = tmp_path.replace(".pdf", "_decrypted.pdf")
        try:
            with pikepdf.open(tmp_path, password=password) as pdf:
                pdf.save(decrypted_path)
            pdf_file = decrypted_path
        except pikepdf.PasswordError:
            raise ValueError("Incorrect password. Please check and try again.")
    else:
        pdf_file = tmp_path

    return pdfplumber.open(pdf_file)
