import azure.functions as func
import logging
import json
import os
from azure.data.tables import TableServiceClient
from azure.core.exceptions import ResourceExistsError

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@app.route(route="ping")
def ping(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse("Kore Enterprise Backend Online.", status_code=200)

# --- 1. Universal User Data Vault (To-Do, Apps, Settings) ---
@app.route(route="save_user_data", methods=["POST"])
def save_user_data(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()
        user_id = req_body.get('userId')
        data_type = req_body.get('dataType') # e.g. 'todos', 'apps', 'shortcuts'
        
        if not user_id or not data_type: 
            return func.HttpResponse("Missing Data.", status_code=400)

        conn_str = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=conn_str)
        table_name = "KoreUserData"
        
        try: service_client.create_table(table_name)
        except ResourceExistsError: pass 
            
        table_client = service_client.get_table_client(table_name=table_name)
        entity = {
            "PartitionKey": str(user_id),
            "RowKey": str(data_type),
            "RawJSON": json.dumps(req_body.get('data', {})) 
        }
        table_client.upsert_entity(entity=entity)
        return func.HttpResponse(json.dumps({"status": "success"}), mimetype="application/json", status_code=200)
    except Exception as e:
        return func.HttpResponse(f"Server Error: {str(e)}", status_code=500)

@app.route(route="get_user_data", methods=["GET"])
def get_user_data(req: func.HttpRequest) -> func.HttpResponse:
    try:
        user_id = req.params.get('userId')
        data_type = req.params.get('dataType')
        if not user_id or not data_type: return func.HttpResponse("[]", status_code=400)

        conn_str = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=conn_str)
        table_client = service_client.get_table_client(table_name="KoreUserData")

        entity = table_client.get_entity(partition_key=str(user_id), row_key=str(data_type))
        return func.HttpResponse(entity.get('RawJSON', '[]'), mimetype="application/json", status_code=200)
    except Exception:
        return func.HttpResponse("[]", mimetype="application/json", status_code=200)

# --- 2. Work Tracker Vault ---
@app.route(route="save_work_item", methods=["POST"])
def save_work_item(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()
        ticket_id = req_body.get('id')
        conn_str = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=conn_str)
        table_name = "KoreWorkTracker"
        try: service_client.create_table(table_name)
        except ResourceExistsError: pass 
        table_client = service_client.get_table_client(table_name=table_name)
        entity = {"PartitionKey": "WorkTicket", "RowKey": str(ticket_id), "Title": req_body.get('title', 'Untitled'), "Status": req_body.get('status', 'Pending'), "RawJSON": json.dumps(req_body)}
        table_client.upsert_entity(entity=entity)
        return func.HttpResponse(json.dumps({"status": "success"}), mimetype="application/json", status_code=200)
    except Exception as e: return func.HttpResponse(f"Server Error: {str(e)}", status_code=500)

# --- 3. Info Hub Vault ---
@app.route(route="save_info_page", methods=["POST"])
def save_info_page(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()
        page_id = req_body.get('id')
        user_id = req_body.get('authorId')
        is_global = req_body.get('isGlobal', False)
        partition_key = "GLOBAL_HUB" if is_global else str(user_id)
        conn_str = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=conn_str)
        table_name = "KoreInfoHub"
        try: service_client.create_table(table_name)
        except ResourceExistsError: pass 
        table_client = service_client.get_table_client(table_name=table_name)
        entity = {"PartitionKey": partition_key, "RowKey": str(page_id), "Title": req_body.get('title', 'Untitled'), "RawJSON": json.dumps(req_body)}
        table_client.upsert_entity(entity=entity)
        return func.HttpResponse(json.dumps({"status": "success"}), mimetype="application/json", status_code=200)
    except Exception as e: return func.HttpResponse(f"Server Error: {str(e)}", status_code=500)

@app.route(route="get_info_pages", methods=["GET"])
def get_info_pages(req: func.HttpRequest) -> func.HttpResponse:
    try:
        user_id = req.params.get('userId')
        conn_str = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=conn_str)
        table_client = service_client.get_table_client(table_name="KoreInfoHub")
        query = f"PartitionKey eq '{user_id}' or PartitionKey eq 'GLOBAL_HUB'"
        entities = list(table_client.query_entities(query_filter=query))
        return func.HttpResponse(json.dumps([json.loads(e['RawJSON']) for e in entities]), mimetype="application/json", status_code=200)
    except Exception: return func.HttpResponse("[]", mimetype="application/json", status_code=200)

# --- 4. Macro Library Vault ---
@app.route(route="save_macro", methods=["POST"])
def save_macro(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()
        macro_id = req_body.get('id')
        user_id = req_body.get('authorId')
        is_global = req_body.get('isGlobal', False)
        partition_key = "GLOBAL_MACRO" if is_global else str(user_id)
        conn_str = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=conn_str)
        table_name = "KoreMacros"
        try: service_client.create_table(table_name)
        except ResourceExistsError: pass 
        table_client = service_client.get_table_client(table_name=table_name)
        entity = {"PartitionKey": partition_key, "RowKey": str(macro_id), "RawJSON": json.dumps(req_body)}
        table_client.upsert_entity(entity=entity)
        return func.HttpResponse(json.dumps({"status": "success"}), mimetype="application/json", status_code=200)
    except Exception as e: return func.HttpResponse(f"Server Error: {str(e)}", status_code=500)

@app.route(route="get_macros", methods=["GET"])
def get_macros(req: func.HttpRequest) -> func.HttpResponse:
    try:
        user_id = req.params.get('userId')
        conn_str = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=conn_str)
        table_client = service_client.get_table_client(table_name="KoreMacros")
        query = f"PartitionKey eq '{user_id}' or PartitionKey eq 'GLOBAL_MACRO'"
        entities = list(table_client.query_entities(query_filter=query))
        return func.HttpResponse(json.dumps([json.loads(e['RawJSON']) for e in entities]), mimetype="application/json", status_code=200)
    except Exception: return func.HttpResponse("[]", mimetype="application/json", status_code=200) 
