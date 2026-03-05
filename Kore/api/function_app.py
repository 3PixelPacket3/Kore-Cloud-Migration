import azure.functions as func
import logging
import json
import os
from azure.data.tables import TableServiceClient
from azure.core.exceptions import ResourceExistsError

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# --- 1. System Diagnostics ---
@app.route(route="ping")
def ping(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Kore system ping requested.')
    return func.HttpResponse("Kore Enterprise Backend is online, secure, and ready for data transmission.", status_code=200)

# --- 2. Work Tracker Vault ---
@app.route(route="save_work_item", methods=["POST"])
def save_work_item(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()
        ticket_id = req_body.get('id')
        if not ticket_id: return func.HttpResponse("Error: Missing Ticket ID.", status_code=400)

        connection_string = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=connection_string)
        
        table_name = "KoreWorkTracker"
        try: service_client.create_table(table_name)
        except ResourceExistsError: pass 
            
        table_client = service_client.get_table_client(table_name=table_name)
        
        entity = {
            "PartitionKey": "WorkTicket", # Work tickets are currently global
            "RowKey": str(ticket_id),
            "Title": req_body.get('title', 'Untitled'),
            "Status": req_body.get('status', 'Pending'),
            "RawJSON": json.dumps(req_body) 
        }
        
        table_client.upsert_entity(entity=entity)
        return func.HttpResponse(json.dumps({"status": "success"}), mimetype="application/json", status_code=200)
    except Exception as e:
        return func.HttpResponse(f"Server Error: {str(e)}", status_code=500)

# --- 3. Info Hub Vault (With Admin Global Push) ---
@app.route(route="save_info_page", methods=["POST"])
def save_info_page(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()
        page_id = req_body.get('id')
        user_id = req_body.get('authorId')
        is_global = req_body.get('isGlobal', False)

        if not page_id or not user_id: 
            return func.HttpResponse("Error: Missing Page ID or User ID.", status_code=400)

        # The Partition Routing Logic
        partition_key = "GLOBAL_HUB" if is_global else str(user_id)

        connection_string = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=connection_string)
        
        table_name = "KoreInfoHub"
        try: service_client.create_table(table_name)
        except ResourceExistsError: pass 
            
        table_client = service_client.get_table_client(table_name=table_name)
        
        entity = {
            "PartitionKey": partition_key,
            "RowKey": str(page_id),
            "Title": req_body.get('title', 'Untitled'),
            "RawJSON": json.dumps(req_body) 
        }
        
        table_client.upsert_entity(entity=entity)
        return func.HttpResponse(json.dumps({"status": "success", "partition": partition_key}), mimetype="application/json", status_code=200)
    except Exception as e:
        return func.HttpResponse(f"Server Error: {str(e)}", status_code=500)

@app.route(route="get_info_pages", methods=["GET"])
def get_info_pages(req: func.HttpRequest) -> func.HttpResponse:
    try:
        user_id = req.params.get('userId')
        if not user_id: return func.HttpResponse("Error: User ID required to sync.", status_code=400)

        connection_string = os.environ.get("KORE_DB_CONNECTION")
        service_client = TableServiceClient.from_connection_string(conn_str=connection_string)
        table_client = service_client.get_table_client(table_name="KoreInfoHub")

        # Fetch both the User's Personal pages AND the Global Admin pages
        query = f"PartitionKey eq '{user_id}' or PartitionKey eq 'GLOBAL_HUB'"
        entities = list(table_client.query_entities(query_filter=query))

        # Extract the raw JSON payloads
        pages = [json.loads(e['RawJSON']) for e in entities]
        
        return func.HttpResponse(json.dumps(pages), mimetype="application/json", status_code=200)
    except Exception as e:
        # If table doesn't exist yet, just return an empty array
        return func.HttpResponse("[]", mimetype="application/json", status_code=200)
