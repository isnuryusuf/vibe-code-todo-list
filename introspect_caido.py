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

# Find all fields on QueryRoot that contain "request"
print("=== Looking for request-related fields ===")
introspection = gql("""
{ __type(name: "QueryRoot") { fields { name description } } }
""")
fields = introspection.get("data", {}).get("__type", {}).get("fields", [])
request_fields = [f for f in fields if "request" in f.get("name", "").lower() or "http" in f.get("name", "").lower()]
for f in request_fields:
    print(f"  {f['name']}: {f.get('description', 'N/A')}")

# Find fields on MutationRoot related to requests
print("\n=== Looking for request-related mutations ===")
mut_introspection = gql("""
{ __type(name: "MutationRoot") { fields { name description } } }
""")
mut_fields = mut_introspection.get("data", {}).get("__type", {}).get("fields", [])
request_mutations = [f for f in mut_fields if "request" in f.get("name", "").lower() or "proxy" in f.get("name", "").lower()]
for f in request_mutations:
    print(f"  {f['name']}: {f.get('description', 'N/A')}")
