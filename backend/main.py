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

df = pd.read_csv("D:\\Kuliah_Asli\\VS_CODE\\Dashboard AI\\Final_Web\\siDesa\\public\\data\\cluster_tipologi.csv")
df = df.where(pd.notnull(df), None)

df_inf = pd.read_csv("D:\\Kuliah_Asli\\VS_CODE\\Dashboard AI\\Final_Web\\siDesa\\public\\data\\cluster_infrastruktur.csv")
df_inf = df_inf.where(pd.notnull(df_inf), None)

df_kes = pd.read_csv("D:\\Kuliah_Asli\\VS_CODE\\Dashboard AI\\Final_Web\\siDesa\\public\\data\\cluster_kesehatan.csv")
df_kes = df_kes.where(pd.notnull(df_kes), None)

df_dig = pd.read_csv("D:\\Kuliah_Asli\\VS_CODE\\Dashboard AI\\Final_Web\\siDesa\\public\\data\\cluster_digital.csv")
df_dig = df_dig.where(pd.notnull(df_dig), None)

df_eko = pd.read_csv("D:\\Kuliah_Asli\\VS_CODE\\Dashboard AI\\Final_Web\\siDesa\\public\\data\\cluster_ekonomi.csv")
df_eko = df_eko.where(pd.notnull(df_eko), None)

df_ling = pd.read_csv("D:\\Kuliah_Asli\\VS_CODE\\Dashboard AI\\Final_Web\\siDesa\\public\\data\\cluster_lingkungan.csv")
df_ling = df_ling.where(pd.notnull(df_ling), None)

df_edu = pd.read_csv("D:\\Kuliah_Asli\\VS_CODE\\Dashboard AI\\Final_Web\\siDesa\\public\\data\\cluster_pendidikan.csv")
df_edu = df_edu.where(pd.notnull(df_edu), None)

@app.get("/api/data_cluster/cluster_tipologi")
def get_tipologi_desa():
    json_str = df.to_json(orient="records", default_handler=str)
    return json.loads(json_str)

@app.get("/api/data_cluster/cluster_infrastruktur")
def get_cluster_infrastruktur():
    df_inf_json = df_inf.to_json(orient="records", default_handler=str)
    return json.loads(df_inf_json)

@app.get("/api/data_cluster/cluster_kesehatan")
def get_cluster_kesehatan():
    df_kes_json = df_kes.to_json(orient="records", default_handler=str)
    return json.loads(df_kes_json)

@app.get("/api/data_cluster/cluster_digital")
def get_cluster_digital():
    df_dig_json = df_dig.to_json(orient="records", default_handler=str)
    return json.loads(df_dig_json)

@app.get("/api/data_cluster/cluster_ekonomi")
def get_cluster_ekonomi():
    df_eko_json = df_eko.to_json(orient="records", default_handler=str)
    return json.loads(df_eko_json)

@app.get("/api/data_cluster/cluster_lingkungan")
def get_cluster_lingkungan():
    df_ling_json = df_ling.to_json(orient="records", default_handler=str)
    return json.loads(df_ling_json)

@app.get("/api/data_cluster/cluster_pendidikan")
def get_cluster_pendidikan():
    df_edu_json = df_edu.to_json(orient="records", default_handler=str)
    return json.loads(df_edu_json)