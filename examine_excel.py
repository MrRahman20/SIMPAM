import pandas as pd

# Read the Excel file
df = pd.read_excel('DataPemakaman.xlsx')

# Print the first few rows to understand the structure
print("Excel File Structure:")
print(df.head())

# Print column names
print("\nColumn Names:")
print(df.columns.tolist())

# Print data types
print("\nData Types:")
print(df.dtypes)

# Print any merged cells or special formatting (this requires openpyxl)
from openpyxl import load_workbook
wb = load_workbook('DataPemakaman.xlsx')
ws = wb.active

print("\nMerged Cells:")
print(ws.merged_cells.ranges)
