package crypto

import "crypto/sha256"

func CreateVerifier(authKey []byte) []byte {
	verifier := sha256.Sum256(authKey)
	return verifier[:]
}
