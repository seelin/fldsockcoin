from fastapi import FastAPI, Request
from workers import WorkerEntrypoint

class Default(WorkerEntrypoint):    
     async def fetch(self, request):        
          name = (await request.json()).name        
          return Response(f"name:{name}")
