package crypto

import "golang.org/x/crypto/argon2"

func DeriveMasterKey(password string, salt []byte) []byte {
	encMasterKey := argon2.IDKey([]byte(password), salt, 4, 65536, 2, 32)

	return encMasterKey

}
