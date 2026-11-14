import urllib.request, json

caido_base = "http://127.0.0.1:32769"

def gql(query):
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(caido_base + "/graphql",
        data=json.dumps({"query": query}).encode(), headers=headers, method="POST")
    r = urllib.request.urlopen(req, timeout=10)
    return json.loads(r.read().decode())

# Get login token
resp = gql("mutation { loginAsGuest { token { accessToken } } }")
token = resp["data"]["loginAsGuest"]["token"]["accessToken"]

# Check the signature of the requests field
print("=== requests field signature ===")
sig = gql("""
{ __type(name: "QueryRoot") { fields { name args { name description type { name kind ofType { name kind ofType { name kind } } } } } } }
""")
data = sig.get("data", {}).get("__type", {}).get("fields", [])
req_fields = [f for f in data if f.get("name") in ("requests", "request", "requestsByOffset")]
for f in req_fields:
    print(f"\nField: {f['name']}")
    for arg in f.get("args", []):
        print(f"  arg: {arg['name']}")

# Try a simple requests query
print("\n=== Simple requests query ===")
test = gql("{ requests(first: 3) { edges { node { id method host path } } } }")
print(json.dumps(test, indent=2))

# Also try requestsByOffset
print("\n=== requestsByOffset query ===")
test2 = gql("{ requestsByOffset(first: 3) { nodes { id method host path } } }")
print(json.dumps(test2, indent=2))
