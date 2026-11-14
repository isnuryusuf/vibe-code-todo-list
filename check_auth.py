import urllib.request, json

caido_base = "http://127.0.0.1:32769"

def gql(query, token=None):
    data = json.dumps({"query": query}).encode()
    req = urllib.request.Request(caido_base + "/graphql", data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    # Also try as cookie
    if token:
        req.add_header("Cookie", f"Authorization=Bearer%20{token}")
        req.add_header("Set-Cookie", f"Authorization=Bearer%20{token}")
    try:
        r = urllib.request.urlopen(req, timeout=10)
        return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read().decode())
        except:
            return {"error": e.read().decode()[:500]}

# Get login token
resp = gql("mutation { loginAsGuest { token { accessToken } } }")
token = resp["data"]["loginAsGuest"]["token"]["accessToken"]
print(f"Token: {token[:60]}...")

# Try without any auth - maybe loginAsGuest is guest-level
print("\n=== Try requests without Bearer auth ===")
test1 = gql("mutation { loginAsGuest { token { accessToken } } }")
print(json.dumps(test1, indent=2)[:300])

# Try with cookie
print("\n=== Try with Cookie header ===")
data = json.dumps({"query": "{ requests(first: 3) { edges { node { id method host path } } } }"}).encode()
req = urllib.request.Request(caido_base + "/graphql", data=data, method="POST")
req.add_header("Content-Type", "application/json")
req.add_header("Cookie", f"Authorization=Bearer%20{token}")
try:
    r = urllib.request.urlopen(req, timeout=10)
    print(json.dumps(json.loads(r.read().decode()), indent=2)[:500])
except urllib.error.HTTPError as e:
    try:
        print(json.dumps(json.loads(e.read().decode()), indent=2)[:500])
    except:
        print(f"HTTP Error: {e}")

# Try with x-token header
print("\n=== Try with X-Token header ===")
data = json.dumps({"query": "{ requests(first: 3) { edges { node { id method host path } } } }"}).encode()
req = urllib.request.Request(caido_base + "/graphql", data=data, method="POST")
req.add_header("Content-Type", "application/json")
req.add_header("X-Token", token)
try:
    r = urllib.request.urlopen(req, timeout=10)
    print(json.dumps(json.loads(r.read().decode()), indent=2)[:500])
except urllib.error.HTTPError as e:
    try:
        print(json.dumps(json.loads(e.read().decode()), indent=2)[:500])
    except:
        print(f"HTTP Error: {e}")
