import azure.functions as func
import logging
import json
import os
from azure.data.tables import TableServiceClient
from azure.core.exceptions import ResourceExistsError

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# Helper: Set strict No-Cache headers to prevent browser from serving stale data
NO_CACHE_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0"
}

@app.route(route="ping")
def ping(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse("Kore Enterprise Backend Online.", status_code=200, headers=NO_CACHE_HEADERS)

# --- 1. Universal User Data Vault (To-Do, Apps, Settings) ---
@app.route(route="save_user_data", methods=["POST"])
def save_user_data(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()
        user_id = req_body.get('userId')
        data_type = req_body.get('dataType')
        
        if not user_id or not data_type: 
            return func.HttpResponse("Missing Data.", status_code=400)

        conn_str = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=conn_str)
        table_name = "KoreUserData"
        
        try: service_client.create_table(table_name)
        except ResourceExistsError: pass 
            
        table_client = service_client.get_table_client(table_name=table_name)
        
        # 32KB Limit Workaround: Chunking large payloads for Azure Tables
        raw_json = json.dumps(req_body.get('data', {}))
        chunks = [raw_json[i:i+30000] for i in range(0, len(raw_json), 30000)]
        
        entity = {
            "PartitionKey": str(user_id),
            "RowKey": str(data_type),
            "ChunkCount": len(chunks)
        }
        for i, chunk in enumerate(chunks):
            entity[f"RawJSON_{i}"] = chunk

        table_client.upsert_entity(entity=entity)
        return func.HttpResponse(json.dumps({"status": "success"}), mimetype="application/json", status_code=200)
    except Exception as e:
        return func.HttpResponse(f"Server Error: {str(e)}", status_code=500)

@app.route(route="get_user_data", methods=["GET"])
def get_user_data(req: func.HttpRequest) -> func.HttpResponse:
    try:
        user_id = req.params.get('userId')
        data_type = req.params.get('dataType')
        if not user_id or not data_type: return func.HttpResponse("[]", status_code=400, headers=NO_CACHE_HEADERS)

        conn_str = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=conn_str)
        table_client = service_client.get_table_client(table_name="KoreUserData")

        entity = table_client.get_entity(partition_key=str(user_id), row_key=str(data_type))
        
        # Reassemble chunks if present
        if "ChunkCount" in entity:
            raw_json = "".join([entity.get(f"RawJSON_{i}", "") for i in range(entity["ChunkCount"])])
        else:
            raw_json = entity.get('RawJSON', '[]')
            
        return func.HttpResponse(raw_json, mimetype="application/json", status_code=200, headers=NO_CACHE_HEADERS)
    except Exception:
        return func.HttpResponse("[]", mimetype="application/json", status_code=200, headers=NO_CACHE_HEADERS)

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
        
        raw_json = json.dumps(req_body)
        chunks = [raw_json[i:i+30000] for i in range(0, len(raw_json), 30000)]
        entity = {
            "PartitionKey": "WorkTicket", 
            "RowKey": str(ticket_id), 
            "Title": req_body.get('title', 'Untitled'), 
            "Status": req_body.get('status', 'Pending'),
            "ChunkCount": len(chunks)
        }
        for i, chunk in enumerate(chunks):
            entity[f"RawJSON_{i}"] = chunk
            
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
        counterpart_key = str(user_id) if is_global else "GLOBAL_HUB"
        
        conn_str = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=conn_str)
        table_name = "KoreInfoHub"
        try: service_client.create_table(table_name)
        except ResourceExistsError: pass 
        
        table_client = service_client.get_table_client(table_name=table_name)

        # 🛡️ GHOST ERADICATION: Actively wipe the counterpart partition to prevent duplicate collisions
        if page_id and user_id:
            try:
                table_client.delete_entity(partition_key=counterpart_key, row_key=str(page_id))
            except Exception:
                pass
        
        raw_json = json.dumps(req_body)
        chunks = [raw_json[i:i+30000] for i in range(0, len(raw_json), 30000)]
        entity = {
            "PartitionKey": partition_key, 
            "RowKey": str(page_id), 
            "Title": req_body.get('title', 'Untitled'),
            "ChunkCount": len(chunks)
        }
        for i, chunk in enumerate(chunks):
            entity[f"RawJSON_{i}"] = chunk
            
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
        
        pages_dict = {}
        
        # 🛡️ DEDUPLICATION: Map by ID to guarantee the UI only ever gets one authoritative version
        for e in entities:
            if "ChunkCount" in e:
                raw_json = "".join([e.get(f"RawJSON_{i}", "") for i in range(e["ChunkCount"])])
            else:
                raw_json = e.get('RawJSON', '{}')
                
            try:
                page_data = json.loads(raw_json)
                p_id = page_data.get('id')
                if p_id:
                    # If duplicate exists somehow, Global hierarchy overrides personal.
                    if p_id in pages_dict:
                        if e.get('PartitionKey') == 'GLOBAL_HUB':
                            pages_dict[p_id] = page_data
                    else:
                        pages_dict[p_id] = page_data
            except Exception: pass
            
        return func.HttpResponse(json.dumps(list(pages_dict.values())), mimetype="application/json", status_code=200, headers=NO_CACHE_HEADERS)
    except Exception: return func.HttpResponse("[]", mimetype="application/json", status_code=200, headers=NO_CACHE_HEADERS)

