import azure.functions as func
import logging

# Initialize the Azure Function App
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@app.route(route="ping")
def ping(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Kore system ping requested.')
    
    return func.HttpResponse(
        "Kore Enterprise Backend is online, secure, and ready for data transmission.",
        status_code=200
    )
