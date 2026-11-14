import urllib.request, json

caido_base = "http://127.0.0.1:32769"

def gql(query):
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(caido_base + "/graphql",
        data=json.dumps({"query": query}).encode(), headers=headers, method="POST")
    try:
        r = urllib.request.urlopen(req, timeout=10)
        return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())

# Try simple query
print("=== Login attempt ===")
resp = gql("mutation { loginAsGuest { token { accessToken } } }")
print(json.dumps(resp, indent=2)[:500])

# Try introspection to see what's available
print("\n=== Available queries ===")
try:
    introspection = gql("""
    { __schema { queryType { name } types { name } } }
    """)
    print(json.dumps(introspection, indent=2)[:1000])
except Exception as e:
    print(f"Error: {e}")

# Try schema introspection
print("\n=== Mutation types ===")
try:
    resp2 = gql("""
    { __schema { mutationType { name } } }
    """)
    print(json.dumps(resp2, indent=2)[:500])
except Exception as e:
    print(f"Error: {e}")
