from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import base64
import os

class EncryptionManager:
    def __init__(self):
        # Generate RSA Keys on startup (In production, load these from secure storage)
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        self.public_key = self.private_key.public_key()

    def get_public_key_pem(self):
        """Export Public Key in PEM format for the Frontend"""
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')

    def decrypt_payload(self, encrypted_aes_key_b64, iv_b64, encrypted_data_b64):
        """
        1. Decrypt AES Key using RSA Private Key
        2. Decrypt Data using AES Key
        """
        try:
            # Decode Base64 inputs
            encrypted_aes_key = base64.b64decode(encrypted_aes_key_b64)
            iv = base64.b64decode(iv_b64)
            ciphertext = base64.b64decode(encrypted_data_b64)

            # 1. RSA Decrypt: Get the AES Session Key
            aes_key = self.private_key.decrypt(
                encrypted_aes_key,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )

            # 2. AES-GCM Decrypt: Get the actual JSON data
            aesgcm = AESGCM(aes_key)
            decrypted_data = aesgcm.decrypt(iv, ciphertext, None)
            
            return decrypted_data.decode('utf-8')

        except Exception as e:
            print(f"Decryption Error: {e}")
            return None

# Singleton Instance
crypto_manager = EncryptionManager()