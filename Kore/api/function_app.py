import azure.functions as func
import logging
import json
import os
from azure.data.tables import TableServiceClient
from azure.core.exceptions import ResourceExistsError

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@app.route(route="ping")
def ping(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Kore system ping requested.')
    return func.HttpResponse(
        "Kore Enterprise Backend is online, secure, and ready for data transmission.",
        status_code=200
    )

@app.route(route="save_work_item", methods=["POST"])
def save_work_item(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Incoming secure transmission: Saving Work Tracker item.')
    
    try:
        # 1. Parse the incoming JSON data from your frontend
        req_body = req.get_json()
        ticket_id = req_body.get('id')
        
        if not ticket_id:
            return func.HttpResponse("Error: Missing Ticket ID.", status_code=400)

        # 2. Connect to the Azure Vault
        connection_string = os.environ.get("KORE_DB_CONNECTION")
        if not connection_string:
            return func.HttpResponse("Server Error: Database connection string missing.", status_code=500)
            
        service_client = TableServiceClient.from_connection_string(conn_str=connection_string)
        
        # 3. Create the table if this is the first time running
        table_name = "KoreWorkTracker"
        try:
            service_client.create_table(table_name)
        except ResourceExistsError:
            pass # Table already exists, proceed normally
            
        table_client = service_client.get_table_client(table_name=table_name)
        
        # 4. Format the data for Azure NoSQL (Requires PartitionKey and RowKey)
        entity = {
            "PartitionKey": "WorkTicket",
            "RowKey": str(ticket_id),
            "Title": req_body.get('title', 'Untitled'),
            "Status": req_body.get('status', 'Pending'),
            "RawJSON": json.dumps(req_body) # Safely stores the entire ticket package
        }
        
        # 5. Upsert (Update if exists, Insert if new)
        table_client.upsert_entity(entity=entity)
        
        return func.HttpResponse(
            json.dumps({"status": "success", "message": f"Ticket {ticket_id} secured in Azure Table Storage."}),
            mimetype="application/json",
            status_code=200
        )
        
    except Exception as e:
        logging.error(f"Database Routing Error: {str(e)}")
        return func.HttpResponse(f"Internal Server Error: {str(e)}", status_code=500)