@app.route(route="delete_info_page", methods=["POST"])
def delete_info_page(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()
        page_id = req_body.get('id')
        user_id = req_body.get('authorId')
        
        if not page_id: return func.HttpResponse("Missing page ID", status_code=400)
        
        conn_str = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=conn_str)
        table_client = service_client.get_table_client(table_name="KoreInfoHub")
        
        # 🛡️ TACTICAL WIPE: Blindly strike both potential partitions to ensure total deletion
        try: table_client.delete_entity(partition_key=str(user_id), row_key=str(page_id))
        except Exception: pass
        
        try: table_client.delete_entity(partition_key="GLOBAL_HUB", row_key=str(page_id))
        except Exception: pass
        
        return func.HttpResponse(json.dumps({"status": "deleted"}), mimetype="application/json", status_code=200)
    except Exception as e: return func.HttpResponse(f"Server Error: {str(e)}", status_code=500)

# --- 4. Macro Library Vault ---
@app.route(route="save_macro", methods=["POST"])
def save_macro(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()
        macro_id = req_body.get('id')
        user_id = req_body.get('authorId')
        is_global = req_body.get('isGlobal', False)
        
        partition_key = "GLOBAL_MACRO" if is_global else str(user_id)
        counterpart_key = str(user_id) if is_global else "GLOBAL_MACRO"
        
        conn_str = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=conn_str)
        table_name = "KoreMacros"
        try: service_client.create_table(table_name)
        except ResourceExistsError: pass 
        
        table_client = service_client.get_table_client(table_name=table_name)

        if macro_id and user_id:
            try: table_client.delete_entity(partition_key=counterpart_key, row_key=str(macro_id))
            except Exception: pass
        
        raw_json = json.dumps(req_body)
        chunks = [raw_json[i:i+30000] for i in range(0, len(raw_json), 30000)]
        entity = {
            "PartitionKey": partition_key, 
            "RowKey": str(macro_id), 
            "ChunkCount": len(chunks)
        }
        for i, chunk in enumerate(chunks):
            entity[f"RawJSON_{i}"] = chunk
            
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
        
        macros_dict = {}
        for e in entities:
            if "ChunkCount" in e:
                raw_json = "".join([e.get(f"RawJSON_{i}", "") for i in range(e["ChunkCount"])])
            else:
                raw_json = e.get('RawJSON', '{}')
            try:
                macro_data = json.loads(raw_json)
                m_id = macro_data.get('id')
                if m_id:
                    if m_id in macros_dict:
                        if e.get('PartitionKey') == 'GLOBAL_MACRO':
                            macros_dict[m_id] = macro_data
                    else:
                        macros_dict[m_id] = macro_data
            except Exception: pass

        return func.HttpResponse(json.dumps(list(macros_dict.values())), mimetype="application/json", status_code=200, headers=NO_CACHE_HEADERS)
    except Exception: return func.HttpResponse("[]", mimetype="application/json", status_code=200, headers=NO_CACHE_HEADERS)
