from fastapi import FastAPI
import pandas as pd
import json

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # atau ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df = pd.read_csv("D:\\Kuliah_Asli\\VS_CODE\\Analitika\\data\\data_cluster\\cluster_tipologi.csv")
df = df.where(pd.notnull(df), None)

@app.get("/api/tipologi-desa")
def get_tipologi_desa():
    json_str = df.to_json(orient="records", default_handler=str)
    return json.loads(json_str)