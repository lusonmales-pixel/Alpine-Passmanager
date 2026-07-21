package crypto

import "crypto/rand"

func GenerateRandomBytes(size int64) ([]byte, error) {
	randBytes := make([]byte, size)

	_, err := rand.Read(randBytes)
	if err != nil {
		return nil, err
	}

	return randBytes, nil

}
