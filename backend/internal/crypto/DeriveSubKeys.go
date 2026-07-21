package crypto

import (
	"crypto/sha256"
	"io"

	"golang.org/x/crypto/hkdf"
)

func DeriveSubKeys(masterKey []byte) (auth []byte, enc []byte, err error) {
	encReader := hkdf.New(sha256.New, masterKey, nil, []byte("encryption"))
	authReader := hkdf.New(sha256.New, masterKey, nil, []byte("auth"))

	encKeyBuf := make([]byte, 32)
	authKeyBuf := make([]byte, 32)

	_, err = io.ReadFull(encReader, encKeyBuf)
	if err != nil {
		return nil, nil, err
	}
	_, err = io.ReadFull(authReader, authKeyBuf)
	if err != nil {
		return nil, nil, err
	}

	return authKeyBuf, encKeyBuf, nil
}
