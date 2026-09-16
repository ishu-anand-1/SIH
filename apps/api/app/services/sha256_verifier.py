import hashlib

def generate_sha256_hash(data: str | bytes) -> str:
    if isinstance(data, str):
        data = data.encode('utf-8')
    return hashlib.sha256(data).hexdigest()

def verify_sha256_hash(data: str | bytes, expected_hash: str) -> bool:
    actual = generate_sha256_hash(data)
    return actual.lower() == expected_hash.lower()


# Backward-compatible alias used by the inspection API.
def calculate_sha256(data: str | bytes) -> str:
    return generate_sha256_hash(data)
