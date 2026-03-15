#  uv add fastapi uvicorn livekit-api
# npm install @livekit/components-react @livekit/components-styles livekit-client
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from livekit.api import AccessToken, VideoGrants
import os
from dotenv import load_dotenv

load_dotenv(".env.local")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/get_token")
def get_livekit_token(room_name: str, participant_name: str):
    """
    Send get request to my local server:
    http://localhost:8000/get_token?room_name=test-room&participant_name=user1
    """
    # Grant API token for frontteam and Users..?
    grant = VideoGrants(room_join=True, room=room_name)
    
    access_token = AccessToken(
        os.getenv("LIVEKIT_API_KEY"),
        os.getenv("LIVEKIT_API_SECRET")
    )
    access_token.with_identity(participant_name)
    access_token.with_grants(grant)

    # return
    return {"token": access_token.to_jwt()}

# uv run uvicorn server:app --reload

#I Think you need to use Livekit React SDK to coonect to AI Agent?
#After the token is fetched, we should use LiveKitRoom to wrap our voice interface?? I still need to look into that.
