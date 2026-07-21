package crypto

import (
	"crypto/aes"
	"crypto/cipher"
)

func EcnryptData(key []byte, plaintext []byte) (ciphertext []byte, nonce []byte, err error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, nil, err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return nil, nil, err
	}

	nonce, err = GenerateRandomBytes(int64(aesGCM.NonceSize()))
	if err != nil {
		return nil, nil, err
	}

	ciphertext = aesGCM.Seal(nil, nonce, plaintext, nil)

	return ciphertext, nonce, nil
}
