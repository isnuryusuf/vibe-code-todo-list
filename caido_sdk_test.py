import asyncio
from caido_sdk_client import Client, TokenAuthOptions
import urllib.request, json

caido_url = "http://127.0.0.1:32769"

async def main():
    login_req = urllib.request.Request(
        f"{caido_url}/graphql",
        data=json.dumps({"query": "mutation { loginAsGuest { token { accessToken } } }"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(login_req, timeout=10) as resp:
        login_data = json.loads(resp.read().decode())
    token = login_data["data"]["loginAsGuest"]["token"]["accessToken"]
    
    client = Client(caido_url, auth=TokenAuthOptions(token=token))
    await client.connect()

    # Get connections (list of requests)
    print("=== Fetching connections ===")
    try:
        builder = client.request.list().first(200).include_raw()
        connections = await builder.execute()
        print(f"Type: {type(connections).__name__}")
        print(f"Dir: {[a for a in dir(connections) if not a.startswith('_')]}")
        
        # Connections might be iterable
        items = list(connections)
        print(f"Items count: {len(items)}")
        print(f"Item type: {type(items[0]).__name__ if items else 'empty'}")
        if items:
            print(f"First item attrs: {[a for a in dir(items[0]) if not a.startswith('_')][:20]}")
        
        requests_list = items
        api_vmx = [r for r in requests_list if "api.vmx.id" in (r.host or "")]
        print(f"\napi.vmx.id requests: {len(api_vmx)}")

        for r in api_vmx[:30]:
            status = r.response.status_code if r.response else "N/A"
            print(f"  [{r.id}] {r.method} {r.path} -> {status}")

        health = [r for r in api_vmx if r.path == "/health"]
        if health:
            print(f"\n=== /health request details ===")
            detail = await client.request.get(health[0].id)
            if detail.response:
                resp = detail.response
                print(f"Status: {resp.status_code}")
                print(f"Content-Type: {resp.content_type}")
                print(f"Body (raw): {resp.raw[:500]}")
                print(f"Body (text): {resp.body[:500]}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

    # All hosts
    print("\n=== All unique hosts ===")
    try:
        all_conns = await client.request.list().first(500).include_raw().execute()
        all_reqs = list(all_conns)
        print(f"Total: {len(all_reqs)}")
        hosts = {}
        for r in all_reqs:
            if r.host:
                hosts[r.host] = hosts.get(r.host, 0) + 1
        for h in sorted(hosts, key=hosts.get, reverse=True):
            print(f"  {h}: {hosts[h]}")
    except Exception as e:
        print(f"Error: {e}")

    await client.aclose()

asyncio.run(main())
